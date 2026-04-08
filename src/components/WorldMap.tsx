import React, { useMemo, useCallback, useRef, useState } from 'react'
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
// d3-force installed but using candidate-based placement for predictability
import type { City } from '../data/cities'
import { CITIES } from '../data/cities'
import { useWorldTimeStore } from '../store/useWorldTimeStore'
import { getCurrentHour } from '../utils/timeUtils'
import { getUtcOffsetHours } from '../utils/timezoneColors'
import './WorldMap.css'

// Minimal basemap style — only background + water, no labels/boundaries/roads
const MAP_STYLE: any = {
  version: 8,
  sources: {
    openmaptiles: {
      type: 'vector',
      url: 'https://tiles.openfreemap.org/planet',
    },
  },
  glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
  layers: [
    { id: 'background', type: 'background', paint: { 'background-color': '#e8f4f0' } },
  ],
}
const ADMIN1_URL = '/ne_admin1.geojson'
const TZ_BOUNDS_URL = '/tz-boundaries.geojson'
const COASTLINE_URL = '/coastline.geojson'

const REPRESENTATIVE_CITY_IDS = new Set([
  'tokyo', 'beijing',
  'singapore', 'bangkok',
  'mumbai', 'dubai',
  'moscow',
  'london', 'paris',
  'newyork', 'chicago', 'losangeles',
  'saopaulo',
  'sydney',
])

// ── Label placement: candidate-based with global iteration ──────────────────
const D = 12        // distance from dot to label edge
const LW = 58       // label width (10px font, ~6-7 chars + padding)
const LH = 34       // label height (10px×2 lines×1.3 + 8px padding)
const DOT_SZ = 10   // dot collision size (matches CSS)

function getCityTime(timezone: string, now: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)
}

export default function WorldMap() {
  const { bars, now, addCity, removeBar } = useWorldTimeStore()
  const mapRef = useRef<MapRef>(null)
  const [aboveCities, setAboveCities] = useState<Set<string>>(new Set())
  const [showCities, setShowCities] = useState(true)
  const [customTime, setCustomTime] = useState<Date | null>(null)
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const [dateOffset, setDateOffset] = useState(0)  // scroll offset for date strip
  const activeTime = customTime ?? now

  // Night zones based on current UTC time
  const nightGeoJson = useMemo((): GeoJSON.FeatureCollection => {
    const utcH = activeTime.getUTCHours() + activeTime.getUTCMinutes() / 60

    function makeZone(startHour: number, endHour: number, zone: string): GeoJSON.Feature[] {
      // Local time startHour → endHour covers these longitudes
      const leftLng = ((startHour - utcH) * 15 + 540) % 360 - 180
      const rightLng = ((endHour - utcH) * 15 + 540) % 360 - 180

      function rect(l: number, r: number): GeoJSON.Feature {
        return {
          type: 'Feature', properties: { zone },
          geometry: { type: 'Polygon', coordinates: [[[l,-85],[r,-85],[r,85],[l,85],[l,-85]]] },
        }
      }

      if (leftLng < rightLng) return [rect(leftLng, rightLng)]
      // Wraps around date line
      return [rect(leftLng, 180), rect(-180, rightLng)]
    }

    return {
      type: 'FeatureCollection',
      features: [
        ...makeZone(6, 12, 'morning'),     // 6AM - noon: light beige
        ...makeZone(12, 18, 'afternoon'),   // noon - 6PM: darker beige
        ...makeZone(18, 24, 'evening'),     // 6PM - midnight: gray
        ...makeZone(0, 6, 'night'),         // midnight - 6AM: dark
      ],
    }
  }, [now])

  const repCities = useMemo(
    () => CITIES.filter((c) => REPRESENTATIVE_CITY_IDS.has(c.id)),
    []
  )

  // On map load: detect label overlaps and move some above
  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return

    setTimeout(() => {
      // Project all cities to screen coordinates
      const projected = repCities.map(c => ({
        id: c.id,
        x: map.project([c.lng, c.lat]).x,
        y: map.project([c.lng, c.lat]).y,
      }))

      const above = new Set<string>()

      // Label box for a city: returns [left, top, right, bottom]
      function labelBox(p: typeof projected[0], isAbove: boolean): [number, number, number, number] {
        const top = isAbove ? p.y - D - LH : p.y + D
        return [p.x - LW / 2, top, p.x + LW / 2, top + LH]
      }

      function boxesOverlap(a: [number, number, number, number], b: [number, number, number, number]) {
        return a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1]
      }

      function hitsDot(box: [number, number, number, number], dotX: number, dotY: number) {
        return box[0] < dotX + DOT_SZ / 2 && box[2] > dotX - DOT_SZ / 2 &&
               box[1] < dotY + DOT_SZ / 2 && box[3] > dotY - DOT_SZ / 2
      }

      // Pass 1: find overlapping "below" labels or labels covering other dots
      for (let i = 0; i < projected.length; i++) {
        if (above.has(projected[i].id)) continue
        for (let j = i + 1; j < projected.length; j++) {
          if (above.has(projected[j].id)) continue
          const boxA = labelBox(projected[i], false)
          const boxB = labelBox(projected[j], false)
          // Check label-label overlap OR label covering another dot
          const labelsOverlap = boxesOverlap(boxA, boxB)
          const aHitsJDot = hitsDot(boxA, projected[j].x, projected[j].y)
          const bHitsIDot = hitsDot(boxB, projected[i].x, projected[i].y)
          if (labelsOverlap || aHitsJDot || bHitsIDot) {
            // Move the one whose "above" doesn't hit any other dot
            const bAbove = labelBox(projected[j], true)
            const bAboveHitsAny = projected.some(p => p.id !== projected[j].id && hitsDot(bAbove, p.x, p.y))
            if (!bAboveHitsAny) {
              above.add(projected[j].id)
            } else {
              above.add(projected[i].id)
            }
          }
        }
      }

      // Pass 2: check above labels don't overlap each other or below labels
      for (let i = 0; i < projected.length; i++) {
        if (!above.has(projected[i].id)) continue
        for (let j = 0; j < projected.length; j++) {
          if (i === j) continue
          const boxA = labelBox(projected[i], true)
          const boxB = labelBox(projected[j], above.has(projected[j].id))
          if (boxesOverlap(boxA, boxB)) {
            // Conflict — try swapping: put i back below, j above
            above.delete(projected[i].id)
            above.add(projected[j].id)
            break
          }
        }
      }

      setAboveCities(above)
    }, 300)
  }, [repCities])

  const registeredCityIds = useMemo(
    () => new Set(bars.map((b) => b.city?.id).filter(Boolean)),
    [bars]
  )

  const toggleCity = useCallback((city: City) => {
    const idx = bars.findIndex((b) => b.city?.id === city.id)
    if (idx !== -1) removeBar(idx)
    else addCity(city)
  }, [bars, addCity, removeBar])

  return (
    <div className="worldmap-wrapper">
    <div className="worldmap-container">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 15, latitude: 25, zoom: 0.8 }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        scrollZoom={false}
        boxZoom={false}
        doubleClickZoom={false}
        dragPan={false}
        dragRotate={false}
        keyboard={false}
        touchZoomRotate={false}
        touchPitch={false}
        onLoad={onMapLoad}
      >
        {/* Night overlay on ocean — rendered below land so only ocean shows */}
        <Source id="night-zones" type="geojson" data={nightGeoJson}>
          <Layer id="morning-zone" type="fill"
            filter={['==', ['get', 'zone'], 'morning']}
            paint={{ 'fill-color': 'rgba(200,170,80,0.08)' }} />
          <Layer id="afternoon-zone" type="fill"
            filter={['==', ['get', 'zone'], 'afternoon']}
            paint={{ 'fill-color': 'rgba(200,170,80,0.15)' }} />
          <Layer id="evening-zone" type="fill"
            filter={['==', ['get', 'zone'], 'evening']}
            paint={{ 'fill-color': 'rgba(0,0,30,0.12)' }} />
          <Layer id="night-zone" type="fill"
            filter={['==', ['get', 'zone'], 'night']}
            paint={{ 'fill-color': 'rgba(0,0,30,0.25)' }} />
        </Source>

        {/* Hourly timezone grid lines (behind land) */}
        <Source id="tz-grid" type="geojson" data={{
          type: 'FeatureCollection',
          features: Array.from({ length: 25 }, (_, i) => ({
            type: 'Feature' as const,
            properties: {},
            geometry: { type: 'LineString' as const, coordinates: [[(i - 12) * 15, -85], [(i - 12) * 15, 85]] },
          })),
        }}>
          <Layer id="tz-grid-lines" type="line"
            paint={{ 'line-color': 'rgba(0,0,0,0.08)', 'line-width': 0.5, 'line-dasharray': [2, 2] }} />
        </Source>

        {/* Admin-1 timezone fill */}
        <Source id="admin1" type="geojson" data={ADMIN1_URL}>
          <Layer
            id="admin1-fill"
            type="fill"
            paint={{ 'fill-color': ['get', 'tzColor'], 'fill-opacity': 1 }}
          />
        </Source>

        {/* Coastline — all land merged, only sea-land boundary */}
        <Source id="coastline" type="geojson" data={COASTLINE_URL}>
          <Layer
            id="coastline-line"
            type="line"
            paint={{ 'line-color': 'rgba(0,0,0,0.2)', 'line-width': 1.5 }}
          />
        </Source>

        {/* Country borders — drawn ON TOP of timezone fill */}
        <Layer
          id="country-border"
          type="line"
          source="openmaptiles"
          source-layer="boundary"
          filter={['all', ['==', 'admin_level', 2], ['!=', 'maritime', 1]]}
          paint={{ 'line-color': '#ffffff', 'line-width': 0.2 }}
        />

        {/* Timezone boundary lines — only between different-timezone regions */}
        <Source id="tz-bounds" type="geojson" data={TZ_BOUNDS_URL}>
          <Layer
            id="tz-boundary-lines"
            type="line"
            paint={{ 'line-color': '#ffffff', 'line-width': 1, 'line-dasharray': [2, 2] }}
          />
        </Source>



        {showCities && <>
        {/* Date change tab */}
        {(() => {
          const utcH = activeTime.getUTCHours() + activeTime.getUTCMinutes() / 60
          const midLng = ((0 - utcH) * 15 + 540) % 360 - 180
          const westOffsetH = Math.round((midLng - 7.5) / 15)
          const westLocal = new Date(activeTime.getTime() + westOffsetH * 3600000)
          const eastLocal = new Date(westLocal.getTime() + 86400000)
          const fmt = (d: Date) => {
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
            return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`
          }
          return (
            <Marker longitude={midLng} latitude={-60} anchor="bottom">
              <div className="date-label-tab">{fmt(westLocal)} | {fmt(eastLocal)}</div>
            </Marker>
          )
        })()}

        {/* City markers */}
        {repCities.map((city) => {
          const isRegistered = registeredCityIds.has(city.id)
          const timeStr = getCityTime(city.timezone, activeTime)
          const isAbove = aboveCities.has(city.id)
          const lineY = isAbove ? -D : D
          const labelY = isAbove ? -(D + LH) : D
          return (
            <Marker key={city.id} longitude={city.lng} latitude={city.lat} style={{ overflow: 'visible' }}>
              <div className={`city-ml-root${isRegistered ? ' active' : ''}`} onClick={() => toggleCity(city)}>
                {/* Connecting line */}
                <svg width="0" height="0" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
                  <line x1={0} y1={0} x2={0} y2={lineY} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
                </svg>
                {/* Dot */}
                <div className={`city-ml-dot${isRegistered ? ' city-ml-dot--active' : ''}`} />
                {/* Label box */}
                <div
                  className="city-ml-label"
                  style={{ transform: `translate(-50%, ${labelY}px)` }}
                >
                  <span className="city-ml-name">{city.nameEn}</span>
                  <span className="city-ml-time">{timeStr}</span>
                </div>
              </div>
            </Marker>
          )
        })}
        </>}
      </Map>

      <button className="toggle-cities-btn" onClick={() => setShowCities(v => !v)}>
        {showCities ? 'Hide Cities' : 'Show Cities'}
      </button>

    </div>

    {/* Bottom panels */}
    {(() => {
      const firstIdx = 0  // always slot 0
      const firstCity = bars[0].city
      const allHours = Array.from({ length: 24 }, (_, i) => i)  // 0-23

      function renderBar(_barIdx: number, city: NonNullable<typeof firstCity>, _isFirst: boolean) {
        const currentHour = getCurrentHour(city.timezone, activeTime)
        let hours: number[]

        if (_isFirst || !firstCity) {
          hours = allHours
        } else {
          const refHour = getCurrentHour(firstCity.timezone, activeTime)
          const diff = currentHour - refHour
          hours = allHours.map(h => ((h + diff + 24) % 24))
        }

        return (
          <div className="city-timebar">

            <span className="city-timebar-name">{city.nameEn}</span>
            <div className="city-timebar-bar-wrap">
              {/* Date markers row above the bar */}
              <div className="city-timebar-dates">
                {hours.map((h, j) => {
                  // Show date above 00, or time diff above current hour (for non-first bars)
                  if (Math.round(h) === 0) {
                    // For reference: 00 = start of active date
                    // For others: 00 = start of (active date + 1) if ahead, same date if behind
                    const refDate = new Date(activeTime.toLocaleString('en-US', { timeZone: firstCity?.timezone ?? city.timezone }))
                    let day = refDate.getDate()
                    if (!_isFirst && firstCity) {
                      const diff = getUtcOffsetHours(city.timezone) - getUtcOffsetHours(firstCity.timezone)
                      if (diff > 0) day = day + 1
                    }
                    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'
                    return <div key={j} className="date-marker-cell has-date">{day}{suffix}</div>
                  }
                  // Show date above first cell (position 0) for non-reference bars
                  if (!_isFirst && j === 0 && h !== currentHour) {
                    const refDate = new Date(activeTime.toLocaleString('en-US', { timeZone: firstCity?.timezone ?? city.timezone }))
                    const diff = getUtcOffsetHours(city.timezone) - getUtcOffsetHours(firstCity!.timezone)
                    let day = refDate.getDate()
                    if (diff < 0) day = day  // behind: first cell might be previous day
                    // The first cell shows the hour that maps to reference hour 0
                    // If that hour > 12, it's from the previous day
                    if (Math.round(h) > 12) day = day - 1
                    if (day <= 0) day = new Date(refDate.getFullYear(), refDate.getMonth(), 0).getDate()
                    const suffix = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th'
                    return <div key={j} className="date-marker-cell has-date">{day}{suffix}</div>
                  }
                  if (!_isFirst && firstCity && h === currentHour) {
                    const diff = Math.round(getUtcOffsetHours(city.timezone) - getUtcOffsetHours(firstCity.timezone))
                    const sign = diff >= 0 ? '+' : ''
                    return <div key={j} className={`date-marker-cell has-diff ${diff >= 0 ? 'plus' : 'minus'}`}>{sign}{diff}h</div>
                  }
                  return <div key={j} className="date-marker-cell" />
                })}
              </div>
              <div className="city-timebar-hours">
                {hours.map((h, j) => (
                  <div
                    key={j}
                    className={`city-timebar-cell${h === currentHour ? ' current' : ''}${hoverCol === j ? ' col-hover' : ''}${Math.round(h) >= 9 && Math.round(h) <= 17 ? ' biz-hour' : ''}${Math.round(h) === 0 ? ' date-change' : ''} hour-${Math.round(h) < 6 ? 'night' : Math.round(h) < 12 ? 'morning' : Math.round(h) < 18 ? 'afternoon' : 'evening'}`}
                    onMouseEnter={() => setHoverCol(j)}
                    onMouseLeave={() => setHoverCol(null)}
                  >
                    {String(Math.round(h)).padStart(2, '0')}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      }

      // const others removed — using fixed slots [1,2]

      return (<>
        {/* Primary city panel — always shown */}
          <div className="bottom-panel primary-panel">
            {/* Date strip + mode buttons */}
            <div className="date-strip-row">
              <button className="date-nav" onClick={() => {
                setDateOffset(o => o - 7)
                const strip = document.querySelector('.date-strip')
                if (strip) strip.scrollBy({ left: -210, behavior: 'smooth' })
              }}>◀</button>
              <div className="date-strip">
                {Array.from({ length: 60 }, (_, i) => {
                  const d = new Date(now)
                  d.setDate(d.getDate() + i + dateOffset)
                  const isToday = i + dateOffset === 0 && !customTime
                  const isSelected = customTime && (() => {
                    const tz = firstCity?.timezone ?? 'UTC'
                    const tzd = new Date(activeTime.toLocaleString('en-US', { timeZone: tz }))
                    return tzd.getFullYear() === d.getFullYear() && tzd.getMonth() === d.getMonth() && tzd.getDate() === d.getDate()
                  })()
                  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6
                  return (
                    <button
                      key={i}
                      className={`date-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${isWeekend ? ' weekend' : ''}`}
                      onClick={() => {
                        const tz = firstCity?.timezone ?? 'UTC'
                        const offset = getUtcOffsetHours(tz)
                        const currentLocal = new Date(now.toLocaleString('en-US', { timeZone: tz }))
                        setCustomTime(new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), currentLocal.getHours() - offset, currentLocal.getMinutes())))
                      }}
                    >
                      <span className="date-cell-day">{dayNames[d.getDay()]}</span>
                      <span className="date-cell-num">{d.getDate()}</span>
                    </button>
                  )
                })}
              </div>
              <button className="date-nav" onClick={() => {
                setDateOffset(o => o + 7)
                const strip = document.querySelector('.date-strip')
                if (strip) strip.scrollBy({ left: 210, behavior: 'smooth' })
              }}>▶</button>
              <button className="reset-time-btn" onClick={() => { setCustomTime(null); setDateOffset(0) }}>Today</button>
            </div>
            {firstCity ? renderBar(firstIdx, firstCity, true) : (
              <div className="city-timebar empty"><span className="city-timebar-hint">Click a city on the map</span></div>
            )}
          </div>

        {/* Other cities panel — always show 2 slots */}
          <div className="bottom-panel secondary-panel">
            {[1, 2].map(slot => {
              const b = bars[slot]
              if (b?.city) return <React.Fragment key={slot}>{renderBar(slot, b.city, false)}</React.Fragment>
              return <div key={slot} className="city-timebar empty"><span className="city-timebar-hint">Click a city on the map</span></div>
            })}
          </div>
      </>)
    })()}
    </div>
  )
}

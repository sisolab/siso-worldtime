import { useMemo, useCallback, useRef, useState } from 'react'
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
// d3-force installed but using candidate-based placement for predictability
import type { City } from '../data/cities'
import { CITIES } from '../data/cities'
import { useWorldTimeStore } from '../store/useWorldTimeStore'
import { getCurrentHour } from '../utils/timeUtils'
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

  // Night zones based on current UTC time
  const nightGeoJson = useMemo((): GeoJSON.FeatureCollection => {
    const utcH = now.getUTCHours() + now.getUTCMinutes() / 60

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



        {/* Date change label at midnight line */}
        {(() => {
          const utcH = now.getUTCHours() + now.getUTCMinutes() / 60
          const midLng = ((0 - utcH) * 15 + 540) % 360 - 180

          const westOffsetH = Math.round((midLng - 7.5) / 15)
          const westLocal = new Date(now.getTime() + westOffsetH * 3600000)
          const eastLocal = new Date(westLocal.getTime() + 86400000)

          return (
            <Marker longitude={midLng} latitude={-55} anchor="center">
              <span className="date-label">{westLocal.getUTCDate()} → {eastLocal.getUTCDate()}</span>
            </Marker>
          )
        })()}

        {/* City markers */}
        {repCities.map((city) => {
          const isRegistered = registeredCityIds.has(city.id)
          const timeStr = getCityTime(city.timezone, now)
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
      </Map>

    </div>

    {/* Bottom panel — outside worldmap-container to avoid overflow:hidden */}
    <div className="bottom-panel">
      {bars.map((b, i) => {
        if (!b.city) return null
        const city = b.city
        const currentHour = getCurrentHour(city.timezone, now)
        const hours = Array.from({ length: 9 }, (_, j) => (currentHour - 4 + j + 24) % 24)
        const timeStr = getCityTime(city.timezone, now)
        return (
          <div key={i} className="city-timebar">
            <button className="city-timebar-remove" onClick={() => removeBar(i)}>×</button>
            <span className="city-timebar-name">{city.nameEn}</span>
            <span className="city-timebar-time">{timeStr}</span>
            <div className="city-timebar-hours">
              {hours.map((h, j) => (
                <div key={j} className={`city-timebar-cell${h === currentHour ? ' current' : ''}`}>
                  {String(h).padStart(2, '0')}
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
    </div>
  )
}

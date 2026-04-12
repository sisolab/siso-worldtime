import React, { useMemo, useCallback, useRef, useState } from 'react'
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { CITIES, type City } from '../data/cities'
import { useWorldTimeStore } from '../store/useWorldTimeStore'
import { computeAboveCities } from '../utils/labelPlacement'
import {
  MAP_STYLE_LIGHT, MAP_STYLE_DARK, ADMIN1_URL, TZ_BOUNDS_URL, COASTLINE_URL,
  TZ_ABBR_MAP, REPRESENTATIVE_CITY_IDS, LABEL_GAP,
} from '../constants/map'
import CityTimeBar from './CityTimeBar'
import DateStrip from './DateStrip'
import './WorldMap.css'

// ── Helpers ─────────────────────────────────────────────────────────────────

function getCityTime(timezone: string, date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone, hour: '2-digit', minute: '2-digit', hour12: false,
  }).format(date)
}

/** Generate GeoJSON for day/night ocean overlay zones */
function buildNightGeoJson(activeTime: Date): GeoJSON.FeatureCollection {
  const utcH = activeTime.getUTCHours() + activeTime.getUTCMinutes() / 60

  function makeZone(startHour: number, endHour: number, zone: string): GeoJSON.Feature[] {
    const leftLng = ((startHour - utcH) * 15 + 540) % 360 - 180
    const rightLng = ((endHour - utcH) * 15 + 540) % 360 - 180
    const rect = (l: number, r: number): GeoJSON.Feature => ({
      type: 'Feature', properties: { zone },
      geometry: { type: 'Polygon', coordinates: [[[l, -85], [r, -85], [r, 85], [l, 85], [l, -85]]] },
    })
    return leftLng < rightLng ? [rect(leftLng, rightLng)] : [rect(leftLng, 180), rect(-180, rightLng)]
  }

  return {
    type: 'FeatureCollection',
    features: [
      ...makeZone(6, 12, 'morning'),
      ...makeZone(12, 18, 'afternoon'),
      ...makeZone(18, 24, 'evening'),
      ...makeZone(0, 6, 'night'),
    ],
  }
}

/** Static GeoJSON for timezone grid lines (15° intervals) */
const TZ_GRID: GeoJSON.FeatureCollection = {
  type: 'FeatureCollection',
  features: Array.from({ length: 25 }, (_, i) => ({
    type: 'Feature' as const,
    properties: {},
    geometry: { type: 'LineString' as const, coordinates: [[(i - 12) * 15, -85], [(i - 12) * 15, 85]] },
  })),
}

// ── Component ───────────────────────────────────────────────────────────────

export default function WorldMap() {
  const { bars, now, addCity, removeBar } = useWorldTimeStore()
  const mapRef = useRef<MapRef>(null)
  const [aboveCities, setAboveCities] = useState<Set<string>>(new Set())
  const [showCities, setShowCities] = useState(true)
  const [customTime, setCustomTime] = useState<Date | null>(null)
  const [hoverCol, setHoverCol] = useState<number | null>(null)
  const [dateOffset, setDateOffset] = useState(0)
  const [themeOverride, setThemeOverride] = useState<'auto' | 'light' | 'dark'>(() => {
    return (localStorage.getItem('worldtime-theme') as 'auto' | 'light' | 'dark') ?? 'auto'
  })
  const [systemDark, setSystemDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const activeTime = customTime ?? now
  const darkMode = themeOverride === 'auto' ? systemDark : themeOverride === 'dark'

  // Listen to system theme changes
  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // Apply theme
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  function cycleTheme() {
    setThemeOverride(prev => {
      const next = prev === 'auto' ? 'light' : prev === 'light' ? 'dark' : 'auto'
      localStorage.setItem('worldtime-theme', next)
      return next
    })
  }

  const nightGeoJson = useMemo(() => buildNightGeoJson(activeTime), [activeTime])

  const repCities = useMemo(
    () => CITIES.filter(c => REPRESENTATIVE_CITY_IDS.has(c.id)),
    [],
  )

  const onMapLoad = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    setTimeout(() => {
      const project = (lng: number, lat: number) => map.project([lng, lat])
      setAboveCities(computeAboveCities(repCities, project))
    }, 500)
  }, [repCities])

  const registeredCityIds = useMemo(
    () => new Set(bars.map(b => b.city?.id).filter(Boolean)),
    [bars],
  )

  const toggleCity = useCallback((city: City) => {
    const idx = bars.findIndex(b => b.city?.id === city.id)
    if (idx !== -1) removeBar(idx)
    else addCity(city)
  }, [bars, addCity, removeBar])

  const firstCity = bars[0].city
  const refTz = firstCity?.timezone ?? 'UTC'
  const D = LABEL_GAP

  return (
    <div className="worldmap-wrapper">
      {/* ── Map ─────────────────────────────────────────────── */}
      <div className="worldmap-container">
        <Map
          ref={mapRef}
          initialViewState={{ longitude: 15, latitude: 25, zoom: 0.8 }}
          mapStyle={darkMode ? MAP_STYLE_DARK : MAP_STYLE_LIGHT}
          style={{ width: '100%', height: '100%' }}
          attributionControl={false}
          scrollZoom={false} boxZoom={false} doubleClickZoom={false}
          dragPan={false} dragRotate={false} keyboard={false}
          touchZoomRotate={false} touchPitch={false}
          onLoad={onMapLoad}
        >
          {/* Night overlay (below land) */}
          <Source id="night-zones" type="geojson" data={nightGeoJson}>
            <Layer id="morning-zone" type="fill" filter={['==', ['get', 'zone'], 'morning']} paint={{ 'fill-color': 'rgba(200,170,80,0.08)' }} />
            <Layer id="afternoon-zone" type="fill" filter={['==', ['get', 'zone'], 'afternoon']} paint={{ 'fill-color': 'rgba(200,170,80,0.15)' }} />
            <Layer id="evening-zone" type="fill" filter={['==', ['get', 'zone'], 'evening']} paint={{ 'fill-color': 'rgba(0,0,30,0.12)' }} />
            <Layer id="night-zone" type="fill" filter={['==', ['get', 'zone'], 'night']} paint={{ 'fill-color': 'rgba(0,0,30,0.25)' }} />
          </Source>

          {/* Timezone grid */}
          <Source id="tz-grid" type="geojson" data={TZ_GRID}>
            <Layer id="tz-grid-lines" type="line" paint={{ 'line-color': 'rgba(0,0,0,0.08)', 'line-width': 0.5, 'line-dasharray': [2, 2] }} />
          </Source>

          {/* Timezone fill */}
          <Source id="admin1" type="geojson" data={ADMIN1_URL}>
            <Layer id="admin1-fill" type="fill" paint={{ 'fill-color': ['get', 'tzColor'], 'fill-opacity': 1 }} />
          </Source>

          {/* Coastline */}
          <Source id="coastline" type="geojson" data={COASTLINE_URL}>
            <Layer id="coastline-line" type="line" paint={{ 'line-color': darkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)', 'line-width': 1.5 }} />
          </Source>

          {/* Country borders */}
          <Layer id="country-border" type="line" source="openmaptiles" source-layer="boundary"
            filter={['all', ['==', 'admin_level', 2], ['!=', 'maritime', 1]]}
            paint={{ 'line-color': '#ffffff', 'line-width': 0.2 }} />

          {/* Timezone boundaries */}
          <Source id="tz-bounds" type="geojson" data={TZ_BOUNDS_URL}>
            <Layer id="tz-boundary-lines" type="line" paint={{ 'line-color': '#ffffff', 'line-width': 1, 'line-dasharray': [2, 2] }} />
          </Source>

          {/* City markers + date label */}
          {showCities && <>
            {/* Date change tab */}
            {(() => {
              const utcH = activeTime.getUTCHours() + activeTime.getUTCMinutes() / 60
              const midLng = ((0 - utcH) * 15 + 540) % 360 - 180
              const westOffsetH = Math.round((midLng - 7.5) / 15)
              const westLocal = new Date(activeTime.getTime() + westOffsetH * 3600000)
              const eastLocal = new Date(westLocal.getTime() + 86400000)
              const fmt = (d: Date) => {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
                return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`
              }
              return (
                <Marker longitude={midLng} latitude={-60} anchor="bottom">
                  <div className="date-label-tab">{fmt(westLocal)} | {fmt(eastLocal)}</div>
                </Marker>
              )
            })()}

            {/* City markers */}
            {repCities.map(city => {
              const isRegistered = registeredCityIds.has(city.id)
              const timeStr = getCityTime(city.timezone, activeTime)
              const isAbove = aboveCities.has(city.id)
              const lineY = isAbove ? -D : D
              const labelTransform = isAbove
                ? `translate(-50%, calc(-100% - ${D}px))`
                : `translate(-50%, ${D}px)`
              return (
                <Marker key={city.id} longitude={city.lng} latitude={city.lat} style={{ overflow: 'visible' }}>
                  <div className={`city-ml-root${isRegistered ? ' active' : ''}`} onClick={() => toggleCity(city)}>
                    <svg width="0" height="0" style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
                      <line x1={0} y1={0} x2={0} y2={lineY} stroke="rgba(0,0,0,0.2)" strokeWidth={1} />
                    </svg>
                    <div className={`city-ml-dot${isRegistered ? ' city-ml-dot--active' : ''}`} />
                    <div className="city-ml-label" style={{ transform: labelTransform }}>
                      <span className="city-ml-name">{city.nameEn}</span>
                      {TZ_ABBR_MAP[city.timezone] && <span className="city-ml-tz">({TZ_ABBR_MAP[city.timezone]})</span>}
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

        <button className="theme-toggle-btn" onClick={cycleTheme}>
          {themeOverride === 'auto' ? 'Auto' : themeOverride === 'dark' ? 'Dark' : 'Light'}
        </button>

      </div>

      {/* ── Bottom panels ────────────────────────────────────── */}
      <div className="bottom-panel primary-panel">
        <DateStrip
          now={now} activeTime={activeTime} customTime={customTime}
          dateOffset={dateOffset} refTimezone={refTz}
          setCustomTime={setCustomTime} setDateOffset={setDateOffset}
        />
        {firstCity ? (
          <CityTimeBar city={firstCity} activeTime={activeTime} isFirst firstCity={null}
            hoverCol={hoverCol} setHoverCol={setHoverCol} />
        ) : (
          <div className="city-timebar empty"><span className="city-timebar-hint">Click a city on the map</span></div>
        )}
      </div>

      <div className="bottom-panel secondary-panel">
        {[1, 2].map(slot => {
          const b = bars[slot]
          return b?.city ? (
            <React.Fragment key={slot}>
              <CityTimeBar city={b.city} activeTime={activeTime} isFirst={false} firstCity={firstCity}
                hoverCol={hoverCol} setHoverCol={setHoverCol} />
            </React.Fragment>
          ) : (
            <div key={slot} className="city-timebar empty">
              <span className="city-timebar-hint">Click a city on the map</span>
            </div>
          )
        })}
      </div>

      <p className="contact-text">
        Feedback &amp; Bug Reports: <a href="mailto:sisolab@proton.me">sisolab@proton.me</a>
      </p>
    </div>
  )
}

import { useMemo, useCallback, useRef, useEffect, useState } from 'react'
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { City } from '../data/cities'
import { CITIES } from '../data/cities'
import { useWorldTimeStore } from '../store/useWorldTimeStore'
import {
  getUtcOffsetHours,
} from '../utils/timezoneColors'

function labelBoxColor(timezone: string): string {
  const h = ((getUtcOffsetHours(timezone) + 12) / 26) * 360
  return `hsla(${Math.round(h)},65%,40%,0.7)`
}
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
    { id: 'background', type: 'background', paint: { 'background-color': '#c2c8ca' } },
    { id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water',
      paint: { 'fill-color': '#c2c8ca' } },
  ],
}
const ADMIN1_URL = '/ne_admin1.geojson'
const TZ_BOUNDS_URL = '/tz-boundaries.geojson'

const REPRESENTATIVE_CITY_IDS = new Set([
  'seoul', 'tokyo', 'beijing',
  'singapore', 'bangkok',
  'mumbai', 'dubai',
  'moscow', 'warsaw',
  'london', 'paris',
  'cairo', 'lagos', 'nairobi', 'johannesburg',
  'newyork', 'chicago', 'losangeles', 'mexico',
  'saopaulo', 'buenosaires',
  'sydney', 'auckland',
])

// ── Label placement constants ───────────────────────────────────────────────
const LABEL_W = 64, LABEL_H = 34, DOT_R = 8
const HW = LABEL_W / 2, HH = LABEL_H / 2
const DEFAULT_YO = DOT_R + 2

const LABEL_CANDIDATES: [number, number][] = [
  [0, DEFAULT_YO],
  [0, -(LABEL_H + DOT_R + 2)],
  [HW + DOT_R + 2, -HH],
  [-(HW + DOT_R + 2), -HH],
  [HW * 0.65, DEFAULT_YO],
  [-HW * 0.65, DEFAULT_YO],
  [HW * 0.65, -(LABEL_H + DOT_R + 2)],
  [-HW * 0.65, -(LABEL_H + DOT_R + 2)],
]

interface LabelPoint {
  id: string; baseX: number; baseY: number; xo: number; yo: number
}

function computeOffsets(cities: City[], project: (lng: number, lat: number) => { x: number; y: number }): Record<string, [number, number]> {
  const pts: LabelPoint[] = cities.map(city => {
    const p = project(city.lng, city.lat)
    return { id: city.id, baseX: p.x, baseY: p.y, xo: 0, yo: DEFAULT_YO }
  })

  function score(lbl: LabelPoint, cxo: number, cyo: number): number {
    const lcx = lbl.baseX + cxo, lcy = lbl.baseY + cyo + HH
    let s = 0
    for (const other of pts) {
      if (other.id === lbl.id) continue
      const lox = LABEL_W - Math.abs(lcx - (other.baseX + other.xo))
      const loy = LABEL_H - Math.abs(lcy - (other.baseY + other.yo + HH))
      if (lox > 0 && loy > 0) s += lox * loy * 10
      const dox = HW + DOT_R - Math.abs(lcx - other.baseX)
      const doy = HH + DOT_R - Math.abs(lcy - other.baseY)
      if (dox > 0 && doy > 0) s += dox * doy * 15
    }
    return s
  }

  let improved = true, pass = 0
  while (improved && pass < 40) {
    improved = false; pass++
    for (const lbl of pts) {
      const cur = score(lbl, lbl.xo, lbl.yo)
      let bestXo = lbl.xo, bestYo = lbl.yo, bestScore = cur
      for (const [cxo, cyo] of LABEL_CANDIDATES) {
        const s = score(lbl, cxo, cyo)
        if (s < bestScore) { bestScore = s; bestXo = cxo; bestYo = cyo }
        if (s === 0) break
      }
      if (bestXo !== lbl.xo || bestYo !== lbl.yo) {
        lbl.xo = bestXo; lbl.yo = bestYo; improved = true
      }
    }
  }

  // Sub-pixel nudge
  for (let iter = 0; iter < 60; iter++) {
    let moved = false
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j]
        const dx = (a.baseX + a.xo) - (b.baseX + b.xo)
        const dy = (a.baseY + a.yo + HH) - (b.baseY + b.yo + HH)
        const ox = LABEL_W - Math.abs(dx), oy = LABEL_H - Math.abs(dy)
        if (ox <= 0 || oy <= 0) continue
        const dist = Math.hypot(dx, dy)
        const push = Math.min(ox, oy) / 2 + 1
        if (dist < 0.5) { a.xo += push; b.xo -= push }
        else {
          const nx = dx / dist, ny = dy / dist
          a.xo += nx * push; a.yo += ny * push
          b.xo -= nx * push; b.yo -= ny * push
        }
        moved = true
      }
    }
    if (!moved) break
  }

  return Object.fromEntries(pts.map(p => [p.id, [p.xo, p.yo] as [number, number]]))
}

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
  const [labelOffsets, setLabelOffsets] = useState<Record<string, [number, number]>>({})

  const registeredCityIds = useMemo(
    () => new Set(bars.map((b) => b.city?.id).filter(Boolean)),
    [bars]
  )

  const toggleCity = useCallback((city: City) => {
    const idx = bars.findIndex((b) => b.city?.id === city.id)
    if (idx !== -1) removeBar(idx)
    else addCity(city)
  }, [bars, addCity, removeBar])

  const repCities = useMemo(
    () => CITIES.filter((c) => REPRESENTATIVE_CITY_IDS.has(c.id)),
    []
  )

  // Recompute label positions when map loads or moves
  const updateLabelPositions = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const project = (lng: number, lat: number) => map.project([lng, lat])
    setLabelOffsets(computeOffsets(repCities, project))
  }, [repCities])

  const onMapLoad = useCallback(() => {
    updateLabelPositions()
  }, [updateLabelPositions])

  // Also recompute on zoom/move
  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    map.on('moveend', updateLabelPositions)
    return () => { map.off('moveend', updateLabelPositions) }
  })

  return (
    <div className="worldmap-container">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: 15, latitude: 25, zoom: 0.8 }}
        mapStyle={MAP_STYLE}
        style={{ width: '100%', height: '100%' }}
        attributionControl={false}
        dragRotate={false}
        onLoad={onMapLoad}
      >
        {/* Admin-1 timezone fill */}
        <Source id="admin1" type="geojson" data={ADMIN1_URL}>
          <Layer
            id="admin1-fill"
            type="fill"
            paint={{ 'fill-color': ['get', 'tzColor'], 'fill-opacity': 0.92 }}
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
            paint={{ 'line-color': '#ffffff', 'line-width': 1 }}
          />
        </Source>

        {/* City markers with computed label offsets */}
        {repCities.map((city) => {
          const isRegistered = registeredCityIds.has(city.id)
          const timeStr = getCityTime(city.timezone, now)
          const [xo, yo] = labelOffsets[city.id] ?? [0, DEFAULT_YO]
          return (
            <Marker key={city.id} longitude={city.lng} latitude={city.lat} anchor="center">
              <div className="city-ml-root" onClick={() => toggleCity(city)}>
                {/* Connecting line from dot (0,0) to label center */}
                <svg
                  className="city-ml-line"
                  style={{
                    position: 'absolute',
                    left: 0, top: 0,
                    overflow: 'visible',
                    pointerEvents: 'none',
                  }}
                >
                  <line
                    x1={0} y1={0}
                    x2={xo} y2={yo + 15}
                    stroke="rgba(255,255,255,0.8)"
                    strokeWidth={1}
                  />
                </svg>
                {/* Dot at center */}
                <div className={`city-ml-dot${isRegistered ? ' city-ml-dot--active' : ''}`} />
                {/* Label box offset from dot */}
                <div
                  className="city-ml-label"
                  style={{
                    transform: `translate(calc(-50% + ${xo}px), ${yo}px)`,
                    background: labelBoxColor(city.timezone),
                  }}
                >
                  <span className="city-ml-name">{city.nameEn}</span>
                  <span className="city-ml-time">{timeStr}</span>
                </div>
              </div>
            </Marker>
          )
        })}
      </Map>

      <div className="map-legend">
        <span className="map-legend-item">
          <span className="map-legend-dot registered" />
          Added
        </span>
        <span className="map-legend-item">
          <span className="map-legend-dot" />
          Click to add
        </span>
      </div>
    </div>
  )
}

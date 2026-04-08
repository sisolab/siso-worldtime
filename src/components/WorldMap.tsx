import { useMemo, useCallback, useRef, useState } from 'react'
import Map, { Source, Layer, Marker } from 'react-map-gl/maplibre'
import type { MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
// d3-force installed but using candidate-based placement for predictability
import type { City } from '../data/cities'
import { CITIES } from '../data/cities'
import { useWorldTimeStore } from '../store/useWorldTimeStore'
import '../utils/timezoneColors' // keep module for TimeBar usage
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
    { id: 'water-fill', type: 'fill', source: 'openmaptiles', 'source-layer': 'water',
      paint: { 'fill-color': '#e8f4f0' } },
    { id: 'coastline', type: 'line', source: 'openmaptiles', 'source-layer': 'water',
      paint: { 'line-color': 'rgba(0,0,0,0.25)', 'line-width': 0.5 } },
  ],
}
const ADMIN1_URL = '/ne_admin1.geojson'
const TZ_BOUNDS_URL = '/tz-boundaries.geojson'

const REPRESENTATIVE_CITY_IDS = new Set([
  'seoul', 'tokyo', 'beijing',
  'singapore', 'bangkok',
  'mumbai', 'dubai',
  'moscow',
  'london', 'paris',
  'cairo', 'nairobi', 'johannesburg',
  'newyork', 'chicago', 'losangeles',
  'saopaulo', 'buenosaires',
  'sydney',
])

// ── Label placement: candidate-based with global iteration ──────────────────
const LABEL_W = 52, LABEL_H = 22
const HW = LABEL_W / 2, HH = LABEL_H / 2
const RADIUS = 20  // fixed distance from dot center to label center (all directions)

// All candidates place label center at exactly RADIUS from dot center
// [xo, yo] where label top = dot.y + yo, label center = dot.y + yo + HH
const R = RADIUS, R45 = R * 0.707
const CANDIDATES: [number, number][] = [
  [0,       R - HH],        // below
  [0,       -(R + HH)],     // above
  [R,       -HH],           // right
  [-R,      -HH],           // left
  [R45,     R45 - HH],      // below-right
  [-R45,    R45 - HH],      // below-left
  [R45,     -(R45 + HH)],   // above-right
  [-R45,    -(R45 + HH)],   // above-left
]

interface Pt { id: string; bx: number; by: number; xo: number; yo: number }

function computeOffsets(
  cities: City[],
  project: (lng: number, lat: number) => { x: number; y: number },
): Record<string, [number, number]> {
  const pts: Pt[] = cities.map(city => {
    const p = project(city.lng, city.lat)
    return { id: city.id, bx: p.x, by: p.y, xo: 0, yo: R - HH }
  })

  // Overlap score: how much does label at (cxo, cyo) overlap other labels & dots?
  function penalty(pt: Pt, cxo: number, cyo: number): number {
    const cx = pt.bx + cxo, cy = pt.by + cyo + HH  // label center
    let s = 0
    for (const o of pts) {
      if (o.id === pt.id) continue
      // vs other label
      const lx = LABEL_W - Math.abs(cx - (o.bx + o.xo))
      const ly = LABEL_H - Math.abs(cy - (o.by + o.yo + HH))
      if (lx > 0 && ly > 0) s += lx * ly
      // vs other dot
      const dx = HW + 6 - Math.abs(cx - o.bx)
      const dy = HH + 6 - Math.abs(cy - o.by)
      if (dx > 0 && dy > 0) s += dx * dy * 2
    }
    // vs own dot — label center must stay at RADIUS
    const ownDist = Math.hypot(cx - pt.bx, cy - pt.by)
    if (ownDist < RADIUS * 0.8) s += (RADIUS - ownDist) * 50
    return s
  }

  // Global iterative: try candidates, pick best, repeat until stable
  for (let pass = 0; pass < 50; pass++) {
    let changed = false
    for (const pt of pts) {
      const cur = penalty(pt, pt.xo, pt.yo)
      if (cur === 0) continue
      let best = cur, bx = pt.xo, by = pt.yo
      for (const [cx, cy] of CANDIDATES) {
        const s = penalty(pt, cx, cy)
        if (s < best) { best = s; bx = cx; by = cy }
        if (s === 0) break
      }
      if (bx !== pt.xo || by !== pt.yo) {
        pt.xo = bx; pt.yo = by; changed = true
      }
    }
    if (!changed) break
  }

  // Enforce: label center must be at exactly RADIUS from own dot
  for (const p of pts) {
    const dist = Math.hypot(p.xo, p.yo + HH)
    if (dist < RADIUS * 0.9 || dist > RADIUS * 1.5) {
      const angle = Math.atan2(p.yo + HH || 1, p.xo || 0.01)
      p.xo = Math.cos(angle) * RADIUS
      p.yo = Math.sin(angle) * RADIUS - HH
    }
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

  // Compute label positions once map is ready
  const updateLabelPositions = useCallback(() => {
    const map = mapRef.current?.getMap()
    if (!map) return
    const project = (lng: number, lat: number) => map.project([lng, lat])
    const offsets = computeOffsets(repCities, project)
    setLabelOffsets(offsets)
  }, [repCities])

  const onMapLoad = useCallback(() => {
    // Delay slightly to ensure map is fully rendered and project() works
    setTimeout(updateLabelPositions, 300)
  }, [updateLabelPositions])

  return (
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
        {/* Reference lines: Prime Meridian, Date Line */}
        <Source id="ref-lines" type="geojson" data={{
          type: 'FeatureCollection',
          features: [
            { type: 'Feature', properties: { type: 'prime' }, geometry: { type: 'LineString', coordinates: [[0, -85], [0, 85]] } },
            { type: 'Feature', properties: { type: 'dateline' }, geometry: { type: 'LineString', coordinates: [[180, -85], [180, 85]] } },
          ],
        }}>
          <Layer id="prime-meridian" type="line" filter={['==', ['get', 'type'], 'prime']}
            paint={{ 'line-color': 'rgba(30,70,180,0.4)', 'line-width': 1.5 }} />
          <Layer id="date-line" type="line" filter={['==', ['get', 'type'], 'dateline']}
            paint={{ 'line-color': 'rgba(180,120,30,0.5)', 'line-width': 2, 'line-dasharray': [4, 2] }} />
        </Source>

        {/* Admin-1 timezone fill */}
        <Source id="admin1" type="geojson" data={ADMIN1_URL}>
          <Layer
            id="admin1-fill"
            type="fill"
            paint={{ 'fill-color': ['get', 'tzColor'], 'fill-opacity': 1 }}
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
            paint={{ 'line-color': '#ffffff', 'line-width': 1, 'line-dasharray': [3, 2] }}
          />
        </Source>

        {/* City markers with computed label offsets */}
        {repCities.map((city) => {
          const isRegistered = registeredCityIds.has(city.id)
          const timeStr = getCityTime(city.timezone, now)
          const [xo, yo] = labelOffsets[city.id] ?? [0, RADIUS - HH]
          return (
            <Marker key={city.id} longitude={city.lng} latitude={city.lat} style={{ overflow: 'visible' }}>
              <div className="city-ml-root" onClick={() => toggleCity(city)}>
                {/* Connecting line from dot to nearest box edge */}
                {(() => {
                  // Box center relative to dot
                  const bcx = xo, bcy = yo + HH
                  const dist = Math.hypot(bcx, bcy)
                  if (dist < 6) return null
                  // Line endpoint: box edge closest to dot
                  const angle = Math.atan2(bcy, bcx)
                  const x2 = bcx - Math.cos(angle) * Math.min(HW, HH)
                  const y2 = bcy - Math.sin(angle) * Math.min(HW, HH)
                  return (
                    <svg style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible', pointerEvents: 'none' }}>
                      <line x1={0} y1={0} x2={x2} y2={y2} stroke="rgba(255,255,255,0.85)" strokeWidth={1} />
                    </svg>
                  )
                })()}
                {/* Dot centered on (0,0) */}
                <div className={`city-ml-dot${isRegistered ? ' city-ml-dot--active' : ''}`} />
                {/* Label box */}
                <div
                  className="city-ml-label"
                  style={{ transform: `translate(calc(-50% + ${xo}px), ${yo}px)` }}
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
  )
}

import { useMemo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  useMapContext,
} from 'react-simple-maps'
import type { City } from '../data/cities'
import { CITIES } from '../data/cities'
import { useWorldTimeStore } from '../store/useWorldTimeStore'
import './WorldMap.css'

const GEO_URL = '/world-110m.json'
const TZ_OFFSETS = Array.from({ length: 27 }, (_, i) => i - 12)

const REPRESENTATIVE_CITY_IDS = new Set([
  // East Asia
  'seoul', 'tokyo', 'beijing',
  // Southeast Asia
  'singapore', 'bangkok',
  // South Asia
  'mumbai',
  // Middle East
  'dubai',
  // Russia / Eastern Europe
  'moscow', 'warsaw',
  // Europe
  'london', 'paris',
  // Africa
  'cairo', 'lagos', 'nairobi', 'johannesburg',
  // North America
  'newyork', 'chicago', 'losangeles', 'mexico',
  // South America
  'saopaulo', 'buenosaires',
  // Oceania
  'sydney', 'auckland',
])

// Label bounding box and dot radius for collision detection
const LABEL_W = 64
const LABEL_H = 32
const DOT_R = 8
const HW = LABEL_W / 2
const HH = LABEL_H / 2
const DEFAULT_YO = DOT_R + 2   // default: just below the dot

// Candidate positions (xo, yo) tried in preference order:
// below → above → right → left → diagonals
const LABEL_CANDIDATES: [number, number][] = [
  [0,              DEFAULT_YO],
  [0,              -(LABEL_H + DOT_R + 2)],
  [ HW + DOT_R + 2, -HH],
  [-(HW + DOT_R + 2), -HH],
  [ HW * 0.65,     DEFAULT_YO],
  [-HW * 0.65,     DEFAULT_YO],
  [ HW * 0.65,     -(LABEL_H + DOT_R + 2)],
  [-HW * 0.65,     -(LABEL_H + DOT_R + 2)],
]

/**
 * Global iterative label placement.
 *
 * All labels start at "below" (DEFAULT_YO). Then we repeatedly loop over every
 * label and ask: "is there a candidate position that lowers my score, given
 * where everyone else currently sits?" — and switch if yes.  Repeat until no
 * label wants to move (local optimum of the global score).
 *
 * Score for one label = sum over all other cities of:
 *   • label–label bounding-box overlap area × 10   (heavy penalty)
 *   • label–dot bounding-box overlap area × 15     (heavier: dots must stay visible)
 *
 * After convergence a light radial nudge resolves any sub-pixel residual
 * label–label overlap that the discrete candidates can't perfectly remove.
 */
function computeOffsets(
  cities: City[],
  project: (coords: [number, number]) => [number, number] | null
): Record<string, [number, number]> {
  const pts = cities.map((city) => {
    const proj = project([city.lng, city.lat])
    return {
      id: city.id,
      baseX: proj ? proj[0] : 0,
      baseY: proj ? proj[1] : 0,
      xo: 0 as number,
      yo: DEFAULT_YO as number,
    }
  })

  // Global score contribution of label `lbl` at candidate (cxo, cyo)
  function score(lbl: typeof pts[0], cxo: number, cyo: number): number {
    const lcx = lbl.baseX + cxo
    const lcy = lbl.baseY + cyo + HH
    let s = 0
    for (const other of pts) {
      if (other.id === lbl.id) continue
      // Label–label overlap
      const lox = LABEL_W - Math.abs(lcx - (other.baseX + other.xo))
      const loy = LABEL_H - Math.abs(lcy - (other.baseY + other.yo + HH))
      if (lox > 0 && loy > 0) s += lox * loy * 10
      // Label–dot overlap (own dot excluded: it renders on top anyway)
      const dox = HW + DOT_R - Math.abs(lcx - other.baseX)
      const doy = HH + DOT_R - Math.abs(lcy - other.baseY)
      if (dox > 0 && doy > 0) s += dox * doy * 15
    }
    return s
  }

  // Iterative global improvement: keep looping until no label wants to move
  let improved = true
  let pass = 0
  while (improved && pass < 40) {
    improved = false
    pass++
    for (const lbl of pts) {
      const cur = score(lbl, lbl.xo, lbl.yo)
      let bestXo = lbl.xo, bestYo = lbl.yo, bestScore = cur
      for (const [cxo, cyo] of LABEL_CANDIDATES) {
        const s = score(lbl, cxo, cyo)
        if (s < bestScore) { bestScore = s; bestXo = cxo; bestYo = cyo }
        if (s === 0) break
      }
      if (bestXo !== lbl.xo || bestYo !== lbl.yo) {
        lbl.xo = bestXo; lbl.yo = bestYo
        improved = true
      }
    }
  }

  // Light radial nudge for sub-pixel residual label–label overlaps
  for (let iter = 0; iter < 60; iter++) {
    let moved = false
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j]
        const acx = a.baseX + a.xo, acy = a.baseY + a.yo + HH
        const bcx = b.baseX + b.xo, bcy = b.baseY + b.yo + HH
        const dx = acx - bcx, dy = acy - bcy
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

  return Object.fromEntries(pts.map((p) => [p.id, [p.xo, p.yo] as [number, number]]))
}

function getCityTime(timezone: string, now: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)
}

const LABEL_PAD_Y = 3
const LABEL_TEXT_SIZE = 10
const LABEL_LINE_H = 14  // line height per text row

/** Inner component — must live inside <ComposableMap> to use useMapContext. */
function CityLabels({
  repCities,
  registeredCityIds,
  now,
  onToggle,
}: {
  repCities: City[]
  registeredCityIds: Set<string | undefined>
  now: Date
  onToggle: (city: City) => void
}) {
  const { projection } = useMapContext()

  const offsets = useMemo(() => {
    const project = (coords: [number, number]) => {
      try {
        return (projection as any)(coords) as [number, number] | null
      } catch {
        return null
      }
    }
    return computeOffsets(repCities, project)
  }, [repCities, projection])

  // box height = 2 rows of text + padding top/bottom
  const boxH = LABEL_LINE_H * 2 + LABEL_PAD_Y * 2
  const boxW = LABEL_W

  return (
    <>
      {repCities.map((city) => {
        const isRegistered = registeredCityIds.has(city.id)
        const [xo, yo] = offsets[city.id] ?? [0, DOT_R + 2]
        const timeStr = getCityTime(city.timezone, now)

        // Dot size: 70 % of previous (was 6/5, now 4.2/3.5)
        const dotR = isRegistered ? 3 : 2.5

        // Connecting line: dot edge → label center
        const lCx = xo
        const lCy = yo + boxH / 2
        const dist = Math.hypot(lCx, lCy)
        const showLine = dist > dotR + 4
        const angle = Math.atan2(lCy, lCx)
        const x1 = Math.cos(angle) * dotR
        const y1 = Math.sin(angle) * dotR
        const x2 = lCx - Math.cos(angle) * 5
        const y2 = lCy - Math.sin(angle) * 5

        return (
          <Marker
            key={city.id}
            coordinates={[city.lng, city.lat]}
          >
            <g className="city-rep-group">
              {/* Connecting line — behind everything */}
              {showLine && (
                <line
                  x1={x1} y1={y1}
                  x2={x2} y2={y2}
                  stroke="rgba(255,255,255,0.4)"
                  strokeWidth={0.9}
                  strokeDasharray="2 2"
                  style={{ pointerEvents: 'none' }}
                />
              )}
              {/* Label box — click target; drawn before dot so dot appears on top */}
              <g
                transform={`translate(${xo - boxW / 2},${yo})`}
                onClick={() => onToggle(city)}
                style={{ cursor: 'pointer' }}
              >
                <rect
                  x={0} y={0}
                  width={boxW} height={boxH}
                  rx={3} ry={3}
                  fill={isRegistered ? 'rgba(30,80,180,0.72)' : 'rgba(20,30,60,0.55)'}
                  stroke={isRegistered ? 'rgba(120,180,255,0.5)' : 'rgba(255,255,255,0.22)'}
                  strokeWidth={0.6}
                />
                <text
                  x={boxW / 2}
                  y={LABEL_PAD_Y + LABEL_TEXT_SIZE}
                  textAnchor="middle"
                  className="city-rep-name"
                  fill="rgba(255,255,255,0.97)"
                >
                  {city.nameEn}
                </text>
                <text
                  x={boxW / 2}
                  y={LABEL_PAD_Y + LABEL_TEXT_SIZE + LABEL_LINE_H}
                  textAnchor="middle"
                  className="city-rep-time"
                  fill={isRegistered ? 'rgba(160,210,255,0.97)' : 'rgba(255,255,255,0.80)'}
                >
                  {timeStr}
                </text>
              </g>
              {/* Dot — rendered last, always on top; not a click target */}
              <circle
                r={dotR}
                fill={isRegistered ? 'var(--ln-primary)' : 'rgba(255,255,255,0.9)'}
                stroke={isRegistered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)'}
                strokeWidth={isRegistered ? 1.5 : 1}
                className="city-rep-dot"
                style={{ pointerEvents: 'none' }}
              />
            </g>
          </Marker>
        )
      })}
    </>
  )
}

export default function WorldMap() {
  const { bars, now, addCity, removeBar } = useWorldTimeStore()

  const registeredCityIds = useMemo(
    () => new Set(bars.map((b) => b.city?.id).filter(Boolean)),
    [bars]
  )

  function toggleCity(city: City) {
    const idx = bars.findIndex((b) => b.city?.id === city.id)
    if (idx !== -1) removeBar(idx)
    else addCity(city)
  }

  const repCities = useMemo(
    () => CITIES.filter((c) => REPRESENTATIVE_CITY_IDS.has(c.id)),
    []
  )

  return (
    <div className="worldmap-container">
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 170, center: [0, 10] }}
        width={960}
        height={480}
        style={{ width: '100%', height: '100%' }}
      >
        {TZ_OFFSETS.map((offset) => (
          <Line
            key={`tz-${offset}`}
            from={[offset * 15, 85]}
            to={[offset * 15, -85]}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={0.5}
            strokeLinecap="round"
          />
        ))}

        {/* International Date Line */}
        <Line
          from={[180, 85]}
          to={[180, -85]}
          stroke="rgba(255, 220, 100, 0.85)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="6 3"
        />

        {/* Prime Meridian */}
        <Line
          from={[0, 85]}
          to={[0, -85]}
          stroke="rgba(180, 220, 255, 0.6)"
          strokeWidth={1.2}
          strokeLinecap="round"
        />

        <Geographies geography={GEO_URL}>
          {({ geographies }: { geographies: any[] }) =>
            geographies.map((geo: any) => (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill="var(--map-land)"
                stroke="var(--map-border)"
                strokeWidth={0.4}
                style={{
                  default: { outline: 'none' },
                  hover: { outline: 'none', fill: 'var(--map-land-hover)' },
                  pressed: { outline: 'none' },
                }}
              />
            ))
          }
        </Geographies>

        <CityLabels
          repCities={repCities}
          registeredCityIds={registeredCityIds}
          now={now}
          onToggle={toggleCity}
        />
      </ComposableMap>

      <div className="map-legend">
        <span className="map-legend-item">
          <span className="map-legend-line dateline" />
          Date Line
        </span>
        <span className="map-legend-item">
          <span className="map-legend-line prime" />
          Prime Meridian
        </span>
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

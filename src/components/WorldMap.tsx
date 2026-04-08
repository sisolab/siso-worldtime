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

// Option C: continent/region-balanced representative cities
const REPRESENTATIVE_CITY_IDS = new Set([
  // East Asia
  'seoul', 'tokyo', 'beijing',
  // Southeast Asia
  'singapore', 'bangkok',
  // South Asia
  'mumbai',
  // Middle East
  'dubai',
  // Russia / Central Asia
  'moscow',
  // Europe
  'london', 'paris',
  // Africa
  'cairo', 'lagos', 'nairobi',
  // North America
  'newyork', 'chicago', 'losangeles',
  // South America
  'saopaulo', 'buenosaires',
  // Oceania
  'sydney', 'auckland',
])

// Bounding box of the label area (dot + name + time below it)
const LABEL_W = 60  // estimated text width + margin
const LABEL_H = 34  // name + time height + margin
const MAX_ITER = 40

/** Compute y-only offsets so no two pills overlap. */
function computeYOffsets(
  cities: City[],
  project: (coords: [number, number]) => [number, number] | null
): Record<string, number> {
  const pts = cities.map((city) => {
    const proj = project([city.lng, city.lat])
    return { id: city.id, x: proj ? proj[0] : 0, yo: 0, baseY: proj ? proj[1] : 0 }
  })

  for (let iter = 0; iter < MAX_ITER; iter++) {
    let moved = false
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i], b = pts[j]
        const dx = Math.abs(a.x - b.x)
        if (dx >= LABEL_W) continue

        const ay = a.baseY + a.yo
        const by = b.baseY + b.yo
        const dy = Math.abs(ay - by)
        if (dy >= LABEL_H) continue

        const push = (LABEL_H - dy) / 2 + 1
        const dir = ay <= by ? -1 : 1
        a.yo += dir * push
        b.yo -= dir * push
        moved = true
      }
    }
    if (!moved) break
  }

  return Object.fromEntries(pts.map((p) => [p.id, p.yo]))
}

function getCityTime(timezone: string, now: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(now)
}

/** Inner component — must live inside <ComposableMap> to use useComposableMap. */
function CityPills({
  repCities,
  registeredCityIds,
  now,
  addCity,
}: {
  repCities: City[]
  registeredCityIds: Set<string | undefined>
  now: Date
  addCity: (city: City) => void
}) {
  const { projection } = useMapContext()

  const yOffsets = useMemo(() => {
    const project = (coords: [number, number]) => {
      try {
        return (projection as any)(coords) as [number, number] | null
      } catch {
        return null
      }
    }
    return computeYOffsets(repCities, project)
  }, [repCities, projection])

  return (
    <>
      {repCities.map((city) => {
        const isRegistered = registeredCityIds.has(city.id)
        const yOffset = yOffsets[city.id] ?? 0
        const timeStr = getCityTime(city.timezone, now)

        return (
          <Marker
            key={city.id}
            coordinates={[city.lng, city.lat]}
            onClick={() => addCity(city)}
          >
            <g
              className="city-rep-group"
              transform={yOffset !== 0 ? `translate(0,${yOffset})` : undefined}
            >
              {/* Dot at city location */}
              <circle
                r={isRegistered ? 6 : 5}
                fill={isRegistered ? 'var(--ln-primary)' : 'rgba(255,255,255,0.9)'}
                stroke={isRegistered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)'}
                strokeWidth={isRegistered ? 1.5 : 1}
                className="city-rep-dot"
              />
              {/* City name below dot */}
              <text
                textAnchor="middle"
                y={16}
                className="city-rep-name"
                fill="rgba(255,255,255,0.95)"
              >
                {city.nameEn}
              </text>
              {/* Time below name */}
              <text
                textAnchor="middle"
                y={27}
                className="city-rep-time"
                fill={isRegistered ? 'var(--ln-primary-light-inv, #90bfff)' : 'rgba(255,255,255,0.75)'}
              >
                {timeStr}
              </text>
            </g>
          </Marker>
        )
      })}
    </>
  )
}

export default function WorldMap() {
  const { bars, now, addCity } = useWorldTimeStore()

  const registeredCityIds = useMemo(
    () => new Set(bars.map((b) => b.city?.id).filter(Boolean)),
    [bars]
  )

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

        <CityPills
          repCities={repCities}
          registeredCityIds={registeredCityIds}
          now={now}
          addCity={addCity}
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

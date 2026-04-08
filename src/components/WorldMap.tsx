import { useMemo } from 'react'
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
} from 'react-simple-maps'
import { CITIES } from '../data/cities'
import { useWorldTimeStore } from '../store/useWorldTimeStore'
import './WorldMap.css'

const GEO_URL = '/world-110m.json'

const TZ_OFFSETS = Array.from({ length: 27 }, (_, i) => i - 12)

// One representative city per major UTC offset
const REPRESENTATIVE_CITY_IDS = new Set([
  'auckland',     // UTC+12
  'sydney',       // UTC+10
  'seoul',        // UTC+9
  'singapore',    // UTC+8
  'bangkok',      // UTC+7
  'dhaka',        // UTC+6
  'karachi',      // UTC+5
  'dubai',        // UTC+4
  'moscow',       // UTC+3
  'cairo',        // UTC+2
  'paris',        // UTC+1
  'london',       // UTC+0
  'saopaulo',     // UTC-3
  'newyork',      // UTC-5
  'mexico',       // UTC-6
  'losangeles',   // UTC-8
])

// Stagger pills between top (lat≈62°N) and bottom (lat≈-48°S) rows
// so adjacent timezone pills never overlap.
// Order west→east, alternating rows: A=top, B=bottom.
const DISPLAY_COORDS: Record<string, [number, number]> = {
  losangeles: [-118.24, 62],   // UTC-8  row A (top)
  mexico:     [-99.13,  -48],  // UTC-6  row B (bottom)
  newyork:    [-74.01,  62],   // UTC-5  row A
  saopaulo:   [-46.63,  -48],  // UTC-3  row B
  london:     [-0.13,   62],   // UTC+0  row A
  paris:      [2.35,    -48],  // UTC+1  row B
  cairo:      [31.25,   62],   // UTC+2  row A
  moscow:     [37.62,   -48],  // UTC+3  row B
  dubai:      [55.27,   62],   // UTC+4  row A
  karachi:    [67.01,   -48],  // UTC+5  row B
  dhaka:      [90.41,   62],   // UTC+6  row A
  bangkok:    [100.52,  -48],  // UTC+7  row B
  singapore:  [103.82,  62],   // UTC+8  row A
  seoul:      [126.98,  -48],  // UTC+9  row B
  sydney:     [151.21,  62],   // UTC+10 row A
  auckland:   [174.76,  -48],  // UTC+12 row B
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
  const { bars, now, addCity } = useWorldTimeStore()

  const registeredCityIds = useMemo(
    () => new Set(bars.map((b) => b.city?.id).filter(Boolean)),
    [bars]
  )

  // International Date Line at ±180° longitude
  const DATE_LINE_LNG = 180

  const repCities = CITIES.filter((c) => REPRESENTATIVE_CITY_IDS.has(c.id))
  const secCities = CITIES.filter((c) => !REPRESENTATIVE_CITY_IDS.has(c.id))

  return (
    <div className="worldmap-container">
      <ComposableMap
        projection="geoNaturalEarth1"
        projectionConfig={{ scale: 170, center: [0, 10] }}
        width={960}
        height={480}
        style={{ width: '100%', height: '100%' }}
      >
        {/* Timezone separator lines */}
        {TZ_OFFSETS.map((offset) => {
          const lng = offset * 15
          return (
            <Line
              key={`tz-${offset}`}
              from={[lng, 85]}
              to={[lng, -85]}
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={0.5}
              strokeLinecap="round"
            />
          )
        })}

        {/* International Date Line at 180° */}
        <Line
          from={[DATE_LINE_LNG, 85]}
          to={[DATE_LINE_LNG, -85]}
          stroke="rgba(255, 220, 100, 0.85)"
          strokeWidth={2}
          strokeLinecap="round"
          strokeDasharray="6 3"
        />
        {/* Prime Meridian at 0° */}
        <Line
          from={[0, 85]}
          to={[0, -85]}
          stroke="rgba(180, 220, 255, 0.6)"
          strokeWidth={1.2}
          strokeLinecap="round"
        />

        {/* World map countries */}
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

        {/* Secondary city dots */}
        {secCities.map((city) => {
          const isRegistered = registeredCityIds.has(city.id)
          return (
            <Marker
              key={city.id}
              coordinates={[city.lng, city.lat]}
              onClick={() => addCity(city)}
            >
              <circle
                r={isRegistered ? 4 : 2}
                fill={isRegistered ? 'var(--ln-primary)' : 'rgba(255,255,255,0.5)'}
                stroke={isRegistered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'}
                strokeWidth={isRegistered ? 1.2 : 0.6}
                className="city-marker"
              />
              {isRegistered && (
                <text textAnchor="middle" y={-7} className="city-label">
                  {city.nameEn}
                </text>
              )}
            </Marker>
          )
        })}

        {/* Representative city pills — staggered top/bottom rows */}
        {repCities.map((city) => {
          const isRegistered = registeredCityIds.has(city.id)
          const [displayLng, displayLat] = DISPLAY_COORDS[city.id] ?? [city.lng, city.lat]
          const isBottom = displayLat < 0
          const timeStr = getCityTime(city.timezone, now)

          const btnFill = isRegistered ? 'var(--ln-primary)' : 'rgba(255,255,255,0.92)'
          const btnStroke = isRegistered ? 'rgba(255,255,255,0.5)' : 'var(--ln-primary)'
          const timeFill = isRegistered ? 'white' : 'var(--ln-primary)'
          const nameFill = 'rgba(255,255,255,0.95)'
          // Name goes above pill for top row, below pill for bottom row
          const nameY = isBottom ? 22 : -18

          return (
            <Marker
              key={city.id}
              coordinates={[displayLng, displayLat]}
              onClick={() => addCity(city)}
            >
              <g className="city-rep-group">
                <text
                  textAnchor="middle"
                  y={nameY}
                  className="city-rep-name"
                  fill={nameFill}
                >
                  {city.nameEn}
                </text>
                <rect
                  x={-27}
                  y={-12}
                  width={54}
                  height={23}
                  rx={11}
                  fill={btnFill}
                  stroke={btnStroke}
                  strokeWidth={1.5}
                  className="city-rep-btn"
                />
                <text
                  textAnchor="middle"
                  y={4}
                  className="city-rep-time"
                  fill={timeFill}
                >
                  {timeStr}
                </text>
              </g>
            </Marker>
          )
        })}
      </ComposableMap>

      {/* Legend */}
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

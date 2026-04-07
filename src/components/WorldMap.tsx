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
import { getNineAmLongitude } from '../utils/timeUtils'
import './WorldMap.css'

const GEO_URL = '/world-110m.json'

// UTC offsets to draw timezone separator lines
const TZ_OFFSETS = Array.from({ length: 27 }, (_, i) => i - 12) // -12 to +14

export default function WorldMap() {
  const { bars, now, addCity } = useWorldTimeStore()

  const registeredCityIds = useMemo(
    () => new Set(bars.map((b) => b.city?.id).filter(Boolean)),
    [bars]
  )

  const nineAmLng = useMemo(() => getNineAmLongitude(now), [now])

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

        {/* 9am reference line */}
        <Line
          from={[nineAmLng, 85]}
          to={[nineAmLng, -85]}
          stroke="var(--ln-primary)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeDasharray="4 3"
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

        {/* City markers */}
        {CITIES.map((city) => {
          const isRegistered = registeredCityIds.has(city.id)
          return (
            <Marker
              key={city.id}
              coordinates={[city.lng, city.lat]}
              onClick={() => addCity(city)}
            >
              <circle
                r={isRegistered ? 4.5 : 2.5}
                fill={isRegistered ? 'var(--ln-primary)' : 'rgba(255,255,255,0.75)'}
                stroke={isRegistered ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'}
                strokeWidth={isRegistered ? 1.5 : 0.8}
                className="city-marker"
              />
              {isRegistered && (
                <text
                  textAnchor="middle"
                  y={-8}
                  className="city-label"
                >
                  {city.nameEn}
                </text>
              )}
            </Marker>
          )
        })}
      </ComposableMap>

      {/* Legend */}
      <div className="map-legend">
        <span className="map-legend-item map-legend-9am">
          <span className="map-legend-line" />
          현재 오전 9시 기준선
        </span>
        <span className="map-legend-item">
          <span className="map-legend-dot registered" />
          등록된 도시
        </span>
        <span className="map-legend-item">
          <span className="map-legend-dot" />
          클릭하여 추가
        </span>
      </div>
    </div>
  )
}

import { TZ_ABBR_MAP } from '../constants/map'
import { getCurrentHour } from '../utils/timeUtils'
import { getUtcOffsetHours } from '../utils/timezoneColors'
import type { City } from '../data/cities'

interface CityTimeBarProps {
  city: City
  activeTime: Date
  isFirst: boolean
  firstCity: City | null
  hoverCol: number | null
  setHoverCol: (col: number | null) => void
}

function ordinalSuffix(day: number): string {
  if (day === 1 || day === 21 || day === 31) return 'st'
  if (day === 2 || day === 22) return 'nd'
  if (day === 3 || day === 23) return 'rd'
  return 'th'
}

export default function CityTimeBar({ city, activeTime, isFirst, firstCity, hoverCol, setHoverCol }: CityTimeBarProps) {
  const allHours = Array.from({ length: 24 }, (_, i) => i)
  const currentHour = getCurrentHour(city.timezone, activeTime)

  let hours: number[]
  if (isFirst || !firstCity) {
    hours = allHours
  } else {
    const refHour = getCurrentHour(firstCity.timezone, activeTime)
    const diff = currentHour - refHour
    hours = allHours.map(h => ((h + diff + 24) % 24))
  }

  return (
    <div className="city-timebar">
      <div className="city-timebar-info">
        <span className="city-timebar-name">{city.nameEn}</span>
        <span className="city-timebar-tz">{TZ_ABBR_MAP[city.timezone] ?? ''}</span>
      </div>
      <div className="city-timebar-bar-wrap">
        {/* Date markers row */}
        <div className="city-timebar-dates">
          {hours.map((h, j) => {
            const hr = Math.round(h)
            // Date above 00
            if (hr === 0) {
              const refDate = new Date(activeTime.toLocaleString('en-US', { timeZone: firstCity?.timezone ?? city.timezone }))
              let day = refDate.getDate()
              if (!isFirst && firstCity) {
                const diff = getUtcOffsetHours(city.timezone, activeTime) - getUtcOffsetHours(firstCity.timezone, activeTime)
                if (diff > 0) day += 1
              }
              return <div key={j} className="date-marker-cell has-date">{day}{ordinalSuffix(day)}</div>
            }
            // Date above first cell for non-reference
            if (!isFirst && j === 0 && h !== currentHour) {
              const refDate = new Date(activeTime.toLocaleString('en-US', { timeZone: firstCity?.timezone ?? city.timezone }))
              let day = refDate.getDate()
              if (Math.round(h) > 12) day -= 1
              if (day <= 0) day = new Date(refDate.getFullYear(), refDate.getMonth(), 0).getDate()
              return <div key={j} className="date-marker-cell has-date">{day}{ordinalSuffix(day)}</div>
            }
            // Time diff above current hour for non-reference
            if (!isFirst && firstCity && h === currentHour) {
              const diff = Math.round(getUtcOffsetHours(city.timezone, activeTime) - getUtcOffsetHours(firstCity.timezone, activeTime))
              const sign = diff >= 0 ? '+' : ''
              return <div key={j} className="date-marker-cell has-diff">{sign}{diff}h</div>
            }
            return <div key={j} className="date-marker-cell" />
          })}
        </div>
        {/* Hours bar */}
        <div className="city-timebar-hours">
          {hours.map((h, j) => {
            const hr = Math.round(h)
            const period = hr < 6 ? 'night' : hr < 12 ? 'morning' : hr < 18 ? 'afternoon' : 'evening'
            return (
              <div
                key={j}
                className={`city-timebar-cell${h === currentHour ? ' current' : ''}${hoverCol === j ? ' col-hover' : ''}${hr >= 9 && hr <= 17 ? ' biz-hour' : ''}${hr === 0 ? ' date-change' : ''} hour-${period}`}
                onMouseEnter={() => setHoverCol(j)}
                onMouseLeave={() => setHoverCol(null)}
              >
                {String(hr).padStart(2, '0')}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

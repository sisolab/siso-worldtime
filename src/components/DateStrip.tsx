import { getUtcOffsetHours } from '../utils/timezoneColors'

interface DateStripProps {
  now: Date
  activeTime: Date
  customTime: Date | null
  dateOffset: number
  refTimezone: string
  setCustomTime: (d: Date | null) => void
  setDateOffset: (fn: (o: number) => number) => void
}

export default function DateStrip({
  now, activeTime, customTime, dateOffset, refTimezone,
  setCustomTime, setDateOffset,
}: DateStripProps) {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="date-strip-row">
      <button className="date-nav" onClick={() => {
        setDateOffset(o => o - 7)
        document.querySelector('.date-strip')?.scrollBy({ left: -210, behavior: 'smooth' })
      }}>◀</button>
      <div className="date-strip">
        {Array.from({ length: 60 }, (_, i) => {
          const d = new Date(now)
          d.setDate(d.getDate() + i + dateOffset)
          const isToday = i + dateOffset === 0 && !customTime
          const isSelected = customTime && (() => {
            const tzd = new Date(activeTime.toLocaleString('en-US', { timeZone: refTimezone }))
            return tzd.getFullYear() === d.getFullYear() && tzd.getMonth() === d.getMonth() && tzd.getDate() === d.getDate()
          })()
          const isWeekend = d.getDay() === 0 || d.getDay() === 6
          return (
            <button
              key={i}
              className={`date-cell${isToday ? ' today' : ''}${isSelected ? ' selected' : ''}${isWeekend ? ' weekend' : ''}`}
              onClick={() => {
                const offset = getUtcOffsetHours(refTimezone, activeTime)
                const currentLocal = new Date(now.toLocaleString('en-US', { timeZone: refTimezone }))
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
        document.querySelector('.date-strip')?.scrollBy({ left: 210, behavior: 'smooth' })
      }}>▶</button>
      <button className="reset-time-btn" onClick={() => { setCustomTime(null); setDateOffset(() => 0) }}>Today</button>
    </div>
  )
}

import { useState, useRef } from 'react'
import { Trash2, Briefcase, CalendarDays } from 'lucide-react'
import { useWorldTimeStore } from '../store/useWorldTimeStore'
import { getBarHours, getCurrentHour, getDateLabel } from '../utils/timeUtils'
import { cityDotActiveColor } from '../utils/timezoneColors'
import './TimeBar.css'

interface TimeBarProps {
  index: 0 | 1 | 2
}

export default function TimeBar({ index }: TimeBarProps) {
  const { bars, activeMode, now, removeBar, setActiveMode } = useWorldTimeStore()
  const bar = bars[index]
  const [showCalendar, setShowCalendar] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const isBusinessActive = activeMode.type === 'business' && activeMode.barIndex === index
  const isCalendarActive = activeMode.type === 'calendar' && activeMode.barIndex === index

  const calendarDate = isCalendarActive && activeMode.type === 'calendar'
    ? activeMode.date
    : undefined

  const hourMode = isBusinessActive ? 'business' : isCalendarActive ? 'calendar' : 'normal'
  const refDate = calendarDate ?? now

  const cells = bar.city
    ? getBarHours(bar.city.timezone, refDate, hourMode, calendarDate)
    : null

  const currentHour = bar.city ? getCurrentHour(bar.city.timezone, refDate) : -1

  const currentTimeStr = bar.city
    ? new Intl.DateTimeFormat('en-GB', {
        timeZone: bar.city.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(isCalendarActive && calendarDate ? calendarDate : now)
    : null

  const dateStr = bar.city
    ? new Intl.DateTimeFormat('en-US', {
        timeZone: bar.city.timezone,
        month: 'short',
        day: 'numeric',
      }).format(isCalendarActive && calendarDate ? calendarDate : now)
    : null

  function handleBusiness() {
    if (isBusinessActive) {
      setActiveMode({ type: 'none' })
    } else {
      setActiveMode({ type: 'business', barIndex: index })
    }
  }

  function handleCalendar() {
    if (isCalendarActive) {
      setActiveMode({ type: 'none' })
    } else {
      setShowCalendar(true)
    }
  }

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    if (!val) return
    const d = new Date(val)
    if (isNaN(d.getTime())) return
    setActiveMode({ type: 'calendar', barIndex: index, date: d })
    setShowCalendar(false)
  }

  const defaultDatetime = (() => {
    const d = calendarDate ?? now
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  })()

  const isEmpty = !bar.city

  const accentColor = !isEmpty ? cityDotActiveColor(bar.city!.timezone) : undefined

  return (
    <div
      className={`timebar${isEmpty ? ' timebar--empty' : ''}`}
      style={accentColor ? { borderLeftColor: accentColor } : undefined}
    >
      {/* City name + time display */}
      <div className="timebar-header">
        {isEmpty ? (
          <span className="timebar-empty-hint">Click a city on the map</span>
        ) : (
          <>
            <span className="timebar-city">{bar.city!.nameEn}</span>
            <span className="timebar-time">{currentTimeStr}</span>
            <span className="timebar-date">{dateStr}</span>
            {(isBusinessActive || isCalendarActive) && (
              <span className={`timebar-mode-badge ${isBusinessActive ? 'business' : 'calendar'}`}>
                {isBusinessActive ? 'Business' : 'Custom'}
              </span>
            )}
          </>
        )}
      </div>

      {/* 9-cell hour bar */}
      <div className="timebar-cells">
        {cells
          ? cells.map((cell, i) => {
              const isNow = cell.hour === currentHour && hourMode !== 'business'
              const isBizNow = hourMode === 'business' && bar.city &&
                getCurrentHour(bar.city.timezone, now) === cell.hour
              const nowInTz = new Date(now.toLocaleString('en-US', { timeZone: bar.city!.timezone }))
              const dateLabel = getDateLabel(cell.date, nowInTz)

              return (
                <div
                  key={i}
                  className={`timebar-cell${isNow || isBizNow ? ' timebar-cell--now' : ''}${
                    isBusinessActive && cell.hour >= 9 && cell.hour <= 17 ? ' timebar-cell--biz' : ''
                  }`}
                >
                  {dateLabel && (
                    <span className="timebar-cell-date">{dateLabel}</span>
                  )}
                  <span className="timebar-cell-hour">{String(cell.hour).padStart(2, '0')}</span>
                </div>
              )
            })
          : Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="timebar-cell timebar-cell--placeholder" />
            ))}
      </div>

      {/* Action icons */}
      <div className="timebar-actions">
        <button
          className="ln-icon-btn ln-icon-btn-sm"
          title="Remove"
          onClick={() => removeBar(index)}
          disabled={isEmpty}
        >
          <Trash2 size={14} />
        </button>
        <button
          className={`ln-icon-btn ln-icon-btn-sm${isBusinessActive ? ' active' : ''}`}
          title="Business hours (09–18)"
          onClick={handleBusiness}
          disabled={isEmpty}
        >
          <Briefcase size={14} />
        </button>
        <div className="timebar-calendar-wrap">
          <button
            className={`ln-icon-btn ln-icon-btn-sm${isCalendarActive ? ' active' : ''}`}
            title="Set date & time"
            onClick={handleCalendar}
            disabled={isEmpty}
          >
            <CalendarDays size={14} />
          </button>
          {showCalendar && (
            <div className="timebar-calendar-popup ln-frosted">
              <input
                ref={inputRef}
                type="datetime-local"
                className="ln-input"
                defaultValue={defaultDatetime}
                onChange={handleDateChange}
                autoFocus
                onBlur={() => setShowCalendar(false)}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

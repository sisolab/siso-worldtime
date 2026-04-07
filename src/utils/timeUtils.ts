/**
 * Get the UTC offset (in hours) for a timezone at a given date (DST-aware).
 */
export function getUtcOffset(timezone: string, date: Date = new Date()): number {
  const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }))
  const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }))
  return (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60)
}

/**
 * Get the current hour (0–23) in a given timezone.
 */
export function getCurrentHour(timezone: string, date: Date = new Date()): number {
  return parseInt(
    new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(date),
    10
  ) % 24
}

/**
 * Get the date string (e.g. "4/8") in a given timezone.
 */
export function getDateString(timezone: string, date: Date = new Date()): string {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: timezone,
    month: 'numeric',
    day: 'numeric',
  }).format(date)
}

/**
 * Format a specific hour in a timezone as "HH:00" (24h).
 */
export function formatHour(hour: number): string {
  const h = ((hour % 24) + 24) % 24
  return String(h).padStart(2, '0')
}

/**
 * Get the 9 hours shown on a bar, centered around the current hour.
 * Returns array of hour offsets from 'now' in that timezone: -4 to +4.
 */
export function getBarHours(
  timezone: string,
  now: Date,
  mode: 'normal' | 'business' | 'calendar',
  calendarDate?: Date
): { hour: number; date: Date }[] {
  if (mode === 'business') {
    // Fixed: 09, 10, 11, 12, 13, 14, 15, 16, 17
    return Array.from({ length: 9 }, (_, i) => {
      const h = 9 + i
      const tzNow = getDateInTimezone(timezone, now)
      tzNow.setHours(h, 0, 0, 0)
      return { hour: h, date: tzNow }
    })
  }

  const refDate = mode === 'calendar' && calendarDate ? calendarDate : now
  const currentHour = getCurrentHour(timezone, refDate)

  return Array.from({ length: 9 }, (_, i) => {
    const offset = i - 4  // -4 to +4
    const h = ((currentHour + offset) % 24 + 24) % 24
    const d = new Date(refDate)
    d.setHours(d.getHours() + offset)
    return { hour: h, date: d }
  })
}

/**
 * Get a Date object representing "now" in a specific timezone, adjusted to wall-clock time.
 * Useful for business hours calculation.
 */
function getDateInTimezone(timezone: string, date: Date): Date {
  const str = date.toLocaleString('en-US', { timeZone: timezone })
  return new Date(str)
}

/**
 * Calculate which longitude corresponds to "9am" right now.
 * Returns a longitude in degrees (-180 to 180).
 */
export function getNineAmLongitude(now: Date): number {
  const utcHour = now.getUTCHours() + now.getUTCMinutes() / 60
  // UTC offset where it's currently 9am: targetOffset = 9 - utcHour
  const targetOffset = 9 - utcHour
  // Normalize to -12..+14 range
  let normalized = targetOffset
  if (normalized > 14) normalized -= 24
  if (normalized < -12) normalized += 24
  // Longitude = offset * 15 degrees
  return normalized * 15
}

/**
 * Get short date label for a bar cell. Returns "+1", "-1", or "M/D" if different from today.
 */
export function getDateLabel(cellDate: Date, nowInTz: Date): string | null {
  const cellDay = cellDate.getDate()
  const nowDay = nowInTz.getDate()
  const diff = cellDay - nowDay
  if (diff === 0) return null
  if (diff === 1 || diff === -29 || diff === -30) return '+1'
  if (diff === -1 || diff === 29 || diff === 30) return '-1'
  return `${cellDate.getMonth() + 1}/${cellDate.getDate()}`
}

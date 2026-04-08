/** UTC offset in hours for the given IANA timezone (DST-aware, rounds to 15 min). */
export function getUtcOffsetHours(timezone: string, date: Date = new Date()): number {
  const d = date
  const utcMs = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' })).getTime()
  const tzMs  = new Date(d.toLocaleString('en-US', { timeZone: timezone })).getTime()
  return Math.round((tzMs - utcMs) / (900_000)) / 4
}

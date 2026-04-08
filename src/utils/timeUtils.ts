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

/** UTC offset in hours for the given IANA timezone (DST-aware, rounds to 15 min). */
export function getUtcOffsetHours(timezone: string): number {
  const d = new Date()
  const utcMs = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' })).getTime()
  const tzMs  = new Date(d.toLocaleString('en-US', { timeZone: timezone })).getTime()
  return Math.round((tzMs - utcMs) / (900_000)) / 4
}

/**
 * Map UTC offset to hue.
 * Full 360° range, offset so adjacent timezones are ~14° apart.
 * UTC-12 starts at hue 0° (red), wraps through the entire color wheel.
 */
function utcOffsetToHue(offset: number): number {
  // Span: UTC-12 to UTC+14 = 26 hours → map to full 360°
  return ((offset + 12) / 26) * 360
}

function timezoneToHue(timezone: string): number {
  return utcOffsetToHue(getUtcOffsetHours(timezone))
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function hsl(h: number, s: number, l: number): string {
  return `hsl(${h.toFixed(0)},${s}%,${l}%)`
}

function hsla(h: number, s: number, l: number, a: number): string {
  return `hsla(${h.toFixed(0)},${s}%,${l}%,${a})`
}

// ── Per-element color exports ────────────────────────────────────────────────
// High saturation + good lightness for maximum distinction on white background.

/** Country polygon fill — vivid, opaque on white ocean. */
export function countryFillColor(timezone: string): string {
  const h = timezoneToHue(timezone)
  return hsla(h, 70, 45, 0.90)
}

/** Country polygon hover — brighter. */
export function countryHoverColor(timezone: string): string {
  const h = timezoneToHue(timezone)
  return hsl(h, 80, 55)
}

/** City dot fill (unregistered). */
export function cityDotColor(timezone: string): string {
  const h = timezoneToHue(timezone)
  return hsl(h, 85, 40)
}

/** City dot fill (registered/added). */
export function cityDotActiveColor(timezone: string): string {
  const h = timezoneToHue(timezone)
  return hsl(h, 90, 50)
}

/** Label box background (unregistered). */
export function labelBgColor(timezone: string): string {
  const h = timezoneToHue(timezone)
  return hsla(h, 50, 15, 0.92)
}

/** Label box background (registered). */
export function labelActiveBgColor(timezone: string): string {
  const h = timezoneToHue(timezone)
  return hsla(h, 65, 22, 0.94)
}

/** Label box border (unregistered). */
export function labelBorderColor(timezone: string): string {
  const h = timezoneToHue(timezone)
  return hsla(h, 60, 45, 0.55)
}

/** Label box border (registered). */
export function labelActiveBorderColor(timezone: string): string {
  const h = timezoneToHue(timezone)
  return hsla(h, 80, 50, 0.85)
}

/** Time text color inside label. */
export function timeTextColor(timezone: string): string {
  const h = timezoneToHue(timezone)
  return hsla(h, 70, 78, 0.97)
}

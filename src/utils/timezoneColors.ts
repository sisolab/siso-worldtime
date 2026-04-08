/** UTC offset in hours for the given IANA timezone (DST-aware, rounds to 15 min). */
export function getUtcOffsetHours(timezone: string): number {
  const d = new Date()
  const utcMs = new Date(d.toLocaleString('en-US', { timeZone: 'UTC' })).getTime()
  const tzMs  = new Date(d.toLocaleString('en-US', { timeZone: timezone })).getTime()
  return Math.round((tzMs - utcMs) / (900_000)) / 4
}

// ── Fixed high-contrast palette ──────────────────────────────────────────────
// 27+ distinct colors, assigned so adjacent UTC offsets are maximally different.

const TZ_PALETTE: Record<string, string> = {
  '-12':    '#B71C1C', // dark red
  '-11':    '#388E3C', // green
  '-10':    '#303F9F', // indigo
  '-9':     '#F57C00', // orange
  '-9.5':   '#E65100', // deep orange
  '-8':     '#7B1FA2', // purple
  '-7':     '#00796B', // teal
  '-6':     '#D32F2F', // red
  '-5':     '#0D47A1', // dark blue
  '-4':     '#689F38', // light green
  '-3.5':   '#558B2F', // olive green
  '-3':     '#C2185B', // pink
  '-2':     '#0097A7', // cyan
  '-1':     '#E65100', // deep orange
  '0':      '#1B5E20', // dark green
  '1':      '#1976D2', // blue
  '2':      '#880E4F', // dark pink
  '3':      '#827717', // olive
  '3.5':    '#9E9D24', // lime
  '4':      '#512DA8', // deep purple
  '4.5':    '#4527A0', // indigo
  '5':      '#0288D1', // light blue
  '5.5':    '#00695C', // dark teal
  '5.75':   '#004D40', // darker teal
  '6':      '#E64A19', // deep orange
  '6.5':    '#BF360C', // brown-orange
  '7':      '#2E7D32', // green
  '8':      '#AD1457', // magenta
  '8.75':   '#880E4F', // dark pink
  '9':      '#1565C0', // blue
  '9.5':    '#0D47A1', // dark blue
  '10':     '#F57C00', // orange
  '10.5':   '#E65100', // deep orange
  '11':     '#00838F', // teal-cyan
  '12':     '#5D4037', // brown
  '12.75':  '#4E342E', // dark brown
  '13':     '#455A64', // blue grey
  '14':     '#6A1B9A', // purple
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function rgba(hex: string, a: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r},${g},${b},${a})`
}

function lighten(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex)
  const lr = Math.min(255, Math.round(r + (255 - r) * factor))
  const lg = Math.min(255, Math.round(g + (255 - g) * factor))
  const lb = Math.min(255, Math.round(b + (255 - b) * factor))
  return `rgb(${lr},${lg},${lb})`
}

function darken(hex: string, factor: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgb(${Math.round(r * (1 - factor))},${Math.round(g * (1 - factor))},${Math.round(b * (1 - factor))})`
}

/** Look up the fixed palette color for a timezone. */
export function getTimezoneBaseColor(timezone: string): string {
  const offset = getUtcOffsetHours(timezone)
  const key = String(offset)
  if (TZ_PALETTE[key]) return TZ_PALETTE[key]
  // Fall back to nearest integer offset
  const rounded = String(Math.round(offset))
  return TZ_PALETTE[rounded] ?? '#9E9E9E'
}

// ── Per-element color exports ────────────────────────────────────────────────

export function countryFillColor(timezone: string): string {
  return rgba(getTimezoneBaseColor(timezone), 0.85)
}

export function countryHoverColor(timezone: string): string {
  return lighten(getTimezoneBaseColor(timezone), 0.25)
}

export function cityDotColor(timezone: string): string {
  return getTimezoneBaseColor(timezone)
}

export function cityDotActiveColor(timezone: string): string {
  return lighten(getTimezoneBaseColor(timezone), 0.15)
}

export function labelBgColor(timezone: string): string {
  return rgba(darken(getTimezoneBaseColor(timezone), 0.35), 0.92)
}

export function labelActiveBgColor(timezone: string): string {
  return rgba(darken(getTimezoneBaseColor(timezone), 0.15), 0.94)
}

export function labelBorderColor(timezone: string): string {
  return rgba(getTimezoneBaseColor(timezone), 0.55)
}

export function labelActiveBorderColor(timezone: string): string {
  return rgba(getTimezoneBaseColor(timezone), 0.85)
}

export function timeTextColor(timezone: string): string {
  return lighten(getTimezoneBaseColor(timezone), 0.6)
}

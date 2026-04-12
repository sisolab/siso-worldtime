function makeMapStyle(bg: string): any {
  return {
    version: 8,
    sources: {
      openmaptiles: {
        type: 'vector',
        url: 'https://tiles.openfreemap.org/planet',
      },
    },
    glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
    layers: [
      { id: 'background', type: 'background', paint: { 'background-color': bg } },
    ],
  }
}

export const MAP_STYLE_LIGHT = makeMapStyle('#e8f4f0')
export const MAP_STYLE_DARK = makeMapStyle('#1a2332')

export const ADMIN1_URL = '/ne_admin1.geojson'
export const TZ_BOUNDS_URL = '/tz-boundaries.geojson'
export const COASTLINE_URL = '/coastline.geojson'

/** Manual timezone abbreviation map (Intl returns GMT+N for most) */
export const TZ_ABBR_MAP: Record<string, string> = {
  'America/Los_Angeles': 'PST/PDT',
  'America/New_York': 'EST/EDT',
  'America/Chicago': 'CST/CDT',
  'Europe/London': 'GMT/BST',
  'Europe/Paris': 'CET/CEST',
  'Europe/Moscow': 'MSK',
  'Asia/Tokyo': 'JST',
  'Asia/Shanghai': 'CST',
  'Asia/Singapore': 'SGT',
  'Asia/Kolkata': 'IST',
  'Australia/Sydney': 'AEST/AEDT',
}

export const REPRESENTATIVE_CITY_IDS = new Set([
  'tokyo', 'beijing',
  'singapore', 'bangkok',
  'mumbai', 'dubai',
  'moscow',
  'london', 'paris',
  'newyork', 'chicago', 'losangeles',
  'saopaulo',
  'sydney',
])

/** Label placement constants */
export const LABEL_GAP = 12   // distance from dot to label edge
export const DOT_SIZE = 10    // dot collision size

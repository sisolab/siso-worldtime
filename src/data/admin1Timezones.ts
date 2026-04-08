import { US_STATE_TIMEZONES } from './usStateTimezones';

/**
 * ISO alpha-2 country code → primary IANA timezone
 * For single-timezone countries (or default timezone for multi-timezone countries).
 */
export const COUNTRY_TZ_BY_ALPHA2: Record<string, string> = {
  // Asia
  AF: 'Asia/Kabul',
  AM: 'Asia/Yerevan',
  AZ: 'Asia/Baku',
  BD: 'Asia/Dhaka',
  BH: 'Asia/Bahrain',
  BN: 'Asia/Brunei',
  BT: 'Asia/Thimphu',
  CN: 'Asia/Shanghai',
  GE: 'Asia/Tbilisi',
  HK: 'Asia/Hong_Kong',
  ID: 'Asia/Jakarta',
  IL: 'Asia/Jerusalem',
  IN: 'Asia/Kolkata',
  IQ: 'Asia/Baghdad',
  IR: 'Asia/Tehran',
  JO: 'Asia/Amman',
  JP: 'Asia/Tokyo',
  KG: 'Asia/Bishkek',
  KH: 'Asia/Phnom_Penh',
  KP: 'Asia/Pyongyang',
  KR: 'Asia/Seoul',
  KW: 'Asia/Kuwait',
  KZ: 'Asia/Almaty',
  LA: 'Asia/Vientiane',
  LB: 'Asia/Beirut',
  MM: 'Asia/Yangon',
  MN: 'Asia/Ulaanbaatar',
  MY: 'Asia/Kuala_Lumpur',
  NP: 'Asia/Kathmandu',
  OM: 'Asia/Muscat',
  PH: 'Asia/Manila',
  PK: 'Asia/Karachi',
  QA: 'Asia/Qatar',
  SA: 'Asia/Riyadh',
  SG: 'Asia/Singapore',
  SY: 'Asia/Damascus',
  TH: 'Asia/Bangkok',
  TJ: 'Asia/Dushanbe',
  TL: 'Asia/Dili',
  TM: 'Asia/Ashgabat',
  TW: 'Asia/Taipei',
  UZ: 'Asia/Tashkent',
  VN: 'Asia/Ho_Chi_Minh',
  YE: 'Asia/Aden',
  AE: 'Asia/Dubai',
  LK: 'Asia/Colombo',
  PG: 'Pacific/Port_Moresby',

  // Europe
  AL: 'Europe/Tirane',
  AT: 'Europe/Vienna',
  BA: 'Europe/Sarajevo',
  BE: 'Europe/Brussels',
  BG: 'Europe/Sofia',
  BY: 'Europe/Minsk',
  CH: 'Europe/Zurich',
  CY: 'Asia/Nicosia',
  CZ: 'Europe/Prague',
  DE: 'Europe/Berlin',
  DK: 'Europe/Copenhagen',
  EE: 'Europe/Tallinn',
  ES: 'Europe/Madrid',
  FI: 'Europe/Helsinki',
  FR: 'Europe/Paris',
  GB: 'Europe/London',
  GR: 'Europe/Athens',
  HR: 'Europe/Zagreb',
  HU: 'Europe/Budapest',
  IE: 'Europe/Dublin',
  IS: 'Atlantic/Reykjavik',
  IT: 'Europe/Rome',
  LT: 'Europe/Vilnius',
  LV: 'Europe/Riga',
  MD: 'Europe/Chisinau',
  ME: 'Europe/Podgorica',
  MK: 'Europe/Skopje',
  NL: 'Europe/Amsterdam',
  NO: 'Europe/Oslo',
  PL: 'Europe/Warsaw',
  PT: 'Europe/Lisbon',
  RO: 'Europe/Bucharest',
  RS: 'Europe/Belgrade',
  RU: 'Europe/Moscow',
  SE: 'Europe/Stockholm',
  SI: 'Europe/Ljubljana',
  SK: 'Europe/Bratislava',
  TR: 'Europe/Istanbul',
  UA: 'Europe/Kyiv',

  // Africa
  AO: 'Africa/Luanda',
  BF: 'Africa/Ouagadougou',
  BI: 'Africa/Bujumbura',
  BJ: 'Africa/Porto-Novo',
  BW: 'Africa/Gaborone',
  CD: 'Africa/Kinshasa',
  CG: 'Africa/Brazzaville',
  CI: 'Africa/Abidjan',
  CM: 'Africa/Douala',
  DJ: 'Africa/Djibouti',
  DZ: 'Africa/Algiers',
  EG: 'Africa/Cairo',
  ER: 'Africa/Asmara',
  ET: 'Africa/Addis_Ababa',
  GA: 'Africa/Libreville',
  GH: 'Africa/Accra',
  GN: 'Africa/Conakry',
  GQ: 'Africa/Malabo',
  KE: 'Africa/Nairobi',
  LR: 'Africa/Monrovia',
  LY: 'Africa/Tripoli',
  MA: 'Africa/Casablanca',
  MG: 'Indian/Antananarivo',
  ML: 'Africa/Bamako',
  MR: 'Africa/Nouakchott',
  MW: 'Africa/Blantyre',
  MZ: 'Africa/Maputo',
  NA: 'Africa/Windhoek',
  NE: 'Africa/Niamey',
  NG: 'Africa/Lagos',
  RW: 'Africa/Kigali',
  SD: 'Africa/Khartoum',
  SL: 'Africa/Freetown',
  SN: 'Africa/Dakar',
  SO: 'Africa/Mogadishu',
  TG: 'Africa/Lome',
  TN: 'Africa/Tunis',
  TZ: 'Africa/Dar_es_Salaam',
  UG: 'Africa/Kampala',
  ZA: 'Africa/Johannesburg',
  ZM: 'Africa/Lusaka',
  ZW: 'Africa/Harare',

  // Americas
  AR: 'America/Argentina/Buenos_Aires',
  BO: 'America/La_Paz',
  BR: 'America/Sao_Paulo',
  CA: 'America/Toronto',
  CL: 'America/Santiago',
  CO: 'America/Bogota',
  CR: 'America/Costa_Rica',
  CU: 'America/Havana',
  DO: 'America/Santo_Domingo',
  EC: 'America/Guayaquil',
  GT: 'America/Guatemala',
  HN: 'America/Tegucigalpa',
  HT: 'America/Port-au-Prince',
  JM: 'America/Jamaica',
  MX: 'America/Mexico_City',
  NI: 'America/Managua',
  PA: 'America/Panama',
  PE: 'America/Lima',
  PY: 'America/Asuncion',
  SV: 'America/El_Salvador',
  US: 'America/New_York',
  UY: 'America/Montevideo',
  VE: 'America/Caracas',

  // Oceania
  AU: 'Australia/Sydney',
  FJ: 'Pacific/Fiji',
  NZ: 'Pacific/Auckland',
};

// ---------------------------------------------------------------------------
// Multi-timezone country mappings
// ---------------------------------------------------------------------------

/** Canada: postal code → IANA timezone */
const CA_POSTAL_TZ: Record<string, string> = {
  NL: 'America/St_Johns',
  NS: 'America/Halifax',
  NB: 'America/Halifax',
  PE: 'America/Halifax',
  QC: 'America/Toronto',
  ON: 'America/Toronto',
  MB: 'America/Winnipeg',
  SK: 'America/Regina',
  AB: 'America/Edmonton',
  BC: 'America/Vancouver',
  YT: 'America/Whitehorse',
  NT: 'America/Yellowknife',
  NU: 'America/Iqaluit',
};

/** Australia: postal code → IANA timezone */
const AU_POSTAL_TZ: Record<string, string> = {
  WA: 'Australia/Perth',
  NT: 'Australia/Darwin',
  SA: 'Australia/Adelaide',
  QL: 'Australia/Brisbane',
  QLD: 'Australia/Brisbane',
  NS: 'Australia/Sydney',
  NSW: 'Australia/Sydney',
  VI: 'Australia/Melbourne',
  VIC: 'Australia/Melbourne',
  TS: 'Australia/Hobart',
  TAS: 'Australia/Hobart',
  AC: 'Australia/Sydney',
  ACT: 'Australia/Sydney',
};

// ---------------------------------------------------------------------------
// Longitude-based timezone resolvers for large multi-timezone countries
// ---------------------------------------------------------------------------

function getRussiaTimezone(longitude: number): string {
  if (longitude < 22) return 'Europe/Kaliningrad';
  if (longitude < 46) return 'Europe/Moscow';
  if (longitude < 55) return 'Europe/Samara';
  if (longitude < 66) return 'Asia/Yekaterinburg';
  if (longitude < 85) return 'Asia/Omsk';
  if (longitude < 98) return 'Asia/Krasnoyarsk';
  if (longitude < 113) return 'Asia/Irkutsk';
  if (longitude < 135) return 'Asia/Yakutsk';
  if (longitude < 150) return 'Asia/Vladivostok';
  if (longitude < 160) return 'Asia/Magadan';
  return 'Asia/Kamchatka';
}

function getBrazilTimezone(longitude: number): string {
  if (longitude < -65) return 'America/Manaus';
  if (longitude < -50) return 'America/Cuiaba';
  return 'America/Sao_Paulo';
}

function getIndonesiaTimezone(longitude: number): string {
  if (longitude < 115) return 'Asia/Jakarta';
  if (longitude < 130) return 'Asia/Makassar';
  return 'Asia/Jayapura';
}

function getMexicoTimezone(longitude: number): string {
  if (longitude < -110) return 'America/Tijuana';
  if (longitude < -105) return 'America/Mazatlan';
  return 'America/Mexico_City';
}

// ---------------------------------------------------------------------------
// Main lookup function
// ---------------------------------------------------------------------------

interface Admin1Props {
  iso_a2: string;
  name?: string;
  postal?: string;
  longitude?: number;
}

/**
 * Returns the IANA timezone for a Natural Earth admin-1 feature.
 *
 * For multi-timezone countries (US, RU, CA, AU, BR, ID, MX) it uses
 * province-level name/postal code or longitude-based approximation.
 * For all other countries it falls back to COUNTRY_TZ_BY_ALPHA2.
 */
export function getAdmin1Timezone(props: Admin1Props): string | undefined {
  const { iso_a2, name, postal, longitude } = props;

  switch (iso_a2) {
    // United States – look up by state name
    case 'US': {
      if (name && US_STATE_TIMEZONES[name]) {
        return US_STATE_TIMEZONES[name];
      }
      return COUNTRY_TZ_BY_ALPHA2.US;
    }

    // Russia – longitude-based
    case 'RU': {
      if (longitude != null) {
        return getRussiaTimezone(longitude);
      }
      return COUNTRY_TZ_BY_ALPHA2.RU;
    }

    // Canada – postal code
    case 'CA': {
      if (postal && CA_POSTAL_TZ[postal]) {
        return CA_POSTAL_TZ[postal];
      }
      return COUNTRY_TZ_BY_ALPHA2.CA;
    }

    // Australia – postal code
    case 'AU': {
      if (postal && AU_POSTAL_TZ[postal]) {
        return AU_POSTAL_TZ[postal];
      }
      return COUNTRY_TZ_BY_ALPHA2.AU;
    }

    // Brazil – longitude-based
    case 'BR': {
      if (longitude != null) {
        return getBrazilTimezone(longitude);
      }
      return COUNTRY_TZ_BY_ALPHA2.BR;
    }

    // Indonesia – longitude-based
    case 'ID': {
      if (longitude != null) {
        return getIndonesiaTimezone(longitude);
      }
      return COUNTRY_TZ_BY_ALPHA2.ID;
    }

    // Mexico – longitude-based
    case 'MX': {
      if (longitude != null) {
        return getMexicoTimezone(longitude);
      }
      return COUNTRY_TZ_BY_ALPHA2.MX;
    }

    // All other countries – single-timezone lookup
    default:
      return COUNTRY_TZ_BY_ALPHA2[iso_a2];
  }
}

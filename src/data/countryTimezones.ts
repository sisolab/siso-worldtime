/**
 * ISO 3166-1 numeric code → primary IANA timezone.
 * For countries with multiple timezones (USA, Russia, etc.) the capital/most-populated timezone is used.
 * City dots on the map will still show the correct individual timezone color.
 */
export const COUNTRY_TIMEZONES: Record<number, string> = {
  // ── Americas ──────────────────────────────────────────────────────────────
  124: 'America/Toronto',                  // Canada
  840: 'America/New_York',                 // USA  (Eastern — DC)
  484: 'America/Mexico_City',              // Mexico
  320: 'America/Guatemala',               // Guatemala
  340: 'America/Tegucigalpa',             // Honduras
  222: 'America/El_Salvador',             // El Salvador
  558: 'America/Managua',                 // Nicaragua
  188: 'America/Costa_Rica',              // Costa Rica
  591: 'America/Panama',                  // Panama
  192: 'America/Havana',                  // Cuba
  332: 'America/Port-au-Prince',          // Haiti
  214: 'America/Santo_Domingo',           // Dominican Republic
  388: 'America/Jamaica',                 // Jamaica
  44:  'America/Nassau',                  // Bahamas
  84:  'America/Belize',                  // Belize
  170: 'America/Bogota',                  // Colombia
  218: 'America/Guayaquil',               // Ecuador
  604: 'America/Lima',                    // Peru
  862: 'America/Caracas',                 // Venezuela
  76:  'America/Sao_Paulo',               // Brazil
  68:  'America/La_Paz',                  // Bolivia
  600: 'America/Asuncion',                // Paraguay
  152: 'America/Santiago',                // Chile
  32:  'America/Argentina/Buenos_Aires',  // Argentina
  858: 'America/Montevideo',              // Uruguay
  328: 'America/Guyana',                  // Guyana
  740: 'America/Paramaribo',              // Suriname

  // ── Europe ────────────────────────────────────────────────────────────────
  826: 'Europe/London',                   // UK
  372: 'Europe/Dublin',                   // Ireland
  352: 'Atlantic/Reykjavik',              // Iceland
  620: 'Europe/Lisbon',                   // Portugal
  724: 'Europe/Madrid',                   // Spain
  250: 'Europe/Paris',                    // France
  56:  'Europe/Brussels',                 // Belgium
  528: 'Europe/Amsterdam',                // Netherlands
  276: 'Europe/Berlin',                   // Germany
  756: 'Europe/Zurich',                   // Switzerland
  40:  'Europe/Vienna',                   // Austria
  380: 'Europe/Rome',                     // Italy
  442: 'Europe/Luxembourg',               // Luxembourg
  752: 'Europe/Stockholm',                // Sweden
  578: 'Europe/Oslo',                     // Norway
  208: 'Europe/Copenhagen',               // Denmark
  246: 'Europe/Helsinki',                 // Finland
  233: 'Europe/Tallinn',                  // Estonia
  428: 'Europe/Riga',                     // Latvia
  440: 'Europe/Vilnius',                  // Lithuania
  616: 'Europe/Warsaw',                   // Poland
  203: 'Europe/Prague',                   // Czech Republic
  703: 'Europe/Bratislava',               // Slovakia
  348: 'Europe/Budapest',                 // Hungary
  642: 'Europe/Bucharest',                // Romania
  100: 'Europe/Sofia',                    // Bulgaria
  300: 'Europe/Athens',                   // Greece
  191: 'Europe/Zagreb',                   // Croatia
  688: 'Europe/Belgrade',                 // Serbia
  70:  'Europe/Sarajevo',                 // Bosnia
  807: 'Europe/Skopje',                   // North Macedonia
  8:   'Europe/Tirane',                   // Albania
  499: 'Europe/Podgorica',                // Montenegro
  705: 'Europe/Ljubljana',                // Slovenia
  196: 'Asia/Nicosia',                    // Cyprus
  804: 'Europe/Kyiv',                     // Ukraine
  112: 'Europe/Minsk',                    // Belarus
  498: 'Europe/Chisinau',                 // Moldova
  792: 'Europe/Istanbul',                 // Turkey
  643: 'Europe/Moscow',                   // Russia
  51:  'Asia/Yerevan',                    // Armenia
  31:  'Asia/Baku',                       // Azerbaijan

  // ── Central Asia ──────────────────────────────────────────────────────────
  268: 'Asia/Tbilisi',                    // Georgia
  398: 'Asia/Almaty',                     // Kazakhstan
  860: 'Asia/Tashkent',                   // Uzbekistan
  762: 'Asia/Dushanbe',                   // Tajikistan
  417: 'Asia/Bishkek',                    // Kyrgyzstan
  795: 'Asia/Ashgabat',                   // Turkmenistan

  // ── Middle East ───────────────────────────────────────────────────────────
  376: 'Asia/Jerusalem',                  // Israel
  422: 'Asia/Beirut',                     // Lebanon
  400: 'Asia/Amman',                      // Jordan
  760: 'Asia/Damascus',                   // Syria
  368: 'Asia/Baghdad',                    // Iraq
  364: 'Asia/Tehran',                     // Iran
  682: 'Asia/Riyadh',                     // Saudi Arabia
  887: 'Asia/Aden',                       // Yemen
  512: 'Asia/Muscat',                     // Oman
  784: 'Asia/Dubai',                      // UAE
  634: 'Asia/Qatar',                      // Qatar
  414: 'Asia/Kuwait',                     // Kuwait
  48:  'Asia/Bahrain',                    // Bahrain

  // ── South Asia ────────────────────────────────────────────────────────────
  586: 'Asia/Karachi',                    // Pakistan
  4:   'Asia/Kabul',                      // Afghanistan
  356: 'Asia/Kolkata',                    // India
  524: 'Asia/Kathmandu',                  // Nepal
  50:  'Asia/Dhaka',                      // Bangladesh
  64:  'Asia/Thimphu',                    // Bhutan
  144: 'Asia/Colombo',                    // Sri Lanka
  462: 'Indian/Maldives',                 // Maldives

  // ── Southeast Asia ────────────────────────────────────────────────────────
  104: 'Asia/Yangon',                     // Myanmar
  764: 'Asia/Bangkok',                    // Thailand
  418: 'Asia/Vientiane',                  // Laos
  116: 'Asia/Phnom_Penh',                 // Cambodia
  704: 'Asia/Ho_Chi_Minh',               // Vietnam
  458: 'Asia/Kuala_Lumpur',              // Malaysia
  702: 'Asia/Singapore',                  // Singapore
  360: 'Asia/Jakarta',                    // Indonesia
  608: 'Asia/Manila',                     // Philippines

  // ── East Asia ─────────────────────────────────────────────────────────────
  156: 'Asia/Shanghai',                   // China
  344: 'Asia/Hong_Kong',                  // Hong Kong
  158: 'Asia/Taipei',                     // Taiwan
  496: 'Asia/Ulaanbaatar',               // Mongolia
  408: 'Asia/Pyongyang',                  // North Korea
  410: 'Asia/Seoul',                      // South Korea
  392: 'Asia/Tokyo',                      // Japan

  // ── Africa ────────────────────────────────────────────────────────────────
  504: 'Africa/Casablanca',               // Morocco
  12:  'Africa/Algiers',                  // Algeria
  788: 'Africa/Tunis',                    // Tunisia
  434: 'Africa/Tripoli',                  // Libya
  818: 'Africa/Cairo',                    // Egypt
  729: 'Africa/Khartoum',                 // Sudan
  706: 'Africa/Mogadishu',                // Somalia
  231: 'Africa/Addis_Ababa',              // Ethiopia
  232: 'Africa/Asmara',                   // Eritrea
  404: 'Africa/Nairobi',                  // Kenya
  800: 'Africa/Kampala',                  // Uganda
  834: 'Africa/Dar_es_Salaam',            // Tanzania
  646: 'Africa/Kigali',                   // Rwanda
  108: 'Africa/Bujumbura',                // Burundi
  450: 'Indian/Antananarivo',             // Madagascar
  508: 'Africa/Maputo',                   // Mozambique
  454: 'Africa/Blantyre',                 // Malawi
  894: 'Africa/Lusaka',                   // Zambia
  716: 'Africa/Harare',                   // Zimbabwe
  710: 'Africa/Johannesburg',             // South Africa
  516: 'Africa/Windhoek',                 // Namibia
  72:  'Africa/Gaborone',                 // Botswana
  24:  'Africa/Luanda',                   // Angola
  180: 'Africa/Kinshasa',                 // DR Congo
  178: 'Africa/Brazzaville',              // Republic of Congo
  120: 'Africa/Douala',                   // Cameroon
  140: 'Africa/Bangui',                   // Central African Republic
  148: 'Africa/Ndjamena',                 // Chad
  562: 'Africa/Niamey',                   // Niger
  566: 'Africa/Lagos',                    // Nigeria
  204: 'Africa/Porto-Novo',               // Benin
  768: 'Africa/Lome',                     // Togo
  288: 'Africa/Accra',                    // Ghana
  384: 'Africa/Abidjan',                  // Ivory Coast
  430: 'Africa/Monrovia',                 // Liberia
  694: 'Africa/Freetown',                 // Sierra Leone
  324: 'Africa/Conakry',                  // Guinea
  686: 'Africa/Dakar',                    // Senegal
  466: 'Africa/Bamako',                   // Mali
  478: 'Africa/Nouakchott',               // Mauritania
  854: 'Africa/Ouagadougou',              // Burkina Faso
  480: 'Indian/Mauritius',                // Mauritius
  690: 'Indian/Mahe',                     // Seychelles

  // ── Oceania ───────────────────────────────────────────────────────────────
  36:  'Australia/Sydney',                // Australia
  554: 'Pacific/Auckland',                // New Zealand
  598: 'Pacific/Port_Moresby',            // Papua New Guinea
  242: 'Pacific/Fiji',                    // Fiji
}

const fs = require('fs');
const topojson = require('topojson-client');

// Step 1: Convert TopoJSON → GeoJSON (NO filtering — MapLibre handles antimeridian)
const topo = JSON.parse(fs.readFileSync('./public/ne_admin1.topojson', 'utf8'));
const data = topojson.feature(topo, topo.objects.admin1);

// Only skip Antarctica
data.features = data.features.filter(f => f.properties.iso_a2 !== 'AQ');

const COUNTRY_TZ = {
  // Asia
  AF:'Asia/Kabul',AM:'Asia/Yerevan',AZ:'Asia/Baku',BD:'Asia/Dhaka',BH:'Asia/Bahrain',
  BN:'Asia/Brunei',BT:'Asia/Thimphu',CN:'Asia/Shanghai',GE:'Asia/Tbilisi',HK:'Asia/Hong_Kong',
  ID:'Asia/Jakarta',IL:'Asia/Jerusalem',IN:'Asia/Kolkata',IQ:'Asia/Baghdad',IR:'Asia/Tehran',
  JO:'Asia/Amman',JP:'Asia/Tokyo',KG:'Asia/Bishkek',KH:'Asia/Phnom_Penh',KP:'Asia/Pyongyang',
  KR:'Asia/Seoul',KW:'Asia/Kuwait',KZ:'Asia/Almaty',LA:'Asia/Vientiane',LB:'Asia/Beirut',
  MM:'Asia/Yangon',MN:'Asia/Ulaanbaatar',MY:'Asia/Kuala_Lumpur',NP:'Asia/Kathmandu',
  OM:'Asia/Muscat',PH:'Asia/Manila',PK:'Asia/Karachi',PS:'Asia/Gaza',QA:'Asia/Qatar',
  SA:'Asia/Riyadh',SG:'Asia/Singapore',SY:'Asia/Damascus',TH:'Asia/Bangkok',TJ:'Asia/Dushanbe',
  TL:'Asia/Dili',TM:'Asia/Ashgabat',TW:'Asia/Taipei',UZ:'Asia/Tashkent',VN:'Asia/Ho_Chi_Minh',
  YE:'Asia/Aden',AE:'Asia/Dubai',
  // Europe
  AL:'Europe/Tirane',AD:'Europe/Andorra',AT:'Europe/Vienna',BA:'Europe/Sarajevo',
  BE:'Europe/Brussels',BG:'Europe/Sofia',BY:'Europe/Minsk',CH:'Europe/Zurich',
  CY:'Asia/Nicosia',CZ:'Europe/Prague',DE:'Europe/Berlin',DK:'Europe/Copenhagen',
  EE:'Europe/Tallinn',ES:'Europe/Madrid',FI:'Europe/Helsinki',FO:'Atlantic/Faroe',
  FR:'Europe/Paris',GB:'Europe/London',GI:'Europe/Gibraltar',GR:'Europe/Athens',
  HR:'Europe/Zagreb',HU:'Europe/Budapest',IE:'Europe/Dublin',IM:'Europe/Isle_of_Man',
  IS:'Atlantic/Reykjavik',IT:'Europe/Rome',LI:'Europe/Vaduz',LT:'Europe/Vilnius',
  LU:'Europe/Luxembourg',LV:'Europe/Riga',MC:'Europe/Monaco',MD:'Europe/Chisinau',
  ME:'Europe/Podgorica',MK:'Europe/Skopje',MT:'Europe/Malta',NL:'Europe/Amsterdam',
  NO:'Europe/Oslo',PL:'Europe/Warsaw',PT:'Europe/Lisbon',RO:'Europe/Bucharest',
  RS:'Europe/Belgrade',RU:'Europe/Moscow',SE:'Europe/Stockholm',SI:'Europe/Ljubljana',
  SK:'Europe/Bratislava',SM:'Europe/San_Marino',TR:'Europe/Istanbul',UA:'Europe/Kyiv',
  VA:'Europe/Vatican',XK:'Europe/Belgrade',AX:'Europe/Helsinki',
  // Africa
  AO:'Africa/Luanda',BF:'Africa/Ouagadougou',BI:'Africa/Bujumbura',BJ:'Africa/Porto-Novo',
  BW:'Africa/Gaborone',CD:'Africa/Kinshasa',CF:'Africa/Bangui',CG:'Africa/Brazzaville',
  CI:'Africa/Abidjan',CM:'Africa/Douala',CV:'Atlantic/Cape_Verde',DJ:'Africa/Djibouti',
  DZ:'Africa/Algiers',EG:'Africa/Cairo',EH:'Africa/El_Aaiun',ER:'Africa/Asmara',
  ET:'Africa/Addis_Ababa',GA:'Africa/Libreville',GH:'Africa/Accra',GM:'Africa/Banjul',
  GN:'Africa/Conakry',GQ:'Africa/Malabo',GW:'Africa/Bissau',KE:'Africa/Nairobi',
  KM:'Indian/Comoro',LR:'Africa/Monrovia',LS:'Africa/Maseru',LY:'Africa/Tripoli',
  MA:'Africa/Casablanca',MG:'Indian/Antananarivo',ML:'Africa/Bamako',MR:'Africa/Nouakchott',
  MU:'Indian/Mauritius',MW:'Africa/Blantyre',MZ:'Africa/Maputo',NA:'Africa/Windhoek',
  NE:'Africa/Niamey',NG:'Africa/Lagos',RW:'Africa/Kigali',SC:'Indian/Mahe',
  SD:'Africa/Khartoum',SL:'Africa/Freetown',SN:'Africa/Dakar',SO:'Africa/Mogadishu',
  SS:'Africa/Juba',ST:'Africa/Sao_Tome',SZ:'Africa/Mbabane',TD:'Africa/Ndjamena',
  TG:'Africa/Lome',TN:'Africa/Tunis',TZ:'Africa/Dar_es_Salaam',UG:'Africa/Kampala',
  ZA:'Africa/Johannesburg',ZM:'Africa/Lusaka',ZW:'Africa/Harare',
  // Americas
  AG:'America/Antigua',AI:'America/Anguilla',AR:'America/Argentina/Buenos_Aires',
  BB:'America/Barbados',BM:'Atlantic/Bermuda',BO:'America/La_Paz',BR:'America/Sao_Paulo',
  BS:'America/Nassau',BZ:'America/Belize',CA:'America/Toronto',CL:'America/Santiago',
  CO:'America/Bogota',CR:'America/Costa_Rica',CU:'America/Havana',CW:'America/Curacao',
  DM:'America/Dominica',DO:'America/Santo_Domingo',EC:'America/Guayaquil',
  FK:'Atlantic/Stanley',GD:'America/Grenada',GL:'America/Godthab',GT:'America/Guatemala',
  GY:'America/Guyana',HN:'America/Tegucigalpa',HT:'America/Port-au-Prince',
  JM:'America/Jamaica',KN:'America/St_Kitts',LC:'America/St_Lucia',
  MF:'America/Marigot',MS:'America/Montserrat',MX:'America/Mexico_City',
  NI:'America/Managua',PA:'America/Panama',PE:'America/Lima',PM:'America/Miquelon',
  PR:'America/Puerto_Rico',PY:'America/Asuncion',SR:'America/Paramaribo',
  SV:'America/El_Salvador',SX:'America/Lower_Princes',TT:'America/Port_of_Spain',
  US:'America/New_York',UY:'America/Montevideo',VC:'America/St_Vincent',
  VE:'America/Caracas',VI:'America/St_Thomas',
  // Oceania
  AS:'Pacific/Pago_Pago',AU:'Australia/Sydney',FJ:'Pacific/Fiji',FM:'Pacific/Chuuk',
  GU:'Pacific/Guam',KI:'Pacific/Tarawa',NC:'Pacific/Noumea',NR:'Pacific/Nauru',
  NZ:'Pacific/Auckland',PF:'Pacific/Tahiti',PG:'Pacific/Port_Moresby',PW:'Pacific/Palau',
  SB:'Pacific/Guadalcanal',TO:'Pacific/Tongatapu',VU:'Pacific/Efate',WF:'Pacific/Wallis',
  WS:'Pacific/Apia',
  // Other
  GS:'Atlantic/South_Georgia',HM:'Indian/Kerguelen',LK:'Asia/Colombo',
  TF:'Indian/Kerguelen',
};

const US_TZ = {
  'Alabama':'America/Chicago','Arizona':'America/Phoenix','Arkansas':'America/Chicago',
  'California':'America/Los_Angeles','Colorado':'America/Denver','Connecticut':'America/New_York',
  'Delaware':'America/New_York','Florida':'America/New_York','Georgia':'America/New_York',
  'Hawaii':'Pacific/Honolulu','Idaho':'America/Boise','Illinois':'America/Chicago',
  'Indiana':'America/Indiana/Indianapolis','Iowa':'America/Chicago','Kansas':'America/Chicago',
  'Kentucky':'America/New_York','Louisiana':'America/Chicago','Maine':'America/New_York',
  'Maryland':'America/New_York','Massachusetts':'America/New_York','Michigan':'America/Detroit',
  'Minnesota':'America/Chicago','Mississippi':'America/Chicago','Missouri':'America/Chicago',
  'Montana':'America/Denver','Nebraska':'America/Chicago','Nevada':'America/Los_Angeles',
  'New Hampshire':'America/New_York','New Jersey':'America/New_York',
  'New Mexico':'America/Denver','New York':'America/New_York',
  'North Carolina':'America/New_York','North Dakota':'America/Chicago',
  'Ohio':'America/New_York','Oklahoma':'America/Chicago','Oregon':'America/Los_Angeles',
  'Pennsylvania':'America/New_York','Rhode Island':'America/New_York',
  'South Carolina':'America/New_York','South Dakota':'America/Chicago',
  'Tennessee':'America/Chicago','Texas':'America/Chicago','Utah':'America/Denver',
  'Vermont':'America/New_York','Virginia':'America/New_York','Washington':'America/Los_Angeles',
  'West Virginia':'America/New_York','Wisconsin':'America/Chicago','Wyoming':'America/Denver',
  'District of Columbia':'America/New_York','Puerto Rico':'America/Puerto_Rico',
  'Alaska':'America/Anchorage',
};

// Special territories with iso_a2 = "-1"
const SPECIAL_TZ = {
  'Somaliland': 'Africa/Mogadishu',
  'Northern Cyprus': 'Asia/Nicosia',
  'Kashmir': 'Asia/Kolkata',
  'Baykonur lease in Qyzylorda': 'Asia/Almaty',
  'Baikonur': 'Asia/Almaty',
  'Dhekelia': 'Asia/Nicosia',
  'Akrotiri': 'Asia/Nicosia',
  'Guantanamo Bay USNB': 'America/Havana',
  'USNB, Guantanamo Bay': 'America/Havana',
};

function getTz(p) {
  const iso = p.iso_a2, name = p.name, lng = p.longitude;
  if (iso === '-1' || iso === '-99') return SPECIAL_TZ[name];
  if (iso === 'US') return US_TZ[name] || 'America/New_York';
  if (iso === 'RU') {
    if (lng<22) return 'Europe/Kaliningrad'; if (lng<46) return 'Europe/Moscow';
    if (lng<55) return 'Europe/Samara'; if (lng<66) return 'Asia/Yekaterinburg';
    if (lng<85) return 'Asia/Omsk'; if (lng<98) return 'Asia/Krasnoyarsk';
    if (lng<113) return 'Asia/Irkutsk'; if (lng<135) return 'Asia/Yakutsk';
    if (lng<150) return 'Asia/Vladivostok'; if (lng<160) return 'Asia/Magadan';
    return 'Asia/Kamchatka';
  }
  if (iso === 'CA') {
    if (lng>-56) return 'America/St_Johns'; if (lng>-68) return 'America/Halifax';
    if (lng>-90) return 'America/Toronto'; if (lng>-102) return 'America/Winnipeg';
    if (lng>-118) return 'America/Edmonton'; return 'America/Vancouver';
  }
  if (iso === 'AU') {
    if (lng<129) return 'Australia/Perth'; if (lng<138) return 'Australia/Darwin';
    return 'Australia/Sydney';
  }
  if (iso === 'BR') {
    if (lng<-65) return 'America/Manaus'; if (lng<-50) return 'America/Cuiaba';
    return 'America/Sao_Paulo';
  }
  if (iso === 'ID') {
    if (lng<115) return 'Asia/Jakarta'; if (lng<130) return 'Asia/Makassar';
    return 'Asia/Jayapura';
  }
  if (iso === 'MX') {
    if (lng<-110) return 'America/Tijuana'; if (lng<-105) return 'America/Mazatlan';
    return 'America/Mexico_City';
  }
  return COUNTRY_TZ[iso];
}

function getOffsetHours(tz) {
  try {
    const d = new Date();
    const utc = new Date(d.toLocaleString('en-US',{timeZone:'UTC'})).getTime();
    const local = new Date(d.toLocaleString('en-US',{timeZone:tz})).getTime();
    return Math.round((local-utc)/900000)/4;
  } catch { return 0; }
}

function fillColor(tz) {
  const h = ((getOffsetHours(tz)+12)/26)*360;
  return 'hsl('+Math.round(h)+',70%,45%)';
}

let colored = 0, uncolored = [];
for (const f of data.features) {
  const tz = getTz(f.properties);
  if (tz) {
    f.properties.tzColor = fillColor(tz);
    colored++;
  } else {
    f.properties.tzColor = '#e0e0e0';
    const iso = f.properties.iso_a2;
    if (iso && iso !== '-1' && iso !== '-99' && !uncolored.includes(iso)) uncolored.push(iso);
  }
}

console.log('Colored:', colored, '/', data.features.length);
if (uncolored.length) console.log('Still missing:', uncolored.join(', '));

// ── Dissolve admin-1 features by tzColor using topojson.merge ────────────────
// topojson.merge() properly removes shared arcs between adjacent polygons.

// Group TopoJSON geometries by tzColor
const topoGeoms = topo.objects.admin1.geometries;
const groups = {};
for (const g of topoGeoms) {
  const c = g.properties.tzColor;
  if (!groups[c]) groups[c] = [];
  groups[c].push(g);
}

const mergedFeatures = [];
for (const [color, geomGroup] of Object.entries(groups)) {
  const merged = topojson.merge(topo, geomGroup);
  mergedFeatures.push({
    type: 'Feature',
    properties: { tzColor: color },
    geometry: merged,
  });
}

const mergedGeoJson = { type: 'FeatureCollection', features: mergedFeatures };
fs.writeFileSync('./public/ne_admin1.geojson', JSON.stringify(mergedGeoJson));
const fillSize = (fs.statSync('./public/ne_admin1.geojson').size / 1024 / 1024).toFixed(1);
console.log('Dissolved:', mergedFeatures.length, 'timezone groups,', fillSize, 'MB');

// ── Step 2: Generate timezone boundary lines ────────────────────────────────
// Filter TopoJSON geometries the same way (remove Antarctica) and add tzColor
topo.objects.admin1.geometries = topo.objects.admin1.geometries.filter(
  g => g.properties && g.properties.iso_a2 !== 'AQ'
);
const geoms = topo.objects.admin1.geometries;
for (let i = 0; i < geoms.length; i++) {
  geoms[i].properties.tzColor = data.features[i].properties.tzColor;
}

// Extract only borders between regions with DIFFERENT timezone colors
const tzMesh = topojson.mesh(topo, topo.objects.admin1, (a, b) => {
  return a.properties.tzColor !== b.properties.tzColor;
});

const boundaryGeoJson = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: {},
    geometry: tzMesh,
  }],
};

fs.writeFileSync('./public/tz-boundaries.geojson', JSON.stringify(boundaryGeoJson));
const sizeMB = (fs.statSync('./public/tz-boundaries.geojson').size / 1024 / 1024).toFixed(2);
console.log('Timezone boundaries:', sizeMB, 'MB');

// Sun / moon / earth calculations. Everything here is plain math from the clock:
// no web service, no API key, and it works offline.
import { PLACES } from "./places.js";

const RAD = Math.PI / 180;
const wrap360 = (d) => ((d % 360) + 360) % 360;
const wrap180 = (d) => wrap360(d + 180) - 180;
const sin = (deg) => Math.sin(deg * RAD);
const cos = (deg) => Math.cos(deg * RAD);

export const julianDay = (date) => date.getTime() / 86400000 + 2440587.5;

// ---------- the moon ----------
// Terms are [D, M, M', F, coefficient] from Meeus, "Astronomical Algorithms", ch. 47
// (longitude in 1e-6 degrees, distance in 1e-3 km). Only the larger terms are kept.
const LON_TERMS = [
  [0, 0, 1, 0, 6288774], [2, 0, -1, 0, 1274027], [2, 0, 0, 0, 658314], [0, 0, 2, 0, 213618],
  [0, 1, 0, 0, -185116], [0, 0, 0, 2, -114332], [2, 0, -2, 0, 58793], [2, -1, -1, 0, 57066],
  [2, 0, 1, 0, 53322], [2, -1, 0, 0, 45758], [0, 1, -1, 0, -40923], [1, 0, 0, 0, -34720],
  [0, 1, 1, 0, -30383], [2, 0, 0, -2, 15327], [0, 0, 1, 2, -12528], [0, 0, 1, -2, 10980],
  [4, 0, -1, 0, 10675], [0, 0, 3, 0, 10034], [4, 0, -2, 0, 8548], [2, 1, -1, 0, -7888],
  [2, 1, 0, 0, -6766], [1, 0, -1, 0, -5163], [1, 1, 0, 0, 4987], [2, -1, 1, 0, 4036],
  [2, 0, 2, 0, 3994], [4, 0, 0, 0, 3861],
];
const DIST_TERMS = [
  [0, 0, 1, 0, -20905355], [2, 0, -1, 0, -3699111], [2, 0, 0, 0, -2955968], [0, 0, 2, 0, -569925],
  [0, 1, 0, 0, 48888], [0, 0, 0, 2, -3149], [2, 0, -2, 0, 246158], [2, -1, -1, 0, -152138],
  [2, 0, 1, 0, -170733], [2, -1, 0, 0, -204586], [0, 1, -1, 0, -129620], [1, 0, 0, 0, 108743],
  [0, 1, 1, 0, 104755], [2, 0, 0, -2, 10321], [0, 0, 1, -2, 79661], [4, 0, -1, 0, -34782],
  [2, 0, -3, 0, -23210], [4, 0, -2, 0, -21636], [2, 1, -1, 0, 24208], [2, 1, 0, 0, 30824],
  [1, 0, -1, 0, -8379], [1, 1, 0, 0, -16675], [2, -1, 1, 0, -12831], [2, 0, 2, 0, -10445],
  [4, 0, 0, 0, -11650], [2, 0, -1, -2, 14403],
];

function fundamentals(jd) {
  const T = (jd - 2451545.0) / 36525;
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  return {
    T,
    Lp: wrap360(218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000),
    D: wrap360(297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000),
    M: wrap360(357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000),
    Mp: wrap360(134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000),
    F: wrap360(93.272095 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000),
    E: 1 - 0.002516 * T - 0.0000074 * T2,
  };
}

const eFactor = (m, E) => (m === 0 ? 1 : Math.abs(m) === 1 ? E : E * E);

function moonLongitude(f) {
  let sum = 0;
  for (const [d, m, mp, ff, c] of LON_TERMS) {
    sum += c * eFactor(m, f.E) * sin(d * f.D + m * f.M + mp * f.Mp + ff * f.F);
  }
  const A1 = 119.75 + 131.849 * f.T;
  const A2 = 53.09 + 479264.29 * f.T;
  sum += 3958 * sin(A1) + 1962 * sin(f.Lp - f.F) + 318 * sin(A2);
  return wrap360(f.Lp + sum / 1e6);
}

function moonDistance(f) {
  let sum = 0;
  for (const [d, m, mp, ff, c] of DIST_TERMS) {
    sum += c * eFactor(m, f.E) * cos(d * f.D + m * f.M + mp * f.Mp + ff * f.F);
  }
  return 385000.56 + sum / 1000;
}

function sunLongitude(jd) {
  const T = (jd - 2451545.0) / 36525;
  const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
  const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * sin(M)
          + (0.019993 - 0.000101 * T) * sin(2 * M) + 0.000289 * sin(3 * M);
  return wrap360(L0 + C - 0.00569);
}

// Angle from the sun to the moon along the ecliptic: 0 = new, 90 = first quarter, 180 = full, 270 = last quarter.
export function moonElongation(date) {
  const jd = julianDay(date);
  return wrap360(moonLongitude(fundamentals(jd)) - sunLongitude(jd));
}

export function phaseName(elong) {
  if (elong < 22.5 || elong >= 337.5) return "New moon";
  if (elong < 67.5) return "Waxing crescent";
  if (elong < 112.5) return "Waxing half moon";
  if (elong < 157.5) return "Waxing gibbous";
  if (elong < 202.5) return "Full moon";
  if (elong < 247.5) return "Waning gibbous";
  if (elong < 292.5) return "Waning half moon";
  return "Waning crescent";
}

export function moonState(date) {
  const jd = julianDay(date);
  const f = fundamentals(jd);
  const elong = wrap360(moonLongitude(f) - sunLongitude(jd));
  return {
    elongation: elong,
    distanceKm: moonDistance(f),
    illumination: (1 - cos(elong)) / 2,   // 0..1, fraction of the face that is lit
    waxing: elong < 180,
    name: phaseName(elong),
  };
}

// Next time the moon reaches a given elongation (0 new, 90 first quarter, 180 full, 270 last quarter).
export function nextPhase(date, target) {
  let t = date.getTime();
  const start = moonElongation(new Date(t));
  t += (wrap360(target - start) / 12.19) * 86400000;       // first guess at ~12.19 degrees/day
  for (let i = 0; i < 8; i++) {                             // refine; the speed varies 10-15 deg/day
    const err = wrap180(target - moonElongation(new Date(t)));
    t += (err / 12.19) * 86400000;
  }
  return new Date(t);
}

// Closest approach (minimum distance) within +/- hours of a time. Used for testing.
export function minDistanceNear(date, hours = 6) {
  let best = { distanceKm: Infinity, time: date };
  const step = 60000 * 5;
  for (let t = date.getTime() - hours * 3600000; t <= date.getTime() + hours * 3600000; t += step) {
    const d = moonDistance(fundamentals(julianDay(new Date(t))));
    if (d < best.distanceKm) best = { distanceKm: d, time: new Date(t) };
  }
  return best;
}

// ---------- the sun and the earth ----------
// The point on Earth where the sun is straight overhead right now.
export function subsolarPoint(date) {
  const n = julianDay(date) - 2451545.0;
  const L = wrap360(280.46 + 0.9856474 * n);
  const g = wrap360(357.528 + 0.9856003 * n);
  const lam = L + 1.915 * sin(g) + 0.02 * sin(2 * g);
  const eps = 23.439 - 0.0000004 * n;
  const dec = Math.asin(sin(eps) * sin(lam)) / RAD;
  const ra = Math.atan2(cos(eps) * sin(lam), cos(lam)) / RAD;
  const gmst = wrap360(280.46061837 + 360.98564736629 * n);
  let lon = wrap360(ra - gmst);
  if (lon > 180) lon -= 360;
  return { lat: dec, lon };
}

function distKm(lat1, lon1, lat2, lon2) {
  const p1 = lat1 * RAD, p2 = lat2 * RAD, dl = (lon2 - lon1) * RAD;
  const a = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(a));
}

function oceanName(lat, lon) {
  if (lat < -55) return "Southern Ocean";
  if (lat > 66) return "Arctic Ocean";
  if (lat >= 10 && lat <= 22 && lon >= -82 && lon <= -60) return "Caribbean Sea";
  if (lat >= 18 && lat <= 30 && lon >= -97 && lon <= -82) return "Gulf of Mexico";
  if (lat >= 5 && lat <= 25 && lon >= 52 && lon <= 75) return "Arabian Sea";
  if (lat >= 5 && lat <= 22 && lon >= 80 && lon <= 95) return "Bay of Bengal";
  if (lat >= 0 && lat <= 22 && lon >= 105 && lon <= 121) return "South China Sea";
  if (lon >= 20 && lon < 125) return "Indian Ocean";
  if (lon >= -70 && lon < 20) return "Atlantic Ocean";
  return "Pacific Ocean";
}

export const EXACT_KM = 150;
export const NEAR_KM = 500;

// Describes a point on Earth using the nearest place in the built-in list.
//   under 150 km: "Singapore, Singapore"      under 500 km: "Near Nairobi, Kenya"
//   farther (open ocean): "Pacific Ocean, 1700 km from Easter Island, Chile"
export function describePoint(lat, lon) {
  let best = 0, bd = Infinity;
  for (let i = 0; i < PLACES.length; i++) {
    const d = distKm(lat, lon, PLACES[i][1], PLACES[i][2]);
    if (d < bd) { bd = d; best = i; }
  }
  const name = PLACES[best][0];
  let kind, text;
  if (bd < EXACT_KM) { kind = "exact"; text = name; }
  else if (bd <= NEAR_KM) { kind = "near"; text = `Near ${name}`; }
  else {
    kind = "ocean";
    const far = Math.floor(bd / 50 + 0.5) * 50;
    text = `${oceanName(lat, lon)}, ${far.toLocaleString("en-CA")} km from ${name}`;
  }
  return { text, kind, nearestIndex: best, nearestKm: bd };
}

export function formatLatLon(lat, lon) {
  return `${Math.abs(lat).toFixed(1)}°${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(1)}°${lon >= 0 ? "E" : "W"}`;
}

// Where the "home" dot sits on the polar Earth: hour angle from solar time at the home longitude.
export function solarHourAt(date, lonDeg) {
  const utcHour = date.getUTCHours() + date.getUTCMinutes() / 60 + date.getUTCSeconds() / 3600
                + date.getUTCMilliseconds() / 3600000;
  return (utcHour + lonDeg / 15 + 24) % 24;
}

// ---------- where they are in the sky ----------
const LAT_TERMS = [
  [0, 0, 0, 1, 5128122], [0, 0, 1, 1, 280602], [0, 0, 1, -1, 277693], [2, 0, 0, -1, 173237],
  [2, 0, -1, 1, 55413], [2, 0, -1, -1, 46271], [2, 0, 0, 1, 32573], [0, 0, 2, 1, 17198],
  [2, 0, 1, -1, 9266], [0, 0, 2, -1, 8822], [2, -1, 0, -1, 8216], [2, 0, -2, -1, 4324],
  [2, 0, 1, 1, 4200], [2, 1, 0, -1, -3359],
];

function moonLatitude(f) {
  let sum = 0;
  for (const [d, m, mp, ff, c] of LAT_TERMS) {
    sum += c * eFactor(m, f.E) * sin(d * f.D + m * f.M + mp * f.Mp + ff * f.F);
  }
  const A1 = 119.75 + 131.849 * f.T, A3 = 313.45 + 481266.484 * f.T;
  sum += -2235 * sin(f.Lp) + 382 * sin(A3) + 175 * sin(A1 - f.F) + 175 * sin(A1 + f.F)
       + 127 * sin(f.Lp - f.Mp) - 115 * sin(f.Lp + f.Mp);
  return sum / 1e6;
}

function eclipticToEquatorial(lonDeg, latDeg, T) {
  const eps = 23.4392911 - 0.0130042 * T;
  const ra = Math.atan2(sin(lonDeg) * cos(eps) - Math.tan(latDeg * RAD) * sin(eps), cos(lonDeg)) / RAD;
  const dec = Math.asin(sin(latDeg) * cos(eps) + cos(latDeg) * sin(eps) * sin(lonDeg)) / RAD;
  return { ra: wrap360(ra), dec };
}

export function sunEquatorial(date) {
  const jd = julianDay(date);
  const T = (jd - 2451545.0) / 36525;
  return eclipticToEquatorial(sunLongitude(jd), 0, T);
}

export function moonEquatorial(date) {
  const jd = julianDay(date);
  const f = fundamentals(jd);
  return { ...eclipticToEquatorial(moonLongitude(f), moonLatitude(f), f.T), distanceKm: moonDistance(f) };
}

// Altitude (degrees above the horizon) and azimuth (degrees clockwise from north) for an observer.
export function altAz(date, ra, dec, latDeg, lonDeg) {
  const n = julianDay(date) - 2451545.0;
  const lst = wrap360(280.46061837 + 360.98564736629 * n + lonDeg);
  const H = lst - ra;
  const alt = Math.asin(sin(latDeg) * sin(dec) + cos(latDeg) * cos(dec) * cos(H)) / RAD;
  const A = Math.atan2(sin(H), cos(H) * sin(latDeg) - Math.tan(dec * RAD) * cos(latDeg)) / RAD;
  return { alt, az: wrap360(A + 180) };
}

export function sunAltAz(date, lat, lon) {
  const { ra, dec } = sunEquatorial(date);
  return altAz(date, ra, dec, lat, lon);
}

// The moon is close enough that where you stand shifts it by up to a degree; this is included.
export function moonAltAz(date, lat, lon) {
  const { ra, dec, distanceKm } = moonEquatorial(date);
  const g = altAz(date, ra, dec, lat, lon);
  const parallax = Math.asin(6378.14 / distanceKm) / RAD;
  return { alt: g.alt - parallax * cos(g.alt), az: g.az };
}

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
export const compassName = (az) => COMPASS[Math.round(az / 22.5) % 16];

// Rise and set times (Date or null) within [start, start + 24 h), using the usual -0.83 degree horizon.
export function riseSet(altFn, start) {
  const step = 5 * 60000, limit = -0.833;
  let rise = null, set = null;
  let prev = altFn(new Date(start)).alt;
  for (let t = start + step; t <= start + 86400000; t += step) {
    const cur = altFn(new Date(t)).alt;
    if (prev < limit && cur >= limit && !rise) rise = new Date(t - step + ((limit - prev) / (cur - prev)) * step);
    if (prev >= limit && cur < limit && !set) set = new Date(t - step + ((prev - limit) / (prev - cur)) * step);
    prev = cur;
  }
  return { rise, set };
}

// ---------- planets ----------
// Orbital elements and their rates per century (JPL "Approximate Positions of the Planets", 1800-2050).
// [a, a', e, e', I, I', L, L', longPeri, longPeri', longNode, longNode']
const ELEMENTS = {
  Mercury: [0.38709927, 0.00000037, 0.20563593, 0.00001906, 7.00497902, -0.00594749, 252.2503235, 149472.67411175, 77.45779628, 0.16047689, 48.33076593, -0.12534081],
  Venus: [0.72333566, 0.0000039, 0.00677672, -0.00004107, 3.39467605, -0.0007889, 181.9790995, 58517.81538729, 131.60246718, 0.00268329, 76.67984255, -0.27769418],
  Earth: [1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0, 0],
  Mars: [1.52371034, 0.00001847, 0.0933941, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
  Jupiter: [5.202887, -0.00011607, 0.04838624, -0.00013253, 1.30439695, -0.00183714, 34.39644051, 3034.74612775, 14.72847983, 0.21252668, 100.47390909, 0.20469106],
  Saturn: [9.53667594, -0.0012506, 0.05386179, -0.00050991, 2.48599187, 0.00193609, 49.95424423, 1222.49362201, 92.59887831, -0.41897216, 113.66242448, -0.28867794],
  Uranus: [19.18916464, -0.00196176, 0.04725744, -0.00004397, 0.77263783, -0.00242939, 313.23810451, 428.48202785, 170.9542763, 0.40805281, 74.01692503, 0.04240589],
  Neptune: [30.06992276, 0.00026291, 0.00859048, 0.00005105, 1.77004347, 0.00035372, -55.12002969, 218.45945325, 44.96476227, -0.32241464, 131.78422574, -0.00508664],
};
export const PLANET_NAMES = ["Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune"];

function helio(name, T) {
  const el = ELEMENTS[name];
  const a = el[0] + el[1] * T, e = el[2] + el[3] * T, I = el[4] + el[5] * T;
  const L = el[6] + el[7] * T, peri = el[8] + el[9] * T, node = el[10] + el[11] * T;
  const w = peri - node;
  const M = wrap180(L - peri);
  let E = M * RAD + e * Math.sin(M * RAD);
  for (let i = 0; i < 12; i++) E -= (E - e * Math.sin(E) - M * RAD) / (1 - e * Math.cos(E));
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = cos(w), sw = sin(w), cn = cos(node), sn = sin(node), ci = cos(I), si = sin(I);
  return [
    (cw * cn - sw * sn * ci) * xp + (-sw * cn - cw * sn * ci) * yp,
    (cw * sn + sw * cn * ci) * xp + (-sw * sn + cw * cn * ci) * yp,
    sw * si * xp + cw * si * yp,
  ];
}

// Geocentric position of a planet as right ascension / declination of date.
export function planetEquatorial(date, name) {
  const T = (julianDay(date) - 2451545.0) / 36525;
  const p = helio(name, T), e = helio("Earth", T);
  const x = p[0] - e[0], y = p[1] - e[1], z = p[2] - e[2];
  // ecliptic J2000 -> ecliptic of date (precession in longitude), then to equatorial
  const lon = wrap360(Math.atan2(y, x) / RAD + 1.396971 * T);
  const lat = Math.atan2(z, Math.hypot(x, y)) / RAD;
  return { ...eclipticToEquatorial(lon, lat, T), lon, distAU: Math.hypot(x, y, z) };
}

export function planetAltAz(date, name, lat, lonDeg) {
  const { ra, dec } = planetEquatorial(date, name);
  return altAz(date, ra, dec, lat, lonDeg);
}

// Angle between two points in the sky (degrees).
export function separation(a, b) {
  const d1 = a.dec * RAD, d2 = b.dec * RAD, dr = (a.ra - b.ra) * RAD;
  return Math.acos(Math.min(1, Math.sin(d1) * Math.sin(d2) + Math.cos(d1) * Math.cos(d2) * Math.cos(dr))) / RAD;
}

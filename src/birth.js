// Birth details: stored on this device only (localStorage), and turned into an exact UTC moment.
const KEY = "birthProfile";

export function loadProfile() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY));
    if (p && Number.isFinite(p.utcMs)) return p;
  } catch {}
  return null;
}
export function saveProfile(p) { try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {} }

// --- time zones: the browser knows each zone's rules, including daylight saving in past years ---
const FALLBACK_ZONES = ["America/Vancouver", "America/Toronto", "America/New_York", "Europe/London", "Europe/Lisbon", "Europe/Paris", "Asia/Tokyo", "Australia/Sydney", "UTC"];
export function allZones() {
  try { return Intl.supportedValuesOf("timeZone"); } catch { return FALLBACK_ZONES; }
}
export const cityOf = (z) => z.split("/").pop().replace(/_/g, " ");
export const regionOf = (z) => (z.includes("/") ? z.split("/")[0].replace(/_/g, " ") : "");
export const zoneLabel = (z) => (regionOf(z) ? `${cityOf(z)} (${regionOf(z)})` : cityOf(z));

export function searchZones(query, limit = 8) {
  const q = query.toLowerCase().replace(/[^a-z]/g, "");
  if (q.length < 2) return [];
  const starts = [], inside = [];
  for (const z of allZones()) {
    const c = cityOf(z).toLowerCase().replace(/[^a-z]/g, "");
    if (c.startsWith(q)) starts.push(z); else if (c.includes(q)) inside.push(z);
  }
  return [...starts, ...inside].slice(0, limit);
}

function offsetMinutes(zone, ms) {
  const f = new Intl.DateTimeFormat("en-US", {
    timeZone: zone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric",
    hour: "numeric", minute: "numeric", second: "numeric",
  });
  const o = {};
  for (const p of f.formatToParts(new Date(ms))) o[p.type] = p.value;
  const asUtc = Date.UTC(+o.year, +o.month - 1, +o.day, +o.hour, +o.minute, +o.second);
  return Math.round((asUtc - Math.floor(ms / 1000) * 1000) / 60000);
}

// "25 Nov 1970, 22:00 in Europe/Lisbon" -> the exact UTC moment (and the offset that applied then).
export function localToUtc(dateStr, timeStr, zone) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const [hh, mm] = timeStr.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  let off = offsetMinutes(zone, guess);
  let t = guess - off * 60000;
  const off2 = offsetMinutes(zone, t);     // near a clock change the first guess can be an hour out
  if (off2 !== off) { off = off2; t = guess - off * 60000; }
  return { utcMs: t, offsetMin: off };
}

export function formatOffset(min) {
  const sign = min < 0 ? "−" : "+", a = Math.abs(min), h = Math.floor(a / 60), m = a % 60;
  return `UTC${sign}${h}${m ? ":" + String(m).padStart(2, "0") : ""}`;
}
export const formatUtc = (ms) => new Date(ms).toISOString().slice(0, 16).replace("T", " ") + " UTC";

// --- real place search (needs internet, only used while entering birth details) ---
// Open-Meteo's free geocoding service returns each town with its time zone, so Vernon -> America/Vancouver.
export async function searchPlaces(query, signal) {
  const url = "https://geocoding-api.open-meteo.com/v1/search?count=8&language=en&format=json&name=" + encodeURIComponent(query.trim());
  const res = await fetch(url, { signal });
  if (!res.ok) throw new Error("search failed");
  const data = await res.json();
  return (data.results || []).filter((r) => r.timezone).map((r) => ({
    place: [r.name, r.admin1, r.country].filter((x, i, a) => x && a.indexOf(x) === i).join(", "),
    zone: r.timezone,
  }));
}

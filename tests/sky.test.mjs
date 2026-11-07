import { sunAltAz, moonAltAz, riseSet } from "../src/astro.js";
// Total eclipse of 2024-04-08, near Dallas at about 18:42 UTC: sun and moon should be in nearly the same spot.
const t = new Date("2024-04-08T18:42:00Z");
const s = sunAltAz(t, 32.78, -96.8), m = moonAltAz(t, 32.78, -96.8);
console.log("eclipse Dallas sun", s, "moon", m);
// Vernon solar noon, 7 Nov 2026 (sun should peak near 23 degrees)
let best = { alt: -99 };
for (let h = 19; h < 22; h += 1 / 60) { const x = sunAltAz(new Date(Date.UTC(2026, 10, 7) + h * 3600000), 50.27, -119.27); if (x.alt > best.alt) best = { ...x, h }; }
console.log("Vernon noon", best);
const start = Date.UTC(2026, 10, 7, 7);   // local midnight at UTC-7
const f = (d) => sunAltAz(d, 50.27, -119.27), r = riseSet(f, start);
console.log("sun rise/set local", r.rise && new Date(r.rise - 7 * 3600000).toISOString(), r.set && new Date(r.set - 7 * 3600000).toISOString());
const mr = riseSet((d) => moonAltAz(d, 50.27, -119.27), start);
console.log("moon rise/set local", mr.rise && new Date(mr.rise - 7 * 3600000).toISOString(), mr.set && new Date(mr.set - 7 * 3600000).toISOString());

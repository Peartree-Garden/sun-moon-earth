import { readFileSync } from "node:fs";
import { subsolarPoint, describePoint, moonState, nextPhase, moonElongation, minDistanceNear } from "../src/astro.js";
const ref = JSON.parse(readFileSync(new URL("./subsolar-reference.json", import.meta.url)));
let worst = 0, mism = 0;
for (const r of ref) {
  const s = subsolarPoint(new Date(r.ts * 1000));
  worst = Math.max(worst, Math.abs(s.lat - r.lat), Math.abs(s.lon - r.lon));
  const d = describePoint(s.lat, s.lon);
  if (d.nearestIndex !== r.nearestIndex || d.kind !== r.kind) { mism++; console.log("mismatch", r.ts, d, r); }
}
console.log("subsolar max diff deg:", worst.toExponential(2), " place mismatches:", mism);
const show = (l, d) => console.log(l.padEnd(28), d.toISOString());
const events = [
  ["new 2017-08-21 18:30", 0, "2017-08-21T17:00:00Z"],
  ["new 2024-04-08 18:21", 0, "2024-04-07T00:00:00Z"],
  ["full 2022-11-08 11:02", 180, "2022-11-07T00:00:00Z"],
  ["full 2025-03-14 06:55", 180, "2025-03-13T00:00:00Z"],
  ["full 2025-09-07 18:09", 180, "2025-09-06T00:00:00Z"],
];
for (const [l, tgt, from] of events) show(l, nextPhase(new Date(from), tgt));
const p = minDistanceNear(new Date("2016-11-14T11:22:00Z"), 12);
console.log("perigee 2016-11-14 ~11:22Z / 356509 km ->", p.time.toISOString(), p.distanceKm.toFixed(0));
console.log("now", moonState(new Date()));

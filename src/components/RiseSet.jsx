import { useMemo } from "react";
import { sunAltAz, moonAltAz, riseSet } from "../astro.js";
import { HOME_LAT, HOME_LON, UTC_OFFSET_HOURS } from "../config.js";

// Start of today (midnight on the app's fixed clock), as a timestamp.
function localDayStart(now) {
  const off = UTC_OFFSET_HOURS * 3600000;
  return Math.floor((now.getTime() + off) / 86400000) * 86400000 - off;
}
const pad = (n) => String(n).padStart(2, "0");
function hhmm(d) {
  if (!d) return "none today";
  const t = new Date(d.getTime() + UTC_OFFSET_HOURS * 3600000);
  return `${pad(t.getUTCHours())}:${pad(t.getUTCMinutes())}`;
}

export default function RiseSet({ now }) {
  const start = localDayStart(now);
  // Worked out once per day, not every second.
  const { sunTimes, moonTimes } = useMemo(() => ({
    sunTimes: riseSet((d) => sunAltAz(d, HOME_LAT, HOME_LON), start),
    moonTimes: riseSet((d) => moonAltAz(d, HOME_LAT, HOME_LON), start),
  }), [start]);

  return (
    <div className="next">
      <div><span>Sunrise / Sunset</span><b>{hhmm(sunTimes.rise)} / {hhmm(sunTimes.set)}</b></div>
      <div><span>Moonrise / Moonset</span><b>{hhmm(moonTimes.rise)} / {hhmm(moonTimes.set)}</b></div>
    </div>
  );
}

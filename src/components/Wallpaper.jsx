import { useEffect, useState } from "react";
import { subsolarPoint, describePoint, formatLatLon } from "../astro.js";
import { SUN_LABEL, UTC_OFFSET_HOURS } from "../config.js";
import EarthView from "./EarthView.jsx";
import RiseSet from "./RiseSet.jsx";

// A quiet, non-interactive version of the Earth tab for use as a live wallpaper.
// Open it with  /?wallpaper  (add &12 for a 12-hour clock, &top=130 for more space at the top). It redraws once a minute to save battery.
const pad = (n) => String(n).padStart(2, "0");
const params = new URLSearchParams(window.location.search);
const twelve = params.has("12");

// Optional per-phone spacing: /?wallpaper&top=130 moves everything down (pixels). Same for &bottom=.
const px = (name) => {
  const v = params.get(name);
  return v !== null && v !== "" && Number.isFinite(Number(v)) ? Math.min(400, Math.max(0, Number(v))) : undefined;
};
const spacing = { paddingTop: px("top"), paddingBottom: px("bottom") };

function clock(now) {
  const t = new Date(now.getTime() + UTC_OFFSET_HOURS * 3600000);
  const h = t.getUTCHours(), mm = pad(t.getUTCMinutes());
  if (!twelve) return { hh: pad(h), mm, ampm: "" };
  return { hh: String(h % 12 || 12), mm, ampm: h < 12 ? "AM" : "PM" };
}

export default function Wallpaper() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timer;
    const tick = () => {
      setNow(new Date());
      // wait until the start of the next minute, so the clock changes on time
      timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    };
    timer = setTimeout(tick, 60000 - (Date.now() % 60000) + 50);
    const wake = () => { if (document.visibilityState === "visible") { clearTimeout(timer); tick(); } };
    document.addEventListener("visibilitychange", wake);
    return () => { clearTimeout(timer); document.removeEventListener("visibilitychange", wake); };
  }, []);

  const { hh, mm, ampm } = clock(now);
  const sun = subsolarPoint(now);
  const place = describePoint(sun.lat, sun.lon);

  return (
    <main className="wp" style={spacing}>
      <div className="time" aria-label="Time">{hh}<span className="colon">:</span>{mm}{ampm && <span className="ampm">{ampm}</span>}</div>
      <section>
        <EarthView now={now} interactive={false} />
        <p className="label sunlabel">{SUN_LABEL}</p>
        <p className="big place">{place.text}</p>
        <p className="small">{formatLatLon(sun.lat, sun.lon)}</p>
        <RiseSet now={now} />
      </section>
    </main>
  );
}

import { useEffect, useRef, useState } from "react";
import { moonState, subsolarPoint, describePoint, formatLatLon, nextPhase } from "./astro.js";
import { SUN_LABEL, UTC_OFFSET_HOURS, HOME_NAME } from "./config.js";
import { moonColor } from "./color.js";
import EarthView from "./components/EarthView.jsx";
import MoonView from "./components/MoonView.jsx";
import Travel from "./components/Travel.jsx";
import Links from "./components/Links.jsx";
import Sky from "./components/Sky.jsx";
import RiseSet from "./components/RiseSet.jsx";

// Left to right, as in the tab bar. Swiping moves one step along this list.
const TABS = ["earth", "sky", "moon", "travel", "links"];

const pad = (n) => String(n).padStart(2, "0");

function clock(now, hour12) {
  const t = new Date(now.getTime() + UTC_OFFSET_HOURS * 3600000);
  const h = t.getUTCHours();
  if (!hour12) return { hh: pad(h), mm: pad(t.getUTCMinutes()), ampm: "" };
  return { hh: String(h % 12 || 12), mm: pad(t.getUTCMinutes()), ampm: h < 12 ? "AM" : "PM" };
}

const fmtDay = (d) =>
  new Date(d.getTime() + UTC_OFFSET_HOURS * 3600000).toLocaleString("en-CA", {
    timeZone: "UTC", weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });

export default function App() {
  const [now, setNow] = useState(() => new Date());
  const [tab, setTab] = useState(() => {
    try { return localStorage.getItem("tab") || "earth"; } catch { return "earth"; }
  });
  // "Sun over" text is refreshed once a minute; the picture itself moves every second.
  const [placeStamp, setPlaceStamp] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => {
      const t = new Date();
      setNow(t);
      setPlaceStamp((p) => (t - p >= 60000 ? t : p));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const [hour12, setHour12] = useState(() => {
  try { return localStorage.getItem("hour12") === "1"; } catch { return false; }
});
const toggleHours = () => {
  setHour12((v) => {
    try { localStorage.setItem("hour12", v ? "0" : "1"); } catch {}
    return !v;
  });
};

  const [slide, setSlide] = useState("");
  const pick = (t) => {
    const from = TABS.indexOf(tab), to = TABS.indexOf(t);
    if (from === to) return;
    setSlide(to > from ? "from-right" : "from-left");
    setTab(t);
    try { localStorage.setItem("tab", t); } catch {}
  };

  // Swipe left or right anywhere on the screen to change tab (not past the first or last one).
  const touch = useRef(null);
  const onTouchStart = (e) => { const t = e.touches[0]; touch.current = { x: t.clientX, y: t.clientY }; };
  const onTouchEnd = (e) => {
    const s = touch.current; touch.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x, dy = t.clientY - s.y;
    if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;   // too short, or mostly vertical
    const i = TABS.indexOf(tab) + (dx < 0 ? 1 : -1);
    if (i >= 0 && i < TABS.length) pick(TABS[i]);
  };

  const { hh, mm, ampm } = clock(now, hour12);
  const moon = moonState(now);
  const sun = subsolarPoint(placeStamp);
  const place = describePoint(sun.lat, sun.lon);
  const lit = moonColor(moon.illumination);

  return (
    <main onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      <div className="time" aria-label="Time">{hh}<span className="colon">:</span>{mm}{ampm && <span className="ampm">{ampm}</span>}</div>
<button className="hourtoggle" onClick={toggleHours}>{hour12 ? "Switch to 24-hour" : "Switch to 12-hour"}</button>

      <nav>
        <button className={tab === "earth" ? "on" : ""} onClick={() => pick("earth")}>Earth</button>
        <button className={tab === "sky" ? "on" : ""} onClick={() => pick("sky")}>Sky</button>
        <button className={tab === "moon" ? "on" : ""} onClick={() => pick("moon")}>Moon</button>
        <button className={tab === "travel" ? "on" : ""} onClick={() => pick("travel")}>Travel</button>
        <button className={tab === "links" ? "on" : ""} onClick={() => pick("links")}>Links</button>
      </nav>

       <div key={tab} className={`pane ${slide}`}>
      {tab === "earth" ? (
        <section>
          <EarthView now={now} />
          <p className="label sunlabel">{SUN_LABEL}</p>
          <p className="big place">{place.text}</p>
          <p className="small">{formatLatLon(sun.lat, sun.lon)}</p>
          <RiseSet now={now} />
          <p className="small how">Seen from space, above the North Pole. The sun is always at the top, so the whole Earth turns underneath it, counter-clockwise, once a day. The red dot is {HOME_NAME}. Places on the right are having sunrise and on the left sunset. The dark side is night.</p>
        </section>
      ) : tab === "sky" ? (
        <Sky now={now} />
      ) : tab === "travel" ? (
        <Travel />
      ) : tab === "links" ? (
        <Links />
      ) : (
        <section>
          <MoonView moon={moon} />
          <p className="big" style={{ color: lit }}>{moon.name}</p>
          <p className="small">{Math.round(moon.illumination * 100)}% lit</p>
          <p className="label">Distance from Earth</p>
          <p className="big dist">{Math.round(moon.distanceKm).toLocaleString("en-CA")} km</p>
          <div className="next">
            <div><span>Next full moon</span><b>{fmtDay(nextPhase(now, 180))}</b></div>
            <div><span>Next new moon</span><b>{fmtDay(nextPhase(now, 0))}</b></div>
          </div>
        </section>
      )}
      </div>
    </main>
  );
}

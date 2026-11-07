import { sunAltAz, moonAltAz, riseSet, compassName, moonState, planetAltAz, PLANET_NAMES } from "../astro.js";
import { HOME_LAT, HOME_LON, HOME_NAME, UTC_OFFSET_HOURS } from "../config.js";
import { useState } from "react";
import useCompass from "../useCompass.js";

const CX = 180, CY = 180, R = 120;
const PLANET_STYLE = {
  Mercury: { color: "#c8c8c8", r: 3.5 }, Venus: { color: "#fff3c0", r: 5 }, Mars: { color: "#ff6a4d", r: 4 },
  Jupiter: { color: "#f0c890", r: 5 }, Saturn: { color: "#e8d59a", r: 4.5 },
  Uranus: { color: "#8fe3e8", r: 3.5 }, Neptune: { color: "#7aa0ff", r: 3.5 },
};
const TELESCOPE = new Set(["Uranus", "Neptune"]);
const SKY_MOON_COLOR = "#5aa0ff";   // the moon on the Sky chart is always this blue

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

// A map of the sky around you: the middle is straight overhead, the edge is the horizon.
// The direction you face (the compass heading, north when the compass is off) is at the top, east is to the right.
function place(alt, az, heading) {
  const up = alt >= 0;
  const r = up ? ((90 - alt) / 90) * R : R + 36;
  const a = ((az - heading) * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a), up };
}

const WORDS = { N: "north", S: "south", E: "east", W: "west" };
const longName = (c) => c.split("").map((ch) => WORDS[ch]).join("-");

function describe(name, p) {
  if (p.alt < 0) return `${name} is below the horizon`;
  return `${name} is ${Math.round(p.alt)}° up in the ${longName(compassName(p.az))}`;
}

export default function Sky({ now }) {
  const [useCompassOn, setUseCompassOn] = useState(() => {
    try { return localStorage.getItem("compass") === "1"; } catch { return false; }
  });
  const toggleCompass = () => {
    const v = !useCompassOn; setUseCompassOn(v);
    try { localStorage.setItem("compass", v ? "1" : "0"); } catch {}
  };
  const compass = useCompass(useCompassOn);
  const heading = compass.heading ?? 0;
  const sun = sunAltAz(now, HOME_LAT, HOME_LON);
  const moon = moonAltAz(now, HOME_LAT, HOME_LON);
  const ms = moonState(now);
  const start = localDayStart(now);
  const sunTimes = riseSet((d) => sunAltAz(d, HOME_LAT, HOME_LON), start);
  const moonTimes = riseSet((d) => moonAltAz(d, HOME_LAT, HOME_LON), start);
  const sp = place(sun.alt, sun.az, heading), mp = place(moon.alt, moon.az, heading);
  const moonCol = SKY_MOON_COLOR;
  const daylight = sun.alt > -6;   // too bright a sky to see planets
  const planets = PLANET_NAMES
    .map((name) => ({ name, ...planetAltAz(now, name, HOME_LAT, HOME_LON) }))
    .filter((p) => p.alt > 0)
    .sort((a, b) => b.alt - a.alt);

  return (
    <section className="sky">
      <svg viewBox="0 0 360 360" className="view" role="img" aria-label={`Sky over ${HOME_NAME}`}>
        <circle cx={CX} cy={CY} r={R} fill="#0b0d1c" stroke="#3a3a52" strokeWidth="2" />
        <circle cx={CX} cy={CY} r={R * 2 / 3} fill="none" stroke="#23233a" />
        <circle cx={CX} cy={CY} r={R / 3} fill="none" stroke="#23233a" />
        <line x1={CX} y1={CY - R} x2={CX} y2={CY + R} stroke="#23233a" />
        <line x1={CX - R} y1={CY} x2={CX + R} y2={CY} stroke="#23233a" />
        <g textAnchor="middle" fontSize="22" fontWeight="700" fill="#e8e8f0">
          {[["N", 0], ["E", 90], ["S", 180], ["W", 270]].map(([ch, az]) => {
            const a = ((az - heading) * Math.PI) / 180;
            return <text key={ch} x={CX + 140 * Math.sin(a)} y={CY - 140 * Math.cos(a) + 8}>{ch}</text>;
          })}
        </g>
        <path d={`M ${CX - 7} 14 L ${CX + 7} 14 L ${CX} 2 Z`} fill="#ffd75a" />
        <text x={CX} y={CY + 6} textAnchor="middle" fontSize="12" fill="#6a6a80">overhead</text>
        <g opacity={sp.up ? 1 : 0.45}>
          <circle cx={sp.x} cy={sp.y} r="14" fill="#fff6b0" opacity="0.25" />
          <circle cx={sp.x} cy={sp.y} r="8" fill="#fff6aa" />
        </g>
        <g opacity={mp.up ? 1 : 0.45}>
          <circle cx={mp.x} cy={mp.y} r="7" fill={moonCol} stroke="#fff" strokeWidth="1.2" />
        </g>
        {(() => {
          // Place each name beside its dot, nudging it down when it would sit on another name.
          const taken = [];
          return planets.map((pl) => {
            const q = place(pl.alt, pl.az, heading), st = PLANET_STYLE[pl.name];
            const w = pl.name.length * 7.5;
            const box = (isLeft, y) => {
              const x0 = isLeft ? q.x - st.r - 4 - w : q.x + st.r + 4;
              return { x0, x1: x0 + w, y };
            };
            const clash = (b) => taken.some((t) => Math.abs(t.y - b.y) < 14 && b.x0 < t.x1 && b.x1 > t.x0);
            // prefer the right of the dot (left near the right edge), then the other side, then nudge down
            const first = q.x > CX + 60;
            let left = first, ty = q.y + 4;
            if (clash(box(left, ty))) left = !first;
            for (let k = 0; k < 8 && clash(box(left, ty)); k++) ty += 14;
            taken.push(box(left, ty));
            return (
              <g key={pl.name} opacity={daylight ? 0.4 : 1}>
                <circle cx={q.x} cy={q.y} r={st.r} fill={st.color} />
                <text x={left ? q.x - st.r - 4 : q.x + st.r + 4} y={ty} textAnchor={left ? "end" : "start"}
                  fontSize="13" fill="#e8e8f0" stroke="#0b0d1c" strokeWidth="3" paintOrder="stroke">{pl.name}</text>
              </g>
            );
          });
        })()}
      </svg>

      <div className="compassbar">
        <button className={useCompassOn ? "on" : ""} onClick={toggleCompass}>{useCompassOn ? "Compass on" : "Use compass"}</button>
        <span>
          {compass.status === "on" && `Facing ${longName(compassName(heading))} (${Math.round(heading)}°)`}
          {compass.status === "waiting" && "Looking for the compass…"}
          {compass.status === "unavailable" && "No compass found on this device"}
          {compass.status === "off" && "Hold the phone flat to turn the map"}
        </span>
      </div>
      <p className="big">{describe("The sun", sun)}</p>
      <p className="big" style={{ color: moonCol }}>{describe("The moon", moon)}</p>
      <p className="label">Planets in the sky now</p>
      {planets.length === 0 ? (
        <p className="small">None above the horizon.</p>
      ) : (
        planets.map((pl) => (
          <p className="plist" key={pl.name}>
            <b style={{ color: PLANET_STYLE[pl.name].color }}>{pl.name}</b>
            {` ${Math.round(pl.alt)}° up, ${longName(compassName(pl.az))}`}
            {TELESCOPE.has(pl.name) ? " (needs a telescope)" : daylight ? " (daylight, not visible)" : ""}
          </p>
        ))
      )}
      <p className="small">Looking up at the sky from {HOME_NAME}: straight overhead is in the middle and the edge is the horizon. With the compass on, hold the phone flat and the direction you are facing is at the top. Faded markers outside the circle are below the horizon. In daylight the planets are shown faintly because they can't be seen.</p>

      <div className="next">
        <div><span>Sunrise / sunset</span><b>{hhmm(sunTimes.rise)} / {hhmm(sunTimes.set)}</b></div>
        <div><span>Moonrise / moonset</span><b>{hhmm(moonTimes.rise)} / {hhmm(moonTimes.set)}</b></div>
      </div>
    </section>
  );
}

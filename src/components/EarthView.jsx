import { useEffect, useRef, useState } from "react";
import { moonState, subsolarPoint } from "../astro.js";
import { HOME_LAT, HOME_LON, HOME_NAME, SECOND_NAME, SECOND_LAT, SECOND_LON } from "../config.js";
import { LAND_PATH, GREENLAND_PATH } from "../landPath.js";

const DOT_COLOR = "#ff3b3b";
const OCEAN = "#2f6fd0", LAND = "#5aa86a", GREENLAND = "#f4f8ff";

// These three numbers must match tools/make_land.py, which drew the land outlines.
const SIZE = 320, CX = 160, CY = 170, R = 100, RING = 130;

// The finished picture is the globe drawn above, shrunk a little and moved down to leave room for the Sun.
const SCALE = 0.86, TOP = 228;                       // TOP = where the globe's centre sits in the final picture
const HEIGHT = Math.round(TOP + RING * SCALE + 8);   // picture height

const RAD = Math.PI / 180;
const MAX_ZOOM = 5;
const LINE = "0.4";   // how visible the grid lines are (0 to 1)

export default function EarthView({ now, interactive = true }) {
  // Pinch with two fingers to zoom; drag with one finger to move around once zoomed in.
  const svgRef = useRef(null);
  const [view, setView] = useState({ z: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  viewRef.current = view;

  useEffect(() => {
    const el = svgRef.current;
    if (!el || !interactive) return;
    let g = null;
    const toSvg = (cx, cy) => {
      const r = el.getBoundingClientRect();
      return { x: ((cx - r.left) / r.width) * SIZE, y: ((cy - r.top) / r.height) * HEIGHT };
    };
    const fit = (z, x, y) => {
      if (z < 1.03) return { z: 1, x: 0, y: 0 };
      return { z, x: Math.min(0, Math.max(SIZE * (1 - z), x)), y: Math.min(0, Math.max(HEIGHT * (1 - z), y)) };
    };
    const two = (t) => {
      const a = t[0], b = t[1];
      return { d: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), cx: (a.clientX + b.clientX) / 2, cy: (a.clientY + b.clientY) / 2 };
    };
    const start = (e) => {
      const v = viewRef.current;
      if (e.touches.length === 2) {
        const t = two(e.touches), m = toSvg(t.cx, t.cy);
        g = { mode: "pinch", d0: t.d, z0: v.z, c: { x: (m.x - v.x) / v.z, y: (m.y - v.y) / v.z } };
      } else if (e.touches.length === 1 && v.z > 1) {
        g = { mode: "pan", p: toSvg(e.touches[0].clientX, e.touches[0].clientY), v };
        e.stopPropagation();          // so dragging the picture never switches tab
      } else g = null;
    };
    const move = (e) => {
      if (!g) return;
      e.preventDefault();
      if (g.mode === "pinch" && e.touches.length === 2) {
        const t = two(e.touches), m = toSvg(t.cx, t.cy);
        const z = Math.min(MAX_ZOOM, Math.max(1, (g.z0 * t.d) / g.d0));
        setView(fit(z, m.x - g.c.x * z, m.y - g.c.y * z));
      } else if (g.mode === "pan" && e.touches.length === 1) {
        const p = toSvg(e.touches[0].clientX, e.touches[0].clientY);
        setView(fit(g.v.z, g.v.x + p.x - g.p.x, g.v.y + p.y - g.p.y));
      }
    };
    const end = (e) => {
      if (g && g.mode === "pan") e.stopPropagation();
      if (e.touches.length === 0 || (g && g.mode === "pinch")) g = null;
    };
    el.addEventListener("touchstart", start, { passive: false });
    el.addEventListener("touchmove", move, { passive: false });
    el.addEventListener("touchend", end);
    el.addEventListener("touchcancel", end);
    return () => {
      el.removeEventListener("touchstart", start);
      el.removeEventListener("touchmove", move);
      el.removeEventListener("touchend", end);
      el.removeEventListener("touchcancel", end);
    };
  }, [interactive]);

  const sun = subsolarPoint(now);
  const moon = moonState(now);

  // The whole globe turns so that the longitude under the sun is at the top.
  const turn = sun.lon;

  // Where Vernon is on the globe: distance from the centre shrinks toward the pole.
  const phi = (sun.lon - HOME_LON) * RAD;
  const hr = R * Math.cos(HOME_LAT * RAD);
  const hx = CX + hr * Math.sin(phi), hy = CY - hr * Math.cos(phi);

  // Second marked place (Portugal), placed the same way.
  const phi2 = (sun.lon - SECOND_LON) * RAD;
  const hr2 = R * Math.cos(SECOND_LAT * RAD);
  const h2x = CX + hr2 * Math.sin(phi2), h2y = CY - hr2 * Math.cos(phi2);

  // Night side. Seen from above the pole, the day/night line is half an ellipse
  // whose height depends on how far north or south the sun is (the season).
  const ry = Math.max(0.01, Math.abs(Math.sin(sun.lat * RAD))) * R;
  const night = `M ${CX - R} ${CY} A ${R} ${ry} 0 0 ${sun.lat >= 0 ? 0 : 1} ${CX + R} ${CY} A ${R} ${R} 0 0 1 ${CX - R} ${CY} Z`;

  // Moon on its ring: new moon at the sun (top), full moon opposite.
  const m = ((90 + moon.elongation) * Math.PI) / 180;
  const mx = CX + RING * Math.cos(m), my = CY - RING * Math.sin(m);

  return (
    <svg ref={svgRef} style={{ touchAction: view.z > 1 ? "none" : "pan-y" }} viewBox={`0 0 ${SIZE} ${HEIGHT}`} role="img" aria-label="Earth seen from above the North Pole" className="view">
      <defs>
        <clipPath id="globeClip"><circle cx={CX} cy={CY} r={R} /></clipPath>
        <filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3" /></filter>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor="#fff6b0" />
          <stop offset="1" stopColor="#fff6b0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The Sun is huge and far away: only part of it shows, cut exactly in half by the top edge. */}
      <text x="4" y="14" fontSize="11" style={{ fill: "var(--dim)" }}>not to scale</text>
      <g transform={`translate(${view.x} ${view.y}) scale(${view.z})`}>
      <circle cx={CX} cy="0" r="56" fill="url(#sunGlow)" />
      <circle cx={CX} cy="0" r="22" fill="#fff6aa" />

      <g transform={`translate(${CX * (1 - SCALE)} ${TOP - CY * SCALE}) scale(${SCALE})`}>
      <circle cx={CX} cy={CY} r={RING} fill="none" stroke="#2a2a38" strokeDasharray="2 6" />

      <circle cx={CX} cy={CY} r={R} fill={OCEAN} />
      <g clipPath="url(#globeClip)">
        <g transform={`rotate(${turn.toFixed(2)} ${CX} ${CY})`}>
          {[30, 60].map((lat) => (
            <circle key={lat} cx={CX} cy={CY} r={R * Math.cos(lat * RAD)} fill="none" stroke="#fff" strokeOpacity={LINE} strokeWidth="0.7" />
          ))}
          {Array.from({ length: 12 }, (_, i) => {
            const a = i * 30 * RAD;
            return <line key={i} x1={CX} y1={CY} x2={CX + R * Math.sin(a)} y2={CY - R * Math.cos(a)} stroke="#fff" strokeOpacity={LINE} strokeWidth="0.7" />;
          })}
          <path d={LAND_PATH} fill={LAND} fillRule="evenodd" />
          <path d={GREENLAND_PATH} fill={GREENLAND} fillRule="evenodd" />
        </g>
        <path d={night} fill="#030820" opacity="0.68" filter="url(#soft)" />
      </g>
      <circle cx={CX} cy={CY} r={R} fill="none" stroke="#7fb0ff" strokeOpacity="0.5" />

      <g textAnchor="middle" fontSize="11" fontWeight="700" fill="#fff" stroke="#06060a" strokeWidth="3" paintOrder="stroke">
        <text x={CX + R + 6} y={CY + 4} textAnchor="start">SUNRISE</text>
        <text x={CX - R - 6} y={CY + 4} textAnchor="end">SUNSET</text>
      </g>
            <circle cx={hx} cy={hy} r="3.5" fill={DOT_COLOR} stroke="#06060a" strokeWidth="1" />
      <text x={hx} y={hy - 10} textAnchor="middle" className="svg-label" style={{ fill: "#fff" }}>{HOME_NAME}</text>
      {SECOND_NAME && (
        <>
          <circle cx={h2x} cy={h2y} r="3.5" fill={DOT_COLOR} stroke="#06060a" strokeWidth="1" />
          <text x={h2x} y={h2y - 10} textAnchor="middle" className="svg-label" style={{ fill: "#fff" }}>{SECOND_NAME}</text>
        </>
      )}
      <circle cx={mx} cy={my} r="9" fill="#e1e1f0" />
      </g>
      </g>
      {view.z > 1 && (
        <g style={{ cursor: "pointer" }} onClick={() => setView({ z: 1, x: 0, y: 0 })}>
          <rect x={SIZE - 84} y="0" width="84" height="24" fill="transparent" />
          <text x={SIZE - 4} y="14" fontSize="11" textAnchor="end" style={{ fill: "var(--dim)" }}>reset zoom</text>
        </g>
      )}
    </svg>
  );
}

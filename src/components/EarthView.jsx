import { moonState, subsolarPoint, solarHourAt } from "../astro.js";
import { HOME_LON, HOME_NAME } from "../config.js";

const SIZE = 320, CX = 160, CY = 170, R = 100, RING = 140;

export default function EarthView({ now }) {
  const sun = subsolarPoint(now);
  const moon = moonState(now);
  const offset = (sun.lat / 23.44) * (R * 0.35);   // the summer pole is lit, the winter pole is dark

  // Home dot: counter-clockwise, top = local solar noon.
  const hour = solarHourAt(now, HOME_LON);
  const a = ((hour - 6) / 24) * 2 * Math.PI;
  const hx = CX + R * Math.cos(a), hy = CY - R * Math.sin(a);

  // Moon on its ring: new moon at the sun (top), full moon opposite.
  const m = ((90 + moon.elongation) * Math.PI) / 180;
  const mx = CX + RING * Math.cos(m), my = CY - RING * Math.sin(m);

  return (
    <svg viewBox={`0 0 ${SIZE} ${SIZE}`} role="img" aria-label="Earth seen from above the North Pole" className="view">
      <defs>
        <linearGradient id="earthGrad" gradientUnits="userSpaceOnUse"
          x1="0" y1={CY + offset + R} x2="0" y2={CY + offset - R}>
          <stop offset="0" stopColor="rgb(10,20,70)" />
          <stop offset="0.5" stopColor="rgb(235,150,30)" />
          <stop offset="1" stopColor="rgb(255,240,90)" />
        </linearGradient>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor="#fff6b0" />
          <stop offset="1" stopColor="#fff6b0" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx={CX} cy={CY} r={RING} fill="none" stroke="#2a2a38" strokeDasharray="2 6" />
      <circle cx={CX} cy="22" r="22" fill="url(#sunGlow)" />
      <circle cx={CX} cy="22" r="9" fill="#fff6aa" />
      <circle cx={CX} cy={CY} r={R} fill="url(#earthGrad)" />
      <g className="dir" textAnchor="middle" fontSize="12" fontWeight="700" fill="#fff" stroke="#06060a" strokeWidth="3" paintOrder="stroke">
        <text x={CX} y={CY - R + 22}>NOON</text>
        <text x={CX} y={CY + R - 12}>MIDNIGHT</text>
        <text x={CX + R - 36} y={CY + 4}>SUNRISE</text>
        <text x={CX - R + 34} y={CY + 4}>SUNSET</text>
      </g>
      <circle cx={CX} cy={CY} r="2.5" fill="#fff" />
      <circle cx={hx} cy={hy} r="6" fill="#00ffff" stroke="#06060a" strokeWidth="2" />
      <text x={hx} y={hy + (hy > CY ? 20 : -12)} textAnchor="middle" className="svg-label">{HOME_NAME}</text>
      <circle cx={mx} cy={my} r="8" fill="#e1e1f0" />
    </svg>
  );
}

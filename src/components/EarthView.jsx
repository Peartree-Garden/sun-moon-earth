import { moonState, subsolarPoint } from "../astro.js";
import { HOME_LAT, HOME_LON, HOME_NAME } from "../config.js";
import { LAND_PATH, GREENLAND_PATH } from "../landPath.js";

const DOT_COLOR = "#ff3b3b";
const OCEAN = "#2f6fd0", LAND = "#5aa86a", GREENLAND = "#f4f8ff";

// These three numbers must match tools/make_land.py, which drew the land outlines.
const SIZE = 320, CX = 160, CY = 170, R = 100, RING = 130;

// The finished picture is the globe drawn above, shrunk a little and moved down to leave room for the Sun.
const SCALE = 0.86, TOP = 228;                       // TOP = where the globe's centre sits in the final picture
const HEIGHT = Math.round(TOP + RING * SCALE + 8);   // picture height

const RAD = Math.PI / 180;

export default function EarthView({ now }) {
  const sun = subsolarPoint(now);
  const moon = moonState(now);

  // The whole globe turns so that the longitude under the sun is at the top.
  const turn = sun.lon;

  // Where Vernon is on the globe: distance from the centre shrinks toward the pole.
  const phi = (sun.lon - HOME_LON) * RAD;
  const hr = R * Math.cos(HOME_LAT * RAD);
  const hx = CX + hr * Math.sin(phi), hy = CY - hr * Math.cos(phi);

  // Night side. Seen from above the pole, the day/night line is half an ellipse
  // whose height depends on how far north or south the sun is (the season).
  const ry = Math.max(0.01, Math.abs(Math.sin(sun.lat * RAD))) * R;
  const night = `M ${CX - R} ${CY} A ${R} ${ry} 0 0 ${sun.lat >= 0 ? 0 : 1} ${CX + R} ${CY} A ${R} ${R} 0 0 1 ${CX - R} ${CY} Z`;

  // Moon on its ring: new moon at the sun (top), full moon opposite.
  const m = ((90 + moon.elongation) * Math.PI) / 180;
  const mx = CX + RING * Math.cos(m), my = CY - RING * Math.sin(m);

  return (
    <svg viewBox={`0 0 ${SIZE} ${HEIGHT}`} role="img" aria-label="Earth seen from above the North Pole" className="view">
      <defs>
        <clipPath id="globeClip"><circle cx={CX} cy={CY} r={R} /></clipPath>
        <filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3" /></filter>
        <radialGradient id="sunGlow">
          <stop offset="0" stopColor="#fff6b0" />
          <stop offset="1" stopColor="#fff6b0" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* The Sun is huge and far away: only part of it shows, cut exactly in half by the top edge. */}
      <circle cx={CX} cy="0" r="56" fill="url(#sunGlow)" />
      <circle cx={CX} cy="0" r="22" fill="#fff6aa" />

      <g transform={`translate(${CX * (1 - SCALE)} ${TOP - CY * SCALE}) scale(${SCALE})`}>
      <circle cx={CX} cy={CY} r={RING} fill="none" stroke="#2a2a38" strokeDasharray="2 6" />

      <circle cx={CX} cy={CY} r={R} fill={OCEAN} />
      <g clipPath="url(#globeClip)">
        <g transform={`rotate(${turn.toFixed(2)} ${CX} ${CY})`}>
          {[30, 60].map((lat) => (
            <circle key={lat} cx={CX} cy={CY} r={R * Math.cos(lat * RAD)} fill="none" stroke="#fff" strokeOpacity="0.18" strokeWidth="0.6" />
          ))}
          {Array.from({ length: 12 }, (_, i) => {
            const a = i * 30 * RAD;
            return <line key={i} x1={CX} y1={CY} x2={CX + R * Math.sin(a)} y2={CY - R * Math.cos(a)} stroke="#fff" strokeOpacity="0.18" strokeWidth="0.6" />;
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
      <circle cx={mx} cy={my} r="9" fill="#e1e1f0" />
      </g>
    </svg>
  );
}

import { moonColor } from "../color.js";

const R = 110, CX = 130, CY = 130;

export default function MoonView({ moon }) {
  const c = Math.cos((moon.elongation * Math.PI) / 180);
  const lit = moonColor(moon.illumination);
  const rx = Math.abs(c) * R;
  const top = `${CX} ${CY - R}`, bottom = `${CX} ${CY + R}`;
  const isNew = moon.illumination < 0.02, isFull = moon.illumination > 0.97;

  // Lit part: one edge is the moon's limb, the other is the terminator (an ellipse arc).
  let d;
  if (moon.waxing) {
    d = `M ${top} A ${R} ${R} 0 0 1 ${bottom} A ${rx} ${R} 0 0 ${c > 0 ? 0 : 1} ${top} Z`;
  } else {
    d = `M ${top} A ${R} ${R} 0 0 0 ${bottom} A ${rx} ${R} 0 0 ${c > 0 ? 1 : 0} ${top} Z`;
  }

  return (
    <svg viewBox="0 0 260 260" role="img" aria-label={moon.name} className="view moon">
      <circle cx={CX} cy={CY} r={R} fill="#1e1e2d" />
      {isFull ? <circle cx={CX} cy={CY} r={R} fill={lit} /> : !isNew && <path d={d} fill={lit} />}
    </svg>
  );
}

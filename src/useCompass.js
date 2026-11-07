import { useEffect, useRef, useState } from "react";
import { MAGNETIC_DECLINATION_DEG } from "./config.js";

// Returns { heading, status }. heading is the TRUE-north direction (degrees) the top of the screen points to,
// or null. status: "off" | "waiting" | "on" | "unavailable". Android Chrome reports the compass through
// "deviceorientationabsolute" (alpha is the angle anticlockwise from magnetic north).
export default function useCompass(enabled) {
  const [state, setState] = useState({ heading: null, status: "off" });
  const smooth = useRef(null);
  const lastPush = useRef(0);

  useEffect(() => {
    if (!enabled) { setState({ heading: null, status: "off" }); smooth.current = null; return; }
    setState({ heading: null, status: "waiting" });
    let got = false;

    const onOrient = (e) => {
      if (e.alpha == null) return;
      const angle = (screen.orientation && screen.orientation.angle) || 0;
      const raw = (((360 - e.alpha - angle + MAGNETIC_DECLINATION_DEG) % 360) + 360) % 360;
      const r = (raw * Math.PI) / 180;
      const s = smooth.current;
      smooth.current = s ? { x: s.x + 0.25 * (Math.cos(r) - s.x), y: s.y + 0.25 * (Math.sin(r) - s.y) } : { x: Math.cos(r), y: Math.sin(r) };
      const now = performance.now();
      if (now - lastPush.current < 60) return;
      lastPush.current = now;
      got = true;
      const h = (Math.atan2(smooth.current.y, smooth.current.x) * 180) / Math.PI;
      setState({ heading: ((h % 360) + 360) % 360, status: "on" });
    };

    window.addEventListener("deviceorientationabsolute", onOrient, true);
    const timer = setTimeout(() => { if (!got) setState({ heading: null, status: "unavailable" }); }, 2500);
    return () => { window.removeEventListener("deviceorientationabsolute", onOrient, true); clearTimeout(timer); };
  }, [enabled]);

  return state;
}

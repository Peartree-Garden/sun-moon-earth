import { useEffect, useRef, useState } from "react";
import { MAGNETIC_DECLINATION_DEG } from "./config.js";

// Returns { heading, status }. heading is the TRUE-north direction (degrees) the top of the screen points to,
// or null. status: "off" | "waiting" | "on" | "unavailable". Android Chrome reports the compass through
// "deviceorientationabsolute" (alpha is the angle anticlockwise from magnetic north).
export default function useCompass(enabled) {
  const [state, setState] = useState({ heading: null, status: "off" });
  const smooth = useRef(null);
  const lastPush = useRef(0);
  const settleUntil = useRef(0);   // ignore readings until this time (right after coming back to the app)

  useEffect(() => {
    if (!enabled) { setState({ heading: null, status: "off" }); smooth.current = null; return; }
    setState({ heading: null, status: "waiting" });
    let got = false;

    const onOrient = (e) => {
      if (e.alpha == null) return;
      const now = performance.now();
      if (now < settleUntil.current) return;   // skip stale or jumpy readings just after returning
      const angle = (screen.orientation && screen.orientation.angle) || 0;
      const raw = (((360 - e.alpha - angle + MAGNETIC_DECLINATION_DEG) % 360) + 360) % 360;
      const r = (raw * Math.PI) / 180;
      const s = smooth.current;
      smooth.current = s ? { x: s.x + 0.25 * (Math.cos(r) - s.x), y: s.y + 0.25 * (Math.sin(r) - s.y) } : { x: Math.cos(r), y: Math.sin(r) };
      if (now - lastPush.current < 60) return;
      lastPush.current = now;
      got = true;
      const h = (Math.atan2(smooth.current.y, smooth.current.x) * 180) / Math.PI;
      setState({ heading: ((h % 360) + 360) % 360, status: "on" });
    };

    const start = () => window.addEventListener("deviceorientationabsolute", onOrient, true);
    const stop = () => window.removeEventListener("deviceorientationabsolute", onOrient, true);

    // Coming back from another app: restart the sensor listener and start the smoothing fresh.
    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      stop();
      smooth.current = null;
      settleUntil.current = performance.now() + 700;
      setState((s) => ({ ...s, status: "waiting" }));
      start();
    };

    start();
    document.addEventListener("visibilitychange", onVisibility);
    const timer = setTimeout(() => { if (!got) setState({ heading: null, status: "unavailable" }); }, 2500);
    return () => { stop(); document.removeEventListener("visibilitychange", onVisibility); clearTimeout(timer); };
  }, [enabled]);

  return state;
}

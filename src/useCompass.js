import { useEffect, useSyncExternalStore } from "react";
import { MAGNETIC_DECLINATION_DEG } from "./config.js";

// The compass lives outside any one tab: once it is switched on it keeps listening (while the app is open),
// so the Sky tab already knows which way you are facing the moment you switch to it.
// heading is the TRUE-north direction (degrees) the top of the screen points to, or null.
// status: "off" | "waiting" | "on" | "unavailable". Android Chrome reports the compass through
// "deviceorientationabsolute" (alpha is the angle anticlockwise from magnetic north).
let state = { heading: null, status: "off" };
const listeners = new Set();
let running = false, smooth = null, lastPush = 0, settleUntil = 0, got = false, timer = null;

function emit(next) { state = next; listeners.forEach((l) => l()); }

function onOrient(e) {
  if (e.alpha == null) return;
  const now = performance.now();
  if (now < settleUntil) return;   // skip stale or jumpy readings just after returning to the app
  const angle = (screen.orientation && screen.orientation.angle) || 0;
  const raw = (((360 - e.alpha - angle + MAGNETIC_DECLINATION_DEG) % 360) + 360) % 360;
  const r = (raw * Math.PI) / 180;
  smooth = smooth ? { x: smooth.x + 0.25 * (Math.cos(r) - smooth.x), y: smooth.y + 0.25 * (Math.sin(r) - smooth.y) } : { x: Math.cos(r), y: Math.sin(r) };
  if (now - lastPush < 60) return;
  lastPush = now;
  got = true;
  const h = (Math.atan2(smooth.y, smooth.x) * 180) / Math.PI;
  emit({ heading: ((h % 360) + 360) % 360, status: "on" });
}

// Coming back from another app: restart the sensor listener and start the smoothing fresh.
function onVisibility() {
  if (document.visibilityState !== "visible" || !running) return;
  window.removeEventListener("deviceorientationabsolute", onOrient, true);
  smooth = null;
  settleUntil = performance.now() + 700;
  emit({ ...state, status: "waiting" });
  window.addEventListener("deviceorientationabsolute", onOrient, true);
}

export function setCompassEnabled(on) {
  if (on === running) return;
  running = on;
  if (on) {
    got = false; smooth = null;
    emit({ heading: null, status: "waiting" });
    window.addEventListener("deviceorientationabsolute", onOrient, true);
    document.addEventListener("visibilitychange", onVisibility);
    timer = setTimeout(() => { if (!got) emit({ heading: null, status: "unavailable" }); }, 2500);
  } else {
    window.removeEventListener("deviceorientationabsolute", onOrient, true);
    document.removeEventListener("visibilitychange", onVisibility);
    clearTimeout(timer);
    smooth = null;
    emit({ heading: null, status: "off" });
  }
}

// Start right away if it was left on last time, so it is already warm when you open the Sky tab.
try { if (typeof window !== "undefined" && localStorage.getItem("compass") === "1") setCompassEnabled(true); } catch {}

const subscribe = (l) => { listeners.add(l); return () => listeners.delete(l); };
const getState = () => state;

export default function useCompass(enabled) {
  useEffect(() => { setCompassEnabled(enabled); }, [enabled]);
  return useSyncExternalStore(subscribe, getState);
}

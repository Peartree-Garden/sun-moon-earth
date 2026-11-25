import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import Wallpaper from "./components/Wallpaper.jsx";
import "./styles.css";

// Opening the site with /?wallpaper shows the simple live-wallpaper version.
const wallpaper = new URLSearchParams(window.location.search).has("wallpaper");
createRoot(document.getElementById("root")).render(wallpaper ? <Wallpaper /> : <App />);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

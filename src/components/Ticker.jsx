import { useEffect, useState } from "react";
import { HOME_LAT } from "../config.js";
import { cityOf, formatOffset, formatUtc } from "../birth.js";
import { chooseReference, describeRatio, lightTime } from "../references.js";

const SPIN_KMH = (2 * Math.PI * 6378.137 * Math.cos((HOME_LAT * Math.PI) / 180)) / 86164.1 * 3600;

const ROWS = [
  { key: "spin", title: "Spinning with the Earth", speed: SPIN_KMH / 3600, speedText: `${Math.round(SPIN_KMH).toLocaleString("en-CA")} km/h`, note: "at Vernon's latitude" },
  { key: "sun", title: "Earth around the Sun", speed: 29.78, speedText: "29.8 km/s", note: "108,000 km/h" },
  { key: "gal", title: "Solar System around the galaxy", speed: 220, speedText: "≈ 220 km/s", note: "792,000 km/h" },
  { key: "cmb", title: "Milky Way through the universe", speed: 600, speedText: "≈ 600 km/s", note: "measured against the cosmic microwave background" },
];

const dayNumber = () => Math.floor(Date.now() / 86400000);

export default function Ticker({ profile, onEdit }) {
  const BIRTH = profile.utcMs;
  const [t, setT] = useState(() => Date.now());
  const [shuffle, setShuffle] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setT(Date.now()), 50);
    return () => clearInterval(id);
  }, []);
  const seconds = Math.max(0, (t - BIRTH) / 1000);
  const years = seconds / 31556952;

  return (
    <section className="ticker">
      <p className="label">Distance travelled since you were born</p>
      <p className="small">{years.toFixed(2)} years, counting every second</p>
      {ROWS.map((row, i) => {
        const km = row.speed * seconds;
        const ref = chooseReference(km, dayNumber() + i * 3 + shuffle);
        return (
          <div className="trow" key={row.key}>
            <div className="thead"><span>{row.title}</span><span>{row.speedText}</span></div>
            <div className="tnum">{Math.floor(km).toLocaleString("en-CA")}<small> km</small></div>
            <div className="tref">{describeRatio(km, ref)}</div>
            <div className="tlight">light needs {lightTime(km)} to cover this · {row.note}</div>
          </div>
        );
      })}
      <button className="again" onClick={() => setShuffle((s) => s + 1)}>Show other comparisons</button>
      <details>
        <summary>How is this calculated?</summary>
        <p>Each row is speed × time since birth ({profile.date}{profile.unknownTime ? ", time unknown so noon was used" : `, ${profile.time}`}, {profile.place || cityOf(profile.zone)} time, {formatOffset(profile.offsetMin)} then, which is {formatUtc(BIRTH)}). They are measured against different things, so they cannot be added together.</p>
        <p>The galaxy and universe speeds are estimates (the galactic one is good to about 10%). The universe's expansion is not counted, because it is not motion through space. Spin uses Vernon's latitude for the whole time.</p>
      </details>
      <button className="linkbtn" onClick={onEdit}>Change birth info</button>
    </section>
  );
}

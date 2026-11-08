// Things to compare big distances with. km is the length of ONE unit of `plural`.
// Edit freely: add as many as you like, the app picks ones that give a sensible number.
// `partial: true` entries are huge (so we say "x% of the way") and only used when nothing else fits.
const AU = 149597870.7;

export const REFERENCES = [
  { km: 40075, plural: "times around the Earth at the equator", single: "once around the Earth at the equator" },
  { km: 384400 * 2, plural: "round trips to the Moon", single: "a round trip to the Moon" },
  { km: AU, plural: "trips from Earth to the Sun", single: "the distance from Earth to the Sun" },
  { km: 227.9e6, plural: "trips from the Sun to Mars", single: "the distance from the Sun to Mars" },
  { km: 778.5e6, plural: "trips from the Sun to Jupiter", single: "the distance from the Sun to Jupiter" },
  { km: 1433.5e6, plural: "trips from the Sun to Saturn", single: "the distance from the Sun to Saturn" },
  { km: 2872.5e6, plural: "trips from the Sun to Uranus", single: "the distance from the Sun to Uranus" },
  { km: 4495e6, plural: "trips from the Sun to Neptune", single: "the distance from the Sun to Neptune" },
  { km: 5906e6 * 2, plural: "round trips from the Sun to Pluto", single: "a round trip from the Sun to Pluto" },
  { km: 121 * AU, plural: "times the distance from the Sun to the Solar System's edge", single: "the distance from the Sun to the Solar System's edge" },
  { km: 2.5902e10, plural: "times the distance light travels in a day", single: "the distance light travels in a day" },
  { km: 1.813e11, plural: "times the distance light travels in a week", single: "the distance light travels in a week" },
  { km: 2000 * AU, plural: "times the distance from the Sun to the Oort Cloud's inner edge", single: "the distance from the Sun to the Oort Cloud's inner edge" },
  { km: 4.0175e13, partial: true, plural: "times the way to Proxima Centauri", single: "the way to Proxima Centauri, the nearest star" },
];

const sig2 = (x) => Number(x.toPrecision(2));

export function describeRatio(km, ref) {
  const r = km / ref.km;
  if (r >= 1.5) return `about ${sig2(r).toLocaleString("en-CA")} ${ref.plural}`;
  if (r >= 0.9) return `about ${ref.single}`;
  const pct = r * 100;
  return `about ${pct >= 10 ? Math.round(pct) : pct.toFixed(1)}% of ${ref.single}`;
}

// Choose a comparison that gives a friendly number; `pick` changes the choice (day number, shuffle count).
export function chooseReference(km, pick) {
  let list = REFERENCES.filter((x) => !x.partial && km / x.km >= 1.5 && km / x.km <= 3000);
  if (list.length === 0) list = REFERENCES.filter((x) => km / x.km >= 0.01);
  if (list.length === 0) list = REFERENCES.slice(0, 1);
  return list[((pick % list.length) + list.length) % list.length];
}

const LIGHT = 299792.458;
export function lightTime(km) {
  const s = km / LIGHT;
  if (s < 90) return `${Math.round(s)} seconds`;
  if (s < 5400) return `${Math.round(s / 60)} minutes`;
  if (s < 172800) return `${Math.round(s / 360) / 10} hours`;
  return `${Math.round(s / 8640) / 10} days`;
}

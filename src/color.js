const lerp = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
const css = (c) => `rgb(${c[0]},${c[1]},${c[2]})`;

// crimson -> tangerine -> light orange (half) -> yellow -> pearl white
const MOON_STOPS = [
  [0.0, [200, 20, 40]], [0.25, [255, 130, 30]], [0.5, [255, 190, 110]],
  [0.75, [255, 225, 80]], [1.0, [245, 245, 235]],
];

export function moonColor(ill) {
  for (let i = 0; i < MOON_STOPS.length - 1; i++) {
    const [p0, c0] = MOON_STOPS[i], [p1, c1] = MOON_STOPS[i + 1];
    if (ill <= p1) return css(lerp(c0, c1, (ill - p0) / (p1 - p0)));
  }
  return css(MOON_STOPS[MOON_STOPS.length - 1][1]);
}

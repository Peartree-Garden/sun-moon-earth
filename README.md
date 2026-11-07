# Sun Moon Earth

A small installable app (PWA) that shows, live:

- **Earth**: the Earth seen from above the North Pole, the sun, the moon, a dot for Vernon, and "Sun over …" (the place on Earth where the sun is straight overhead, refreshed once a minute).
- **Moon**: phase picture with the crimson → orange → yellow → pearl colour fade, phase name, distance from Earth in km, and the next full and new moon.

- **Travel**: live counters of the distance travelled since birth, spinning with the Earth, around the Sun, around the galaxy and through the universe, with comparisons (round trips to the Moon, Sun to Pluto...). Edit `src/references.js` to add comparisons and `BIRTH_UTC` in `src/config.js`.
- **Links**: quick links to maps and space sites. Edit `src/links.js`.

Everything is calculated on the phone from its clock. There is no API, no key and no server, so it also works offline.

## Run it

```
npm install
npm run dev        # http://localhost:5173
npm test           # checks the maths against known eclipses, full moons and a perigee
npm run build      # makes dist/
```

## Deploy

Push to GitHub, then in Netlify choose "Import from Git". `netlify.toml` already sets the build command (`npm run build`) and publish folder (`dist`).

## Install on a phone

- iPhone: open the site in Safari, Share, Add to Home Screen.
- Android: open in Chrome, menu, Install app.

## Change things

`src/config.js`: home name and longitude, the time zone offset (fixed UTC-7, no daylight saving) and the "Sun over" label.
`src/color.js`: the moon colour stops.
`MAGNETIC_DECLINATION_DEG` in `src/config.js`: correction from magnetic to true north for the Sky tab's compass (about +14.5 in Vernon).

## Accuracy

Moon phase times agree with published new and full moons to within about two minutes, and the moon distance to within about 10 km (Meeus series). Sun-over position follows the sun's declination and the equation of time to a fraction of a degree. Place names use the nearest of 348 built-in cities and islands, so over open water it says e.g. "Pacific Ocean, 700 km from Nuku Hiva".

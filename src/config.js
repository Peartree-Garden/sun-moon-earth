// Change these to personalise the app.
export const HOME_NAME = "Vernon";
export const HOME_LON = -119.27;      // degrees east (west is negative)
export const UTC_OFFSET_HOURS = -7;   // fixed all year, no daylight saving
export const SUN_LABEL = "Sun over:";

// Birth moment: 10 PM in Lisbon on 25 Nov 1970. Portugal was on UTC+1 all year then, so that is 21:00 UTC.
export const BIRTH_UTC = "1970-11-25T21:00:00Z";
export const HOME_LAT = 50.27;        // used for the spin speed (faster near the equator)

// Phone compasses point to MAGNETIC north. This is the angle from magnetic to true north
// (positive = magnetic north is east of true north). About +14.5 for Vernon, BC; tune it if the compass seems off.
export const MAGNETIC_DECLINATION_DEG = 14.5;

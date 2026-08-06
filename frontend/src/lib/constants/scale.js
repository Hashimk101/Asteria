// ─── Master scale: 1 AU = 100 Three.js units ──────────────────────────────
// This means asteroid API coords (in km) map correctly alongside planets.
// Formula: threeUnits = km * KM_TO_UNITS
export const AU_IN_KM        = 149_597_870;       // 1 AU in km
export const AU_TO_UNITS     = 100;               // 1 AU = 100 Three.js units
export const KM_TO_UNITS     = AU_TO_UNITS / AU_IN_KM; // ~6.685e-7

// ─── Planet orbital radii (AU → units) ────────────────────────────────────
export const ORBITAL_RADII_AU = {
  Mercury: 0.387,
  Venus:   0.723,
  Earth:   1.000,
  Mars:    1.524,
  Jupiter: 5.203,
  Saturn:  9.537,
  Uranus:  19.19,
  Neptune: 30.07,
};

// ─── Planet mean radii (km → units) ───────────────────────────────────────
// Raw km from JPL: https://ssd.jpl.nasa.gov/planets/phys_par.html
export const PLANET_RADII_KM = {
  Sun:     695_700,
  Mercury: 2_439,
  Venus:   6_052,
  Earth:   6_371,
  Mars:    3_390,
  Jupiter: 69_911,
  Saturn:  58_232,
  Uranus:  25_362,
  Neptune: 24_622,
};

// ─── Visual radius scale ───────────────────────────────────────────────────
// Real radii in Three.js units are microscopic (Earth = 0.00004 units at 1AU=100).
// We apply a separate RADIUS_EXAGGERATION so planets are actually visible.
// Asteroids use KM_TO_UNITS directly for position, NOT this radius scale.
export const RADIUS_EXAGGERATION = 1500; // tweak freely — only affects visuals

export const PLANET_VISUAL_RADII = Object.fromEntries(
  Object.entries(PLANET_RADII_KM).map(([name, km]) => [
    name,
    km * KM_TO_UNITS * RADIUS_EXAGGERATION,
  ])
);
// Result: Earth ≈ 6.4 units, Jupiter ≈ 70 units, Mercury ≈ 2.4 units — perfect

// ─── Earth camera constants (kept for Earth close-up view) ────────────────
export const EARTH_RADIUS_U    = PLANET_VISUAL_RADII.Earth;
export const EARTH_CAM_DISTANCE = EARTH_RADIUS_U * 3.5;

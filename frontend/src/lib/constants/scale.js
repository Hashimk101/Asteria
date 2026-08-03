export const KM_PER_UNIT     = 10_000;
export const EARTH_RADIUS_U  = 6_371 / KM_PER_UNIT;
export const MOON_DISTANCE_U = 384_400 / KM_PER_UNIT;
export const kmToUnits       = (km) => km / KM_PER_UNIT;
export const KM_SCALE        = 1 / 1_000_000;

// ─── Solar system visual scale ────────────────────────────────────────────────
// We want Earth at 40 layout units (matches SOLAR_LAYOUT.Earth.orbitRadius)
// Earth is 149,597,870 km from Sun on average (1 AU)
// So: 1 layout unit = 149,597,870 / 40 km
// Multiply any API km value by VISUAL_SCALE → lands correctly in solar scene
export const AU_KM       = 149_597_870;
export const VISUAL_SCALE = 40 / AU_KM;   // ≈ 2.67e-7

// Earth-centered view
export const EARTH_CAM_DISTANCE = EARTH_RADIUS_U * 5;

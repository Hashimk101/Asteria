export const AU_IN_KM            = 149_597_870;
export const AU_TO_UNITS         = 100;
export const KM_TO_UNITS         = AU_TO_UNITS / AU_IN_KM;   // ~6.685e-7

export const ORBITAL_RADII_AU = {
  Mercury:  0.387,
  Venus:    0.723,
  Earth:    1.000,
  Mars:     1.524,
  Jupiter:  5.203,
  Saturn:   9.537,
  Uranus:  19.190,
  Neptune: 30.070,
};

export const PLANET_RADII_KM = {
  Sun:     695_700,
  Mercury:   2_439,
  Venus:     6_052,
  Earth:     6_371,
  Mars:      3_390,
  Jupiter:  69_911,
  Saturn:   58_232,
  Uranus:   25_362,
  Neptune:  24_622,
};

// Planets need heavy exaggeration to be visible at AU scale
export const RADIUS_EXAGGERATION = 1500;

// Sun is already huge — use a much smaller multiplier so it
// doesn't swallow Mercury/Venus orbits (~38–72 units away)
export const SUN_RADIUS_EXAGGERATION = 70;

export const PLANET_VISUAL_RADII = Object.fromEntries(
  Object.entries(PLANET_RADII_KM)
    .filter(([name]) => name !== 'Sun')
    .map(([name, km]) => [
      name,
      km * KM_TO_UNITS * RADIUS_EXAGGERATION,
    ])
);

// Sun computed separately with its own exaggeration
// 695,700 × 6.685e-7 × 80 ≈ 37 units — fits inside Mercury orbit (38.7 units)
export const SUN_VISUAL_RADIUS = PLANET_RADII_KM.Sun * KM_TO_UNITS * SUN_RADIUS_EXAGGERATION;

export const EARTH_RADIUS_U     = PLANET_VISUAL_RADII.Earth;
export const EARTH_CAM_DISTANCE = EARTH_RADIUS_U * 3.5;

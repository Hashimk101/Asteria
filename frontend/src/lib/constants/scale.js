export const AU_IN_KM           = 149_597_870;
export const AU_TO_UNITS        = 100;
export const KM_TO_UNITS        = AU_TO_UNITS / AU_IN_KM;   // ~6.685e-7

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

export const RADIUS_EXAGGERATION = 1500;

export const PLANET_VISUAL_RADII = Object.fromEntries(
  Object.entries(PLANET_RADII_KM).map(([name, km]) => [
    name,
    km * KM_TO_UNITS * RADIUS_EXAGGERATION,
  ])
);

export const EARTH_RADIUS_U     = PLANET_VISUAL_RADII.Earth;
export const EARTH_CAM_DISTANCE = EARTH_RADIUS_U * 3.5;

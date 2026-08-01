// src/lib/constants/scale.js
export const KM_PER_UNIT     = 10_000;          // 1 unit = 10,000 km
export const EARTH_RADIUS_U  = 6_371 / KM_PER_UNIT;   // 0.6371 units
export const MOON_DISTANCE_U = 384_400 / KM_PER_UNIT;  // 38.44 units

// Convert raw km from API → scene units
export const kmToUnits = (km) => km / KM_PER_UNIT;

// Earth-centered view camera sits at ~5x Earth radius
export const EARTH_CAM_DISTANCE = EARTH_RADIUS_U * 5;  // ~3.2 units

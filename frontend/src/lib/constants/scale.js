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

// Sun exaggeration tuned to keep ALL inner planets outside.
// 695,700 × 6.685e-7 × 45 ≈ 20.9 units.
// Mercury orbit center = 38.7u, Mercury visual radius ≈ 3.2u
// → Mercury near-side = 35.5u — safely outside Sun surface (20.9u). ✅
// Outer planets are capped in Scene.jsx so Sun remains the largest body.
export const SUN_RADIUS_EXAGGERATION = 45;

export const PLANET_VISUAL_RADII = Object.fromEntries(
  Object.entries(PLANET_RADII_KM)
    .filter(([name]) => name !== 'Sun')
    .map(([name, km]) => [
      name,
      km * KM_TO_UNITS * RADIUS_EXAGGERATION,
    ])
);

// Sun computed separately with its own exaggeration
// 695,700 × 6.685e-7 × 45 ≈ 20.9 units — inside Mercury orbit, outside all inner planets
export const SUN_VISUAL_RADIUS = PLANET_RADII_KM.Sun * KM_TO_UNITS * SUN_RADIUS_EXAGGERATION;

export const EARTH_RADIUS_U     = PLANET_VISUAL_RADII.Earth;
export const EARTH_CAM_DISTANCE = EARTH_RADIUS_U * 3.5;

// ─── Earth-view scale ─────────────────────────────────────────────────────────
// In Earth close-up view, 1 scene-unit = 1 Earth-radius ≈ 6,371 km.
// Use this to convert km → Earth-view scene units so asteroid approach
// distances (hundreds of thousands of km) land at visible positions.
export const EARTH_VIEW_KM_TO_UNITS = EARTH_RADIUS_U / PLANET_RADII_KM.Earth; // ~1/996

// ─── Earth-view Relative Trajectory Math ──────────────────────────────────────
export const LD_RING_RADIUS = 25; // 1 Lunar Distance = 25 scene units (~4 Earth radii)

import * as THREE from 'three';

export function toEarthRelVec3(v, earthData) {
  if (!v || typeof v.x_km !== 'number') return new THREE.Vector3(0, 0, 0);

  let ex = 0, ey = 0, ez = 0;

  if (Array.isArray(earthData) && earthData.length > 0) {
    let best = earthData[0];
    if (v.jd != null) {
      let minDiff = Infinity;
      for (let i = 0; i < earthData.length; i++) {
        const diff = Math.abs(earthData[i].jd - v.jd);
        if (diff < minDiff) {
          minDiff = diff;
          best = earthData[i];
        }
      }
    }
    ex = best.x_km ?? 0;
    ey = best.y_km ?? 0;
    ez = best.z_km ?? 0;
  } else if (earthData && typeof earthData.x === 'number') {
    ex = earthData.x;
    ey = earthData.y;
    ez = earthData.z;
  }

  const dx = v.x_km - ex;
  const dy = v.z_km - ez; // Three.js Y is Z_km
  const dz = v.y_km - ey; // Three.js Z is Y_km

  const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (r === 0 || isNaN(r)) return new THREE.Vector3(0, 0, 0);

  // 1 Lunar Distance (384,400 km) = 25 scene units (~4 Earth radii)
  const scale = LD_RING_RADIUS * Math.pow(r / 384400, 0.4);

  return new THREE.Vector3(
    (dx / r) * scale,
    (dy / r) * scale,
    (dz / r) * scale
  );
}

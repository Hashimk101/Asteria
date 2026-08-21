/**
 * ═══════════════════════════════════════════════════════════════════════
 *  ASTERIA — Impact Physics Engine
 *  Calculates kinetic energy, crater dimensions, and blast radii
 *  for asteroid impacts on Earth.
 *
 *  References:
 *    • Holsapple (1993) scaling laws for crater formation
 *    • Collins et al. (2005) — Earth Impact Effects Program
 *    • Glasstone & Dolan (1977) — blast overpressure scaling
 * ═══════════════════════════════════════════════════════════════════════
 */

// ─── Physical Constants ────────────────────────────────────────────────────────

/** Mean bulk density of a stony (chondritic) asteroid, kg/m³ */
const DENSITY_STONY   = 3_000;
/** Mean bulk density of an iron meteorite, kg/m³ */
const DENSITY_IRON    = 7_900;
/** Mean bulk density of a carbonaceous (C-type) asteroid, kg/m³ */
const DENSITY_COMETARY = 1_500;

/** Earth's surface gravity, m/s² */
const G_EARTH = 9.81;
/** Target rock density for crater scaling (continental crust), kg/m³ */
const TARGET_DENSITY = 2_750;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sphereVolume(radiusM) {
  return (4 / 3) * Math.PI * radiusM ** 3;
}

export function formatEnergy(joules) {
  if (joules >= 1e21) return `${(joules / 1e21).toFixed(2)} ZJ`;
  if (joules >= 1e18) return `${(joules / 1e18).toFixed(2)} EJ`;
  if (joules >= 1e15) return `${(joules / 1e15).toFixed(2)} PJ`;
  if (joules >= 1e12) return `${(joules / 1e12).toFixed(2)} TJ`;
  if (joules >= 1e9)  return `${(joules / 1e9).toFixed(2)} GJ`;
  if (joules >= 1e6)  return `${(joules / 1e6).toFixed(2)} MJ`;
  return `${joules.toFixed(0)} J`;
}

export function formatDistance(km) {
  if (km >= 1_000) return `${(km / 1_000).toFixed(2)} Mm`;
  if (km >= 1)     return `${km.toFixed(2)} km`;
  return `${(km * 1_000).toFixed(0)} m`;
}

export function formatMass(kg) {
  if (kg >= 1e18) return `${(kg / 1e18).toFixed(2)} \xd710\xb9\xb8 kg`;
  if (kg >= 1e15) return `${(kg / 1e15).toFixed(2)} Pg`;
  if (kg >= 1e12) return `${(kg / 1e12).toFixed(2)} Tg`;
  if (kg >= 1e9)  return `${(kg / 1e9).toFixed(2)} Gg`;
  if (kg >= 1e6)  return `${(kg / 1e6).toFixed(2)} Mg`;
  return `${kg.toFixed(0)} kg`;
}

export function toHiroshima(joules) {
  const oneBomb = 6.28e13;
  const n = joules / oneBomb;
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M bombs`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K bombs`;
  return `${n.toFixed(2)} bombs`;
}

// ─── Density heuristic from orbit class ───────────────────────────────────────

function densityFromOrbitClass(orbitClass) {
  if (!orbitClass) return DENSITY_STONY;
  const cls = orbitClass.toUpperCase();
  if (cls.includes('COMET') || cls.includes('JFC') || cls.includes('HTC')) return DENSITY_COMETARY;
  if (cls.includes('IRON') || cls.includes('M-TYPE')) return DENSITY_IRON;
  return DENSITY_STONY;
}

// ─── Main Physics Calculation ──────────────────────────────────────────────────

export function calculateImpact(meta, velocityKmS) {
  // 1. Dimensions
  const minM = meta?.estimated_diameter_min_m ?? null;
  const maxM = meta?.estimated_diameter_max_m ?? null;

  let diameterM;
  if (minM != null && maxM != null)  diameterM = (minM + maxM) / 2;
  else if (minM != null)             diameterM = minM * 1.5;
  else if (maxM != null)             diameterM = maxM;
  else                               diameterM = 200;

  const radiusM = diameterM / 2;

  // 2. Mass
  const density = densityFromOrbitClass(meta?.orbit_class_name);
  const volume  = sphereVolume(radiusM);
  const massKg  = density * volume;

  // 3. Velocity
  let vKmS = velocityKmS;
  if (!vKmS || vKmS <= 0) {
    const approaches = meta?.close_approaches ?? [];
    const bestApproach = approaches.reduce((best, ca) => {
      const v = Number(ca.relative_velocity_km_s);
      return (v > 0 && (!best || v < Number(best.relative_velocity_km_s))) ? ca : best;
    }, null);
    vKmS = bestApproach ? Number(bestApproach.relative_velocity_km_s) : 20;
  }
  const vMS = vKmS * 1_000;

  // 4. Kinetic Energy
  const kineticEnergyJ = 0.5 * massKg * vMS * vMS;

  // 5. Crater — Collins et al. 2005 simplified scaling
  const theta = Math.PI / 4;
  const sinTheta = Math.sin(theta);
  const L_km = diameterM / 1_000;

  const craterDiameterKm =
    1.161 *
    Math.pow(density / TARGET_DENSITY, 1 / 3) *
    Math.pow(L_km, 0.78) *
    Math.pow(vKmS, 0.44) *
    Math.pow(sinTheta, 1 / 3) *
    Math.pow(G_EARTH, -0.22);

  const finalCraterKm = craterDiameterKm * 1.25;

  // 6. Blast zones (Glasstone & Dolan scaling)
  const MT_TNT   = 4.184e15;
  const energyMT = kineticEnergyJ / MT_TNT;
  const scaleFactor = Math.pow(Math.max(energyMT, 1e-9), 1 / 3);

  const blastZones = {
    fireball: {
      radiusKm: 0.5  * scaleFactor,
      label: 'FIREBALL',
      desc:  'Complete vaporization — nothing survives',
      color: '#ff1a00',
      overpressure: '> 100 kPa',
    },
    severeDamage: {
      radiusKm: 2.0  * scaleFactor,
      label: 'SEVERE DAMAGE',
      desc:  'Buildings collapse, lethal blast wave',
      color: '#ff6600',
      overpressure: '20 – 100 kPa',
    },
    moderateDamage: {
      radiusKm: 5.0  * scaleFactor,
      label: 'MODERATE DAMAGE',
      desc:  'Widespread structural damage, injuries',
      color: '#ffaa00',
      overpressure: '5 – 20 kPa',
    },
    lightDamage: {
      radiusKm: 15.0 * scaleFactor,
      label: 'LIGHT DAMAGE',
      desc:  'Glass shattered, minor structural damage',
      color: '#ffdd44',
      overpressure: '1 – 5 kPa',
    },
    affectedArea: {
      radiusKm: 50.0 * scaleFactor,
      label: 'AFFECTED AREA',
      desc:  'Indirect effects — fires, falling debris',
      color: '#88ccff',
      overpressure: '< 1 kPa',
    },
  };

  // 7. Tsunami (Ward & Asphaug 2000 simplified)
  const tsunamiWaveHeightAt100km = 0.1 * Math.sqrt(massKg * vMS * vMS) / 1e5;

  // 8. Ejecta blanket
  const ejectaRadiusKm = finalCraterKm * 2.5;

  // 9. Classification
  let classification;
  if (energyMT < 0.001)      classification = { label: 'SMALL BOLIDE',      color: '#66ccff', risk: 'LOCAL'      };
  else if (energyMT < 0.1)   classification = { label: 'REGIONAL EVENT',    color: '#ffcc44', risk: 'REGIONAL'   };
  else if (energyMT < 100)   classification = { label: 'MAJOR IMPACT',      color: '#ff8800', risk: 'NATIONAL'   };
  else if (energyMT < 1e6)   classification = { label: 'GLOBAL CATASTROPHE',color: '#ff4400', risk: 'GLOBAL'     };
  else                        classification = { label: 'EXTINCTION-LEVEL',  color: '#ff0000', risk: 'EXTINCTION' };

  return {
    diameterM,
    diameterKm: diameterM / 1000,
    massKg,
    density,
    velocityKmS: vKmS,
    kineticEnergyJ,
    energyMT,
    transientCraterKm: craterDiameterKm,
    finalCraterKm,
    blastZones,
    ejectaRadiusKm,
    tsunamiWaveHeightAt100km,
    classification,
  };
}

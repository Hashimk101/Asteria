import { useRef, useEffect, useMemo, Suspense } from 'react';
import { useFrame }                    from '@react-three/fiber';
import { useTexture }                  from '@react-three/drei';
import * as THREE                      from 'three';
import { PLANET_CONFIG }               from '../../lib/constants/planets.js';
import { KM_TO_UNITS }                 from '../../lib/constants/scale.js';
import saturnRingTex                   from '../../assets/textures/8k_saturn_ring_alpha.png';

// ─── Preload all textures at module level ─────────────────────────────────────
// Fires before any component mounts — textures are cached by the time
// the scene renders, so there's no pop-in
Object.values(PLANET_CONFIG).forEach(cfg => {
  if (cfg.texture)    useTexture.preload(cfg.texture);
  if (cfg.normalMap)  useTexture.preload(cfg.normalMap);
  if (cfg.specularMap) useTexture.preload(cfg.specularMap);
});
useTexture.preload(saturnRingTex);

// ─── Saturn Rings ─────────────────────────────────────────────────────────────
function SaturnRings({ radius }) {
  const texture = useTexture(saturnRingTex);
  return (
    <mesh rotation={[Math.PI / 2.2, 0, 0]}>
      <ringGeometry args={[radius * 1.3, radius * 2.4, 128]} />
      <meshBasicMaterial
        map={texture}
        side={THREE.DoubleSide}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

// ─── Atmosphere / Haze ────────────────────────────────────────────────────────
function EarthAtmosphere({ radius }) {
  return (
    <mesh>
      <sphereGeometry args={[radius * 1.025, 64, 64]} />
      <meshStandardMaterial
        color="#4a90d9"
        transparent
        opacity={0.13}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function EarthHalo({ radius }) {
  return (
    <mesh>
      <sphereGeometry args={[radius * 1.09, 64, 64]} />
      <meshStandardMaterial
        color="#1a3a8a"
        transparent
        opacity={0.05}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

function PlanetHaze({ color, radius }) {
  return (
    <mesh>
      <sphereGeometry args={[radius * 1.09, 32, 32]} />
      <meshStandardMaterial
        color={color}
        transparent
        opacity={0.05}
        side={THREE.BackSide}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </mesh>
  );
}

const HAZE_COLORS = {
  Mercury: '#b0b0b0',
  Venus:   '#e0c080',
  Earth:   '#4a90d9',
  Mars:    '#c1440e',
  Jupiter: '#d9b38c',
  Saturn:  '#e0d9b3',
  Uranus:  '#a0d9e0',
  Neptune: '#4a90d9',
};

// ─── PlanetMesh — single layer, no tiers ─────────────────────────────────────
// useTexture suspends here — Suspense in Planet wraps this so only
// this planet blocks, not the whole scene
// ─── PlanetMesh — simplified, no normal/specular map logic ───────────────────
function PlanetMesh({ name, radius, config, onLoaded }) {
  const meshRef  = useRef();
  const firedRef = useRef(false);

  const sourceMap = useTexture(config.texture);  // single texture, always present
  const colorMap = useMemo(() => {
    const map = sourceMap.clone();
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, [sourceMap]);

  useEffect(() => {
    if (!firedRef.current) { firedRef.current = true; onLoaded?.(); }
  }, [onLoaded]);

  useFrame((_, delta) => {
    if (meshRef.current)
      meshRef.current.rotation.y += delta * (config.rotationSpeed ?? 0.05);
  });

  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, name === 'Earth' ? 128 : 32, name === 'Earth' ? 128 : 32]} />
        <meshStandardMaterial
          map={colorMap}
          roughness={name === 'Earth' ? 0.78 : (config.roughness ?? 0.8)}
          metalness={name === 'Earth' ? 0.02 : (config.metalness ?? 0.05)}
        />
      </mesh>

      {name === 'Earth' && (
        <>
          <EarthAtmosphere radius={radius} />
          <EarthHalo radius={radius} />
        </>
      )}
      {name !== 'Earth'  && <PlanetHaze radius={radius} color={HAZE_COLORS[name] ?? '#ffffff'} />}
      {name === 'Saturn' && <SaturnRings radius={radius} />}
    </>
  );
}


// ─── Planet — public component ────────────────────────────────────────────────
export default function Planet({ data, onLoaded, sizeOverride }) {
  const name   = data.name.charAt(0).toUpperCase() + data.name.slice(1).toLowerCase();
  const config = PLANET_CONFIG[name] ?? PLANET_CONFIG.Mercury;
  const radius = sizeOverride ?? config.radius;

  const pos = [
    (data.x_km ?? 0) * KM_TO_UNITS,
    (data.z_km ?? 0) * KM_TO_UNITS,
    (data.y_km ?? 0) * KM_TO_UNITS,
  ];

  const dotColor = {
    Mercury: '#a0a0a0', Venus:   '#e8c97a', Earth:   '#4a9eff',
    Mars:    '#e05a2b', Jupiter: '#c88b5a', Saturn:  '#e8d98a',
    Uranus:  '#7de8e8', Neptune: '#4a6fff',
  }[name] ?? '#ffffff';

  return (
    <group position={pos}>
      {/*
        Suspense is per-planet — if Jupiter's texture is still loading,
        only Jupiter shows a dot. Saturn, Earth etc. are unaffected.
      */}
      <Suspense fallback={
        <mesh>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshBasicMaterial color={dotColor} />
        </mesh>
      }>
        <PlanetMesh
          name={name}
          radius={radius}
          config={config}
          onLoaded={onLoaded}
        />
      </Suspense>
    </group>
  );
}

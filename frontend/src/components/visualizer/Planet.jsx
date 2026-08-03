import { useRef, useEffect, useState, Suspense } from 'react';
import { useFrame }                               from '@react-three/fiber';
import { useTexture }                             from '@react-three/drei';
import * as THREE                                 from 'three';
import { PLANET_CONFIG }                          from '../../lib/constants/planets.js';
import { KM_SCALE }                               from '../../lib/constants/scale.js';
import saturnRingTex                              from '../../assets/textures/8k_saturn_ring_alpha.png';

// ─── Low-res placeholder imports (512px) ─────────────────────────────────────
import mercuryLow from '../../assets/textures/low/mercury_512.jpg';
import venusLow   from '../../assets/textures/low/venus_512.jpg';
import earthLow   from '../../assets/textures/low/earth_512.jpg';
import marsLow    from '../../assets/textures/low/mars_512.jpg';
import jupiterLow from '../../assets/textures/low/jupiter_512.jpg';
import saturnLow  from '../../assets/textures/low/saturn_512.jpg';
import uranusLow  from '../../assets/textures/low/uranus_512.jpg';
import neptuneLow from '../../assets/textures/low/neptune_512.jpg';

const LOW_RES_TEXTURES = {
  Mercury: mercuryLow,
  Venus:   venusLow,
  Earth:   earthLow,
  Mars:    marsLow,
  Jupiter: jupiterLow,
  Saturn:  saturnLow,
  Uranus:  uranusLow,
  Neptune: neptuneLow,
};

// ─── Preload everything at module level ───────────────────────────────────────
// Low-res first so they're cached before the scene even mounts
Object.values(LOW_RES_TEXTURES).forEach(t => useTexture.preload(t));
// High-res starts downloading in background immediately
Object.values(PLANET_CONFIG).forEach(cfg => {
  if (cfg.texture) useTexture.preload(cfg.texture);
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

// ─── Atmosphere ───────────────────────────────────────────────────────────────
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

function PlanetHaze({ color, radius }) {
  return (
    <mesh>
      <sphereGeometry args={[radius * 1.09, 64, 64]} />
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

function getHazeColor(name) {
  const map = {
    Mercury: '#b0b0b0',
    Venus:   '#e0c080',
    Earth:   '#4a90d9',
    Mars:    '#c1440e',
    Jupiter: '#d9b38c',
    Saturn:  '#e0d9b3',
    Uranus:  '#a0d9e0',
    Neptune: '#4a90d9',
  };
  return map[name] ?? '#ffffff';
}

// ─── Low-res shell — suspends ONLY for the tiny 512px texture ─────────────────
// This resolves in <100ms so the planet appears almost instantly
function PlanetLowRes({ name, radius, config }) {
  const meshRef = useRef();

  // Suspends here — but only for ~50KB, resolves fast
  const texture = useTexture(LOW_RES_TEXTURES[name], (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
  });

  useFrame((_, delta) => {
    if (meshRef.current)
      meshRef.current.rotation.y += delta * (config.rotationSpeed ?? 0.1);
  });

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[radius, 32, 32]} />  {/* 32 seg — lighter while upgrading */}
      <meshStandardMaterial
        map={texture}
        roughness={config.roughness ?? 0.8}
        metalness={config.metalness ?? 0.05}
      />
    </mesh>
  );
}

// ─── High-res upgrade — loads silently, swaps in when ready ──────────────────
// Uses THREE.TextureLoader directly so it NEVER triggers Suspense
// Planet stays visible the whole time, just gets sharper
function PlanetHighRes({ name, radius, config, onLoaded }) {
  const meshRef    = useRef();
  const firedRef   = useRef(false);
  const [tex, setTex] = useState(null);   // null = high-res not ready yet

  useEffect(() => {
    const loader = new THREE.TextureLoader();
    loader.load(
      config.texture,
      (highRes) => {
        highRes.colorSpace = THREE.SRGBColorSpace;
        setTex(highRes);                  // swap! planet sharpens silently

        if (!firedRef.current) {
          firedRef.current = true;
          onLoaded?.();
        }
      },
      undefined,
      (err) => console.warn(`⚠️ High-res failed for ${name}:`, err.message)
    );
  }, [config.texture]);                   // eslint-disable-line

  useFrame((_, delta) => {
    if (meshRef.current)
      meshRef.current.rotation.y += delta * (config.rotationSpeed ?? 0.1);
  });

  // tex is null until high-res loads — render nothing, PlanetLowRes shows beneath
  if (!tex) return null;

  // High-res is ready — render on top, replacing the low-res visually
  return (
    <>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 64, 64]} />   {/* full quality now */}
        <meshStandardMaterial
          map={tex}
          roughness={config.roughness ?? 0.8}
          metalness={config.metalness ?? 0.05}
        />
      </mesh>

      {name === 'Earth'
        ? <EarthAtmosphere radius={radius} />
        : <PlanetHaze radius={radius} color={getHazeColor(name)} />
      }

      {name === 'Saturn' && <SaturnRings radius={radius} />}
    </>
  );
}

// ─── Planet — the public component, composes everything ──────────────────────
export default function Planet({ data, onLoaded, sizeOverride }) {
  const name   = data.name.charAt(0).toUpperCase() + data.name.slice(1).toLowerCase();
  const config = PLANET_CONFIG[name] ?? PLANET_CONFIG.Mercury;
  const radius = sizeOverride ?? config.radius;

  const pos = [
    (data.x_km ?? 0) * KM_SCALE,
    (data.y_km ?? 0) * KM_SCALE,
    (data.z_km ?? 0) * KM_SCALE,
  ];

  const dotColor = {
    Mercury: '#a0a0a0', Venus: '#e8c97a', Earth: '#4a9eff',
    Mars: '#e05a2b', Jupiter: '#c88b5a', Saturn: '#e8d98a',
    Uranus: '#7de8e8', Neptune: '#4a6fff',
  }[name] ?? '#ffffff';

  return (
    <group position={pos}>

      {/*
        Layer 1 — colored dot (instant, no loading at all)
        Suspense fallback while even the 512px loads
      */}
      <Suspense fallback={
        <mesh>
          <sphereGeometry args={[radius, 16, 16]} />
          <meshBasicMaterial color={dotColor} />
        </mesh>
      }>
        {/*
          Layer 2 — 512px texture (~50KB, loads in <100ms)
          Visible immediately after tiny download
        */}
        <PlanetLowRes name={name} radius={radius} config={config} />
      </Suspense>

      {/*
        Layer 3 — 8K texture, loads silently via TextureLoader (no Suspense)
        When ready, renders ON TOP of Layer 2 and replaces it visually
        Atmosphere + rings only appear with high-res (worth the wait)
      */}
      <PlanetHighRes
        name={name}
        radius={radius}
        config={config}
        onLoaded={onLoaded}
      />

    </group>
  );
}

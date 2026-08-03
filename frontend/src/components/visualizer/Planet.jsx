// ─── Planet Component ─────────────────────────────────────────────────────────
import { useRef, useEffect }  from 'react';
import { useFrame }           from '@react-three/fiber';
import { useTexture }         from '@react-three/drei';
import * as THREE             from 'three';
import { PLANET_CONFIG }      from '../../lib/constants/planets.js';
import { KM_SCALE } from '../../lib/constants/scale.js';
import saturnRingTex          from '../../assets/textures/8k_saturn_ring_alpha.png';

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

// ─── Haze Colors ──────────────────────────────────────────────────────────────
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

// ─── Planet ───────────────────────────────────────────────────────────────────
export default function Planet({ data, onLoaded, sizeOverride }) {
  const meshRef  = useRef();
  const firedRef = useRef(false);

  const name   = data.name.charAt(0).toUpperCase() + data.name.slice(1).toLowerCase();
  const config = PLANET_CONFIG[name] ?? PLANET_CONFIG.Mercury;

  // ← THE FIX: use sizeOverride from SOLAR_LAYOUT when in solar mode
  //            fall back to config.radius for standalone / Earth close-up use
  const radius = sizeOverride ?? config.radius;

  const texture = useTexture(config.texture, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
  });

  useEffect(() => {
    if (!firedRef.current) {
      firedRef.current = true;
      onLoaded?.();
    }
  }, []); // eslint-disable-line

  useFrame((_, delta) => {
    if (meshRef.current)
      meshRef.current.rotation.y += delta * config.rotationSpeed;
  });

  // When OrbitingPlanet wraps us, data.x/y/z_km are all 0
  // so pos is [0,0,0] and the group handles orbital position
  const pos = [
    (data.x_km ?? 0) * KM_SCALE,
    (data.y_km ?? 0) * KM_SCALE,
    (data.z_km ?? 0) * KM_SCALE,
  ];

  return (
    <group position={pos}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[radius, 64, 64]} />
        <meshStandardMaterial
          map={texture}
          roughness={config.roughness}
          metalness={config.metalness}
        />
      </mesh>

      {name === 'Earth'
        ? <EarthAtmosphere radius={radius} />        
        : <PlanetHaze radius={radius} color={getHazeColor(name)} />
      }

      {name === 'Saturn' && <SaturnRings radius={radius} />}   {/* ← was config.radius */}
    </group>
  );
}

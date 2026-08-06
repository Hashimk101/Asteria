import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import sunTex from '../../assets/textures/8k_sun.jpg';
import { SUN_VISUAL_RADIUS } from '../../lib/constants/scale';

// SUN_VISUAL_RADIUS ≈ 37 units
// Mercury orbit    ≈ 38.7 units  ✅ Sun fits just inside
// Earth orbit      ≈ 100 units
// Jupiter orbit    ≈ 520 units

export default function Sun() {
  const meshRef = useRef();
  const texture = useTexture(sunTex, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
  });

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.01;
  });

  return (
    <group position={[0, 0, 0]}>
      <pointLight intensity={2000} distance={300} decay={1.0} color="#FFF5E0" />
      <pointLight intensity={3000} distance={0}   decay={1.4} color="#FFE8C0" />

      {/* Sun body */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[SUN_VISUAL_RADIUS, 64, 64]} />
        <meshBasicMaterial map={texture} />
      </mesh>

      {/* Inner corona */}
      <mesh>
        <sphereGeometry args={[SUN_VISUAL_RADIUS * 1.08, 64, 64]} />
        <meshBasicMaterial
          color="#FDB813"
          transparent
          opacity={0.12}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[SUN_VISUAL_RADIUS * 1.5, 64, 64]} />
        <meshBasicMaterial
          color="#ff6600"
          transparent
          opacity={0.05}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useTexture } from '@react-three/drei';
import * as THREE from 'three';
import sunTex from '../../assets/textures/8k_sun.jpg';

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
      {/* Strong inner light for inner planets */}
      <pointLight intensity={2000} distance={300}  decay={1.0} color="#FFF5E0" />
      {/* Softer far-reaching light for outer planets */}
      <pointLight intensity={3000} distance={0}    decay={1.4} color="#FFE8C0" />

      {/* Sun body — bigger so it's visible */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[14, 64, 64]} />
        <meshBasicMaterial map={texture} />
      </mesh>

      {/* Inner corona */}
      <mesh>
        <sphereGeometry args={[16, 64, 64]} />
        <meshBasicMaterial color="#FDB813" transparent opacity={0.12}
          side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>

      {/* Outer glow */}
      <mesh>
        <sphereGeometry args={[22, 64, 64]} />
        <meshBasicMaterial color="#ff6600" transparent opacity={0.05}
          side={THREE.BackSide} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

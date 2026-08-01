import { useRef, useEffect } from "react";
import { useFrame }          from "@react-three/fiber";
import { useTexture }        from "@react-three/drei";
import * as THREE            from "three";
import { EARTH_RADIUS_U }    from "../../lib/constants/scale";
import earthDaymap           from "../../assets/textures/8k_earth_daymap.webp";

function Atmosphere() {
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS_U * 1.025, 64, 64]} />
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

function AtmosphereHalo() {
  return (
    <mesh>
      <sphereGeometry args={[EARTH_RADIUS_U * 1.09, 64, 64]} />
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

export default function Earth({ onLoaded }) {
  const meshRef  = useRef();
  const firedRef = useRef(false); // prevent double-firing onLoaded

  // ✅ Set colorSpace inside the callback — fires before drei freezes the object
  const daymap = useTexture(earthDaymap, (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
  });

  // ✅ onLoaded fires after render — safe, no mutation here
  useEffect(() => {
    if (!firedRef.current) {
      firedRef.current = true;
      onLoaded?.();
    }
  }, []); // eslint-disable-line

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * 0.04;
  });

  return (
    <group>
      <mesh ref={meshRef}>
        <sphereGeometry args={[EARTH_RADIUS_U, 128, 128]} />
        <meshStandardMaterial
          map={daymap}
          roughness={0.78}
          metalness={0.02}
        />
      </mesh>
      <Atmosphere />
      <AtmosphereHalo />
    </group>
  );
}

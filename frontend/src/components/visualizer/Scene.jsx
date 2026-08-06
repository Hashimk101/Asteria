import { Suspense, useState, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree }            from "@react-three/fiber";
import { OrbitControls, Html }                   from "@react-three/drei";
import Earth                                     from "./Earth";
import Sun                                       from "./Sun";
import Planet                                    from "./Planet";
import MilkyWay                                  from "./MilkyWay";
import LoadingScreen                             from "./LoadingScreen";
import * as THREE                                from "three";
import {
  EARTH_RADIUS_U,
  EARTH_CAM_DISTANCE,
  ORBITAL_RADII_AU,
  AU_TO_UNITS,
  KM_TO_UNITS,
  PLANET_VISUAL_RADII,
} from "../../lib/constants/scale";

// ─── Build SOLAR_LAYOUT from real data ────────────────────────────────────────
// Orbital periods from Kepler's third law: T = AU^1.5 years, speed ∝ 1/T
// Speed values are angular speed in rad/s scaled for Three.js deltaTime (seconds)
const ORBITAL_SPEEDS = {
  Mercury: 0.0048,
  Venus:   0.0035,
  Earth:   0.0029,
  Mars:    0.0024,
  Jupiter: 0.0013,
  Saturn:  0.0009,
  Uranus:  0.0006,
  Neptune: 0.0005,
};

const SOLAR_LAYOUT = Object.fromEntries(
  Object.entries(ORBITAL_RADII_AU).map(([name, au]) => [
    name,
    {
      orbitRadius: au * AU_TO_UNITS,           // real proportional distance
      speed:       ORBITAL_SPEEDS[name],
      size:        PLANET_VISUAL_RADII[name],  // real proportional radius
    },
  ])
);

const ORBIT_COLORS = {
  Mercury: '#a0a0a0',
  Venus:   '#e8c97a',
  Earth:   '#4a9eff',
  Mars:    '#e05a2b',
  Jupiter: '#c88b5a',
  Saturn:  '#e8d98a',
  Uranus:  '#7de8e8',
  Neptune: '#4a6fff',
};

// ─── Orbit Ring ───────────────────────────────────────────────────────────────
function OrbitRing({ radius, color }) {
  const points = [];
  for (let i = 0; i <= 128; i++) {
    const a = (i / 128) * Math.PI * 2;
    points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
  }
  const geo = new THREE.BufferGeometry().setFromPoints(points);
  return (
    <line geometry={geo}>
      <lineBasicMaterial color={color} opacity={0.35} transparent linewidth={2} />
    </line>
  );
}

// ─── Deterministic starting angle ─────────────────────────────────────────────
function getInitialOrbitAngle(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return (hash / 0xffffffff) * Math.PI * 2;
}

// ─── Orbiting Planet ──────────────────────────────────────────────────────────
function OrbitingPlanet({ name, layout, apiData }) {
  const groupRef = useRef();
  const angleRef = useRef(getInitialOrbitAngle(name));
  const [hovered, setHovered] = useState(false);

  const { camera, controls } = useThree();
  const isReady = !!controls;

  useFrame((_, delta) => {
    // If API gives live position in km, use that instead of circular orbit
    if (apiData?.x_km && apiData?.y_km) {
      if (groupRef.current) {
        groupRef.current.position.x = apiData.x_km * KM_TO_UNITS;
        groupRef.current.position.y = (apiData.z_km ?? 0) * KM_TO_UNITS; // ecliptic tilt
        groupRef.current.position.z = apiData.y_km * KM_TO_UNITS;
      }
    } else {
      // Fallback: circular orbit
      angleRef.current += delta * layout.speed;
      if (groupRef.current) {
        groupRef.current.position.x = Math.cos(angleRef.current) * layout.orbitRadius;
        groupRef.current.position.y = 0;
        groupRef.current.position.z = Math.sin(angleRef.current) * layout.orbitRadius;
      }
    }
  });

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (!controls || !groupRef.current) return;
    const pos = groupRef.current.position;
    const s   = layout.size;
    controls.target.set(pos.x, pos.y, pos.z);
    camera.position.set(pos.x + s * 8, pos.y + s * 4, pos.z + s * 8);
    controls.update();
  };

  const handlePointerOver = (e) => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'pointer'; };
  const handlePointerOut  = ()  => {                      setHovered(false); document.body.style.cursor = 'auto';    };

  const planetData = { name, x_km: 0, y_km: 0, z_km: 0, ...(apiData ?? {}) };
  const color      = ORBIT_COLORS[name] ?? '#ffffff';

  return (
    <>
      <OrbitRing radius={layout.orbitRadius} color={color} />
      <group ref={groupRef}>
        {/* Hit sphere — 2.5x visual radius for easy pointer detection */}
        <mesh
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onDoubleClick={isReady ? handleDoubleClick : undefined}
        >
          <sphereGeometry args={[layout.size * 2.5, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <Planet data={planetData} sizeOverride={layout.size} />

        {hovered && (
          <Html center distanceFactor={80} style={{ pointerEvents: 'none' }}>
            <div style={{
              background: 'rgba(5,3,0,0.88)', border: `1px solid ${color}55`,
              borderRadius: '4px', padding: '5px 12px', color,
              fontSize: '11px', fontFamily: 'monospace', letterSpacing: '0.15em',
              whiteSpace: 'nowrap', textTransform: 'uppercase',
              boxShadow: `0 0 12px ${color}33`,
            }}>
              {name}
            </div>
          </Html>
        )}
      </group>
    </>
  );
}

// ─── Solar System Scene ───────────────────────────────────────────────────────
function SolarSystemContent({ apiPlanets }) {
  return (
    <>
      <ambientLight intensity={0.35} color="#1a1a4a" />
      <hemisphereLight skyColor="#ffe8c0" groundColor="#1a2a4a" intensity={0.45} />
      <MilkyWay />
      <Sun size={PLANET_VISUAL_RADII.Sun} />
      {Object.entries(SOLAR_LAYOUT).map(([name, layout]) => (
        <OrbitingPlanet key={name} name={name} layout={layout} apiData={apiPlanets[name]} />
      ))}
    </>
  );
}

// ─── Earth Close-Up Scene ────────────────────────────────────────────────────
function EarthContent({ onEarthLoaded }) {
  return (
    <>
      <ambientLight intensity={0.08} color="#c8d8ff" />
      <directionalLight position={[5, 3, 5]}   intensity={2.4} color="#fff8e8" />
      <directionalLight position={[-4, -1, -4]} intensity={0.06} color="#2040c0" />
      <MilkyWay />
      <Suspense fallback={null}>
        <Earth onLoaded={onEarthLoaded} />
      </Suspense>
    </>
  );
}

// ─── Mode Toggle ──────────────────────────────────────────────────────────────
function ViewToggle({ mode, onToggle }) {
  return (
    <button onClick={onToggle} className="mono" style={{
      position: "fixed", top: "60px", right: "20px", zIndex: 150,
      background: "rgba(8,5,0,0.85)", border: "1px solid rgba(196,140,64,0.35)",
      borderRadius: "4px", color: "#d4944a", padding: "10px 16px",
      fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase",
      cursor: "pointer", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      transition: "all 0.25s ease",
    }}
      onMouseEnter={e => { e.currentTarget.style.background = "rgba(196,140,64,0.12)"; e.currentTarget.style.borderColor = "rgba(196,140,64,0.6)"; e.currentTarget.style.color = "#f0d4a0"; }}
      onMouseLeave={e => { e.currentTarget.style.background = "rgba(8,5,0,0.85)";      e.currentTarget.style.borderColor = "rgba(196,140,64,0.35)"; e.currentTarget.style.color = "#d4944a"; }}
    >
      {mode === "earth" ? "🌌 SOLAR SYSTEM" : "🌍 EARTH VIEW"}
    </button>
  );
}

// ─── Main Scene ───────────────────────────────────────────────────────────────
export default function Scene() {
  const [earthReady, setEarthReady] = useState(false);
  const [mode, setMode]             = useState("earth");
  const [apiPlanets, setApiPlanets] = useState({});

  useEffect(() => {
    if (mode === "solar" && Object.keys(apiPlanets).length === 0) {
      fetch("https://asteria.fastapicloud.dev/planets")
        .then(r => r.json())
        .then(d => setApiPlanets(d.planets ?? d))
        .catch(err => console.error("❌ planets fetch failed:", err));
    }
  }, [mode]);

  const cameraConfig = mode === "earth"
    ? { position: [0, EARTH_RADIUS_U * 1.2, EARTH_CAM_DISTANCE], fov: 45, near: 0.0001, far: 50_000 }
    : { position: [0, 800, 2000], fov: 60, near: 0.1, far: 50_000 };
    // ↑ far bumped to 50k — Neptune is now at ~3006 units

  const controlsConfig = mode === "earth"
    ? { minDistance: EARTH_RADIUS_U * 1.5, maxDistance: EARTH_RADIUS_U * 80, rotateSpeed: 0.45, zoomSpeed: 0.7 }
    : { minDistance: 10, maxDistance: 8000, rotateSpeed: 0.5, zoomSpeed: 1.2, minPolarAngle: 0, maxPolarAngle: Math.PI / 1.8 };

  return (
    <>
      <LoadingScreen ready={earthReady} />
      <ViewToggle mode={mode} onToggle={() => setMode(m => m === "earth" ? "solar" : "earth")} />
      <Canvas
        key={mode}
        camera={cameraConfig}
        style={{ width: "100%", height: "100%" }}
        gl={{ antialias: true, alpha: false, powerPreference: "high-performance", toneMapping: 3, toneMappingExposure: mode === "solar" ? 0.85 : 1.1 }}
        onCreated={({ gl }) => gl.setClearColor("#010205")}
      >
        {mode === "earth"
          ? <EarthContent onEarthLoaded={() => setEarthReady(true)} />
          : <SolarSystemContent apiPlanets={apiPlanets} />
        }
        <OrbitControls makeDefault enablePan={false} enableZoom dampingFactor={0.07} enableDamping {...controlsConfig} />
      </Canvas>
    </>
  );
}

import { Suspense, useState, useEffect, useRef } from "react";
import { Canvas, useFrame }                       from "@react-three/fiber";
import { OrbitControls }                    from "@react-three/drei";
import Earth                                      from "./Earth";
import Sun                                        from "./Sun";
import Planet                                     from "./Planet";
import MilkyWay                                   from "./MilkyWay";
import LoadingScreen                              from "./LoadingScreen";
import * as THREE                                 from "three";
import {
  EARTH_RADIUS_U,
  EARTH_CAM_DISTANCE,
} from "../../lib/constants/scale";


import {  Html }                   from "@react-three/drei";


// ─── Cheat-scale orbital layout (like every real visualizer) ─────────────────
// True distances compressed, planet sizes exaggerated so you can actually see them
// This is exactly what NASA Eyes, Solar System Scope, etc. all do
const SOLAR_LAYOUT = {
  Mercury: { orbitRadius: 18,  speed: 0.0048, tilt: 0.03,  size: 0.6  },
  Venus:   { orbitRadius: 28,  speed: 0.0035, tilt: 0.04,  size: 0.9  },
  Earth:   { orbitRadius: 40,  speed: 0.0029, tilt: 0.41,  size: 1.0  },
  Mars:    { orbitRadius: 55,  speed: 0.0024, tilt: 0.44,  size: 0.7  },
  Jupiter: { orbitRadius: 90,  speed: 0.0013, tilt: 0.05,  size: 3.5  },
  Saturn:  { orbitRadius: 130, speed: 0.0009, tilt: 0.47,  size: 2.8  },
  Uranus:  { orbitRadius: 170, speed: 0.0006, tilt: 1.71,  size: 1.8  },
  Neptune: { orbitRadius: 210, speed: 0.0005, tilt: 0.49,  size: 1.7  },
};

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



// ─── Orbit Ring — thicker, colored ───────────────────────────────────────────
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

function getInitialOrbitAngle(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return (hash / 0xffffffff) * Math.PI * 2;
}

function OrbitingPlanet({ name, layout, apiData }) {
  const groupRef  = useRef();
  const angleRef  = useRef(getInitialOrbitAngle(name));
  const [hovered, setHovered] = useState(false);

  useFrame((_, delta) => {
    angleRef.current += delta * layout.speed;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angleRef.current) * layout.orbitRadius;
      groupRef.current.position.z = Math.sin(angleRef.current) * layout.orbitRadius;
    }
  });

  const planetData = { name, x_km: 0, y_km: 0, z_km: 0, ...(apiData ?? {}) };

  return (
    <>
      <OrbitRing radius={layout.orbitRadius} color={ORBIT_COLORS[name] ?? '#ffffff'} />
      <group ref={groupRef}>
        {/* Invisible hit area — easier to hover than the tiny planet mesh */}
        <mesh
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'pointer'; }}
          onPointerOut ={() => {                        setHovered(false); document.body.style.cursor = 'auto';    }}
        >
          <sphereGeometry args={[layout.size * 2.5, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <Planet data={planetData} sizeOverride={layout.size} />

        {/* Hover label */}
        {hovered && (
          <Html
            center
            distanceFactor={80}
            style={{ pointerEvents: 'none' }}
          >
            <div style={{
              background:    'rgba(5,3,0,0.88)',
              border:        `1px solid ${ORBIT_COLORS[name] ?? '#ffffff'}55`,
              borderRadius:  '4px',
              padding:       '5px 12px',
              color:         ORBIT_COLORS[name] ?? '#ffffff',
              fontSize:      '11px',
              fontFamily:    'monospace',
              letterSpacing: '0.15em',
              whiteSpace:    'nowrap',
              textTransform: 'uppercase',
              boxShadow:     `0 0 12px ${ORBIT_COLORS[name] ?? '#ffffff'}33`,
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
      <ambientLight intensity={0.5} color="#1a1a4a" />   {/* ← was 0.18 */}
      <MilkyWay />
      <Sun />
      <Suspense fallback={null}>
        {Object.entries(SOLAR_LAYOUT).map(([name, layout]) => (
          <OrbitingPlanet
            key={name}
            name={name}
            layout={layout}
            apiData={apiPlanets[name]}
          />
        ))}
      </Suspense>
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
    <button
      onClick={onToggle}
      className="mono"
      style={{
        position:             "fixed",
        top:                  "60px",
        right:                "20px",
        zIndex:               150,
        background:           "rgba(8,5,0,0.85)",
        border:               "1px solid rgba(196,140,64,0.35)",
        borderRadius:         "4px",
        color:                "#d4944a",
        padding:              "10px 16px",
        fontSize:             "10px",
        letterSpacing:        "0.2em",
        textTransform:        "uppercase",
        cursor:               "pointer",
        backdropFilter:       "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition:           "all 0.25s ease",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = "rgba(196,140,64,0.12)";
        e.currentTarget.style.borderColor = "rgba(196,140,64,0.6)";
        e.currentTarget.style.color       = "#f0d4a0";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = "rgba(8,5,0,0.85)";
        e.currentTarget.style.borderColor = "rgba(196,140,64,0.35)";
        e.currentTarget.style.color       = "#d4944a";
      }}
    >
      {mode === "earth" ? "🌌 SOLAR SYSTEM" : "🌍 EARTH VIEW"}
    </button>
  );
}

// ─── Main Scene ───────────────────────────────────────────────────────────────
export default function Scene() {
  const [earthReady, setEarthReady]       = useState(false);
  const [mode, setMode]                   = useState("earth");
  const [apiPlanets, setApiPlanets]       = useState({});

  useEffect(() => {
    if (mode === "solar" && Object.keys(apiPlanets).length === 0) {
      fetch("https://asteria.fastapicloud.dev/planets")
        .then(r => r.json())
        .then(d => setApiPlanets(d.planets ?? d))
        .catch(err => console.error("❌ planets fetch failed:", err));
    }
  }, [mode]);

  const cameraConfig = mode === "earth"
    ? {
        position: [0, EARTH_RADIUS_U * 1.2, EARTH_CAM_DISTANCE],
        fov:  45,
        near: 0.0001,
        far:  50_000,
      }
    : {
        position: [0, 120, 280],   // pulled back to see full solar system
        fov:  55,
        near: 0.1,
        far:  10_000,
      };

  const controlsConfig = mode === "earth"
    ? {
        minDistance: EARTH_RADIUS_U * 1.5,
        maxDistance: EARTH_RADIUS_U * 80,
        rotateSpeed: 0.45,
        zoomSpeed:   0.7,
      }
    : {
        minDistance: 15,
        maxDistance: 600,          // Neptune orbit is at 210 units
        rotateSpeed: 0.5,
        zoomSpeed:   1.0,
      };

  return (
    <>
      <LoadingScreen ready={earthReady} />
      <ViewToggle
        mode={mode}
        onToggle={() => setMode(m => m === "earth" ? "solar" : "earth")}
      />

      <Canvas
        key={mode}
        camera={cameraConfig}
        style={{ width: "100%", height: "100%" }}
        gl={{
          antialias:           true,
          alpha:               false,
          powerPreference:     "high-performance",
          toneMapping:         3,
          toneMappingExposure: mode === "solar" ? 0.85 : 1.1,
        }}
        onCreated={({ gl }) => gl.setClearColor("#010205")}
      >
        {mode === "earth"
          ? <EarthContent onEarthLoaded={() => setEarthReady(true)} />
          : <SolarSystemContent apiPlanets={apiPlanets} />
        }
        <OrbitControls
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          dampingFactor={0.07}
          enableDamping={true}
          makeDefault
          {...controlsConfig}
        />
      </Canvas>
    </>
  );
}

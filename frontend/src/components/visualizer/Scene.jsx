import { Suspense, useState, useEffect, useRef } from "react";
import { Canvas, useFrame }                       from "@react-three/fiber";
import { OrbitControls, Html }                    from "@react-three/drei";
import { useThree }                               from "@react-three/fiber";
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

// ─── Cheat-scale orbital layout ───────────────────────────────────────────────
const SOLAR_LAYOUT = {
  Mercury: { orbitRadius: 18,  speed: 0.0048, size: 0.6  },
  Venus:   { orbitRadius: 28,  speed: 0.0035, size: 0.9  },
  Earth:   { orbitRadius: 40,  speed: 0.0029, size: 1.0  },
  Mars:    { orbitRadius: 55,  speed: 0.0024, size: 0.7  },
  Jupiter: { orbitRadius: 90,  speed: 0.0013, size: 3.5  },
  Saturn:  { orbitRadius: 130, speed: 0.0009, size: 2.8  },
  Uranus:  { orbitRadius: 170, speed: 0.0006, size: 1.8  },
  Neptune: { orbitRadius: 210, speed: 0.0005, size: 1.7  },
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

// ─── Deterministic starting angle so planets don't all start at same spot ─────
function getInitialOrbitAngle(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  }
  return (hash / 0xffffffff) * Math.PI * 2;
}

// ─── Orbiting Planet ──────────────────────────────────────────────────────────
function OrbitingPlanet({ name, layout, apiData }) {
  const groupRef = useRef();
  const angleRef = useRef(getInitialOrbitAngle(name));
  const [hovered, setHovered] = useState(false);

  // useThree gives us camera + controls so double-click can focus on this planet
  // makeDefault on OrbitControls is REQUIRED for controls to be accessible here
  const { camera, controls } = useThree();

  useFrame((_, delta) => {
    angleRef.current += delta * layout.speed;
    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angleRef.current) * layout.orbitRadius;
      groupRef.current.position.z = Math.sin(angleRef.current) * layout.orbitRadius;
    }
  });

  // Double-click → move OrbitControls target + camera to this planet
  // Without this, zoom always centers on Sun at [0,0,0]
  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (!groupRef.current || !controls) return;

    const pos = groupRef.current.position;
    const s   = layout.size;

    // Snap controls target to planet — now scroll-zoom centers on it
    controls.target.set(pos.x, pos.y, pos.z);

    // Move camera to a close orbit around the planet
    camera.position.set(
      pos.x + s * 8,
      pos.y + s * 4,
      pos.z + s * 8,
    );

    controls.update();
  };

  const planetData = { name, x_km: 0, y_km: 0, z_km: 0, ...(apiData ?? {}) };
  const color      = ORBIT_COLORS[name] ?? '#ffffff';

  return (
    <>
      <OrbitRing radius={layout.orbitRadius} color={color} />
      <group ref={groupRef}>

        {/* Invisible hit sphere — 2.5x planet size so it's easy to hover/click */}
        <mesh
          onPointerOver={(e) => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'pointer'; }}
          onPointerOut ={() => {                        setHovered(false); document.body.style.cursor = 'auto';    }}
          onDoubleClick={handleDoubleClick}
        >
          <sphereGeometry args={[layout.size * 2.5, 16, 16]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <Planet data={planetData} sizeOverride={layout.size} />

        {hovered && (
          <Html center distanceFactor={80} style={{ pointerEvents: 'none' }}>
            <div style={{
              background:    'rgba(5,3,0,0.88)',
              border:        `1px solid ${color}55`,
              borderRadius:  '4px',
              padding:       '5px 12px',
              color,
              fontSize:      '11px',
              fontFamily:    'monospace',
              letterSpacing: '0.15em',
              whiteSpace:    'nowrap',
              textTransform: 'uppercase',
              boxShadow:     `0 0 12px ${color}33`,
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
      {/*
        ambientLight: flat base so nothing is pitch black
        hemisphereLight: sky warm / ground cool — kills the harsh half-dark look
        These two together mean the dark side of a planet is dimly visible,
        not a hard black wall
      */}
      <ambientLight intensity={0.35} color="#1a1a4a" />
      <hemisphereLight
        skyColor="#ffe8c0"
        groundColor="#1a2a4a"
        intensity={0.45}
      />

      <MilkyWay />
      <Sun />

      {/*
        Each planet gets its OWN Suspense boundary with a colored dot fallback.
        Before: one Suspense wraps all 8 → nothing shows until ALL 8 textures load.
        After:  each planet shows a colored dot immediately, texture fades in when ready.
      */}
      {Object.entries(SOLAR_LAYOUT).map(([name, layout]) => (
        <Suspense
          key={name}
          fallback={
            // Glowing dot at planet's starting position while texture loads
            <mesh position={[layout.orbitRadius, 0, 0]}>
              <sphereGeometry args={[layout.size, 16, 16]} />
              <meshBasicMaterial color={ORBIT_COLORS[name] ?? '#ffffff'} />
            </mesh>
          }
        >
          <OrbitingPlanet
            name={name}
            layout={layout}
            apiData={apiPlanets[name]}
          />
        </Suspense>
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
    ? {
        position: [0, EARTH_RADIUS_U * 1.2, EARTH_CAM_DISTANCE],
        fov:  45,
        near: 0.0001,
        far:  50_000,
      }
    : {
        position: [0, 350, 80],  // top-down, slight forward tilt
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
        minDistance:   5,
        maxDistance:   700,       // beyond Neptune at 210u, room to zoom out
        rotateSpeed:   0.5,
        zoomSpeed:     1.0,
        minPolarAngle: 0,         // can go fully top-down
        maxPolarAngle: Math.PI / 1.8,  // can tilt but not flip under the plane
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

        {/*
          makeDefault is CRITICAL — without it, useThree() inside OrbitingPlanet
          can't access `controls`, so double-click focus won't work
        */}
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={true}
          enableRotate={true}
          dampingFactor={0.07}
          enableDamping={true}
          {...controlsConfig}
        />
      </Canvas>
    </>
  );
}


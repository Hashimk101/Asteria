import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Canvas, useThree }                                             from "@react-three/fiber";
import { OrbitControls, Html }                                          from "@react-three/drei";
import Earth                                                            from "./Earth";
import Sun                                                              from "./Sun";
import Planet                                                           from "./Planet";
import MilkyWay                                                         from "./MilkyWay";
import LoadingScreen                                                    from "./LoadingScreen";
import AsteroidPath                                                     from "../scene/AsteroidPath";
import * as THREE                                                       from "three";
import {
  EARTH_RADIUS_U,
  EARTH_CAM_DISTANCE,
  KM_TO_UNITS,
  ORBITAL_RADII_AU,
  AU_TO_UNITS,
  PLANET_VISUAL_RADII,
} from "../../lib/constants/scale";

// ─── Real orbital radii in Three.js units ─────────────────────────────────────
const ORBIT_RING_RADII = Object.fromEntries(
  Object.entries(ORBITAL_RADII_AU).map(([name, au]) => [name, au * AU_TO_UNITS])
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

const PLANET_RENDER_RADIUS = {
  Mercury: Math.max(PLANET_VISUAL_RADII.Mercury, 2.5),
  Venus:   Math.max(PLANET_VISUAL_RADII.Venus,   3.5),
  Earth:   Math.max(PLANET_VISUAL_RADII.Earth,   4.0),
  Mars:    Math.max(PLANET_VISUAL_RADII.Mars,     3.0),
  Jupiter: PLANET_VISUAL_RADII.Jupiter,
  Saturn:  PLANET_VISUAL_RADII.Saturn,
  Uranus:  PLANET_VISUAL_RADII.Uranus,
  Neptune: PLANET_VISUAL_RADII.Neptune,
};

// ─── Orbit Ring ───────────────────────────────────────────────────────────────
function OrbitRing({ radius, color }) {
  const geo = useMemo(() => {
    const pts = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [radius]);

  return (
    <line geometry={geo}>
      <lineBasicMaterial color={color} opacity={0.25} transparent />
    </line>
  );
}

// ─── Real-position Planet ─────────────────────────────────────────────────────
function RealPlanet({ name, apiData }) {
  const groupRef             = useRef();
  const [hovered, setHovered] = useState(false);
  const { camera, controls } = useThree();

  const position = useMemo(() => {
    if (!apiData?.x_km) return null;
    return new THREE.Vector3(
      apiData.x_km * KM_TO_UNITS,
      apiData.z_km * KM_TO_UNITS,
      apiData.y_km * KM_TO_UNITS,
    );
  }, [apiData]);

  const color  = ORBIT_COLORS[name] ?? '#ffffff';
  const radius = PLANET_RENDER_RADIUS[name] ?? 4;

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    if (!controls || !position) return;
    controls.target.copy(position);
    camera.position.set(
      position.x + radius * 8,
      position.y + radius * 4,
      position.z + radius * 8,
    );
    controls.update();
  };

  // Deterministic fallback position on the real orbit ring while API loads
  const fallbackPos = useMemo(() => {
    const r = ORBIT_RING_RADII[name] ?? 100;
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    const angle = (hash / 0xffffffff) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r);
  }, [name]);

  const pos = position ?? fallbackPos;

  return (
    <>
      <OrbitRing radius={ORBIT_RING_RADII[name] ?? 100} color={color} />
      <group ref={groupRef} position={pos}>
        <mesh
          onPointerOver={e => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'pointer'; }}
          onPointerOut={()  => { setHovered(false);  document.body.style.cursor = 'auto'; }}
          onDoubleClick={handleDoubleClick}
        >
          <sphereGeometry args={[radius * 2.5, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <Planet
          data={{ name, x_km: 0, y_km: 0, z_km: 0, ...(apiData ?? {}) }}
          sizeOverride={radius}
        />

        {hovered && (
          <Html center distanceFactor={200} style={{ pointerEvents: 'none' }}>
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

// ─── Asteroid Selector UI ─────────────────────────────────────────────────────
function AsteroidSelector({ asteroids, loadingList, selectedId, onChange, trajectoryLoading }) {
  return (
    <div style={{
      position:       'fixed',
      top:            '110px',
      right:          '20px',
      zIndex:         150,
      display:        'flex',
      flexDirection:  'column',
      gap:            '0.4rem',
      background:     'rgba(8,5,0,0.85)',
      border:         '1px solid rgba(196,140,64,0.35)',
      borderRadius:   '4px',
      padding:        '10px 14px',
      backdropFilter: 'blur(12px)',
      minWidth:       '220px',
    }}>
      <label style={{
        color: '#888', fontSize: '9px', letterSpacing: '0.2em',
        fontFamily: 'monospace', textTransform: 'uppercase',
      }}>
        Asteroid Tracker
      </label>

      <select
        value={selectedId ?? ''}
        onChange={e => onChange(e.target.value || null)}
        disabled={loadingList}
        style={{
          background:   'rgba(255,255,255,0.05)',
          color:        '#d4944a',
          border:       '1px solid rgba(196,140,64,0.25)',
          borderRadius: '3px',
          padding:      '6px 8px',
          fontSize:     '11px',
          fontFamily:   'monospace',
          cursor:       'pointer',
          outline:      'none',
          width:        '100%',
        }}
      >
        <option value="" style={{ background: '#0a0805' }}>
          {loadingList ? 'Loading...' : '— Select asteroid —'}
        </option>
        {asteroids.map(a => (
          <option key={a.spk_id} value={a.spk_id} style={{ background: '#0a0805' }}>
            {a.name}{a.is_hazardous ? ' ⚠' : ''}
          </option>
        ))}
      </select>

      {trajectoryLoading && (
        <span style={{ color: '#888', fontSize: '10px', fontFamily: 'monospace' }}>
          Fetching trajectory…
        </span>
      )}
      {selectedId && !trajectoryLoading && (
        <button
          onClick={() => onChange(null)}
          style={{
            background:    'transparent',
            color:         '#ff6b6b',
            border:        '1px solid rgba(255,107,107,0.25)',
            borderRadius:  '3px',
            padding:       '4px',
            fontSize:      '10px',
            fontFamily:    'monospace',
            cursor:        'pointer',
            letterSpacing: '0.1em',
          }}
        >
          ✕ CLEAR
        </button>
      )}
    </div>
  );
}

// ─── Locate Asteroid Button (outside Canvas) ──────────────────────────────────
// Uses imperative refs to camera + controls — no useThree needed
function LocateAsteroidButton({ vectors, cameraRef, controlRef }) {
  const handleLocate = useCallback(() => {
    if (!vectors.length || !cameraRef.current || !controlRef.current) return;

    const now = Date.now();
    let best  = 0;
    let diff  = Infinity;
    vectors.forEach((v, i) => {
      const d = Math.abs(new Date(v.datetime).getTime() - now);
      if (d < diff) { diff = d; best = i; }
    });

    const v   = vectors[best];
    const pos = new THREE.Vector3(
      v.x_km * KM_TO_UNITS,
      v.z_km * KM_TO_UNITS,
      v.y_km * KM_TO_UNITS,
    );

    // Smooth snap: set target then offset camera
    controlRef.current.target.copy(pos);
    cameraRef.current.position.set(pos.x + 25, pos.y + 12, pos.z + 25);
    controlRef.current.update();
  }, [vectors, cameraRef, controlRef]);

  if (!vectors.length) return null;

  return (
    <button
      onClick={handleLocate}
      style={{
        position:             'fixed',
        bottom:               '30px',
        right:                '20px',
        zIndex:               150,
        background:           'rgba(8,5,0,0.85)',
        border:               '1px solid rgba(68,170,255,0.4)',
        borderRadius:         '4px',
        color:                '#44aaff',
        padding:              '10px 16px',
        fontSize:             '10px',
        fontFamily:           'monospace',
        letterSpacing:        '0.2em',
        textTransform:        'uppercase',
        cursor:               'pointer',
        backdropFilter:       'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition:           'all 0.25s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = 'rgba(68,170,255,0.1)';
        e.currentTarget.style.borderColor = 'rgba(68,170,255,0.7)';
        e.currentTarget.style.color       = '#88ccff';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = 'rgba(8,5,0,0.85)';
        e.currentTarget.style.borderColor = 'rgba(68,170,255,0.4)';
        e.currentTarget.style.color       = '#44aaff';
      }}
    >
      ◎ LOCATE ASTEROID
    </button>
  );
}

// ─── Solar System Scene ───────────────────────────────────────────────────────
function SolarSystemContent({ apiPlanets, asteroidVectors, asteroidHazardous, asteroidMeta }) {
  return (
    <>
      <ambientLight intensity={0.35} color="#1a1a4a" />
      <hemisphereLight skyColor="#ffe8c0" groundColor="#1a2a4a" intensity={0.45} />
      <MilkyWay />
      <Sun />

      {Object.keys(ORBIT_RING_RADII).map(name => (
        <RealPlanet
          key={name}
          name={name}
          apiData={apiPlanets[name]}
        />
      ))}

      {asteroidVectors.length > 0 && (
        <AsteroidPath
          vectors={asteroidVectors}
          isHazardous={asteroidHazardous}
          asteroidMeta={asteroidMeta}
        />
      )}
    </>
  );
}

// ─── Earth Close-Up Scene ─────────────────────────────────────────────────────
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
      style={{
        position:             'fixed',
        top:                  '60px',
        right:                '20px',
        zIndex:               150,
        background:           'rgba(8,5,0,0.85)',
        border:               '1px solid rgba(196,140,64,0.35)',
        borderRadius:         '4px',
        color:                '#d4944a',
        padding:              '10px 16px',
        fontSize:             '10px',
        letterSpacing:        '0.2em',
        textTransform:        'uppercase',
        cursor:               'pointer',
        backdropFilter:       'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transition:           'all 0.25s ease',
        fontFamily:           'monospace',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background  = 'rgba(196,140,64,0.12)';
        e.currentTarget.style.borderColor = 'rgba(196,140,64,0.6)';
        e.currentTarget.style.color       = '#f0d4a0';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background  = 'rgba(8,5,0,0.85)';
        e.currentTarget.style.borderColor = 'rgba(196,140,64,0.35)';
        e.currentTarget.style.color       = '#d4944a';
      }}
    >
      {mode === 'earth' ? '⊙ SOLAR SYSTEM' : '◎ EARTH VIEW'}
    </button>
  );
}

// ─── Main Scene ───────────────────────────────────────────────────────────────
export default function Scene() {
  const [earthReady,          setEarthReady]         = useState(false);
  const [mode,                setMode]               = useState('earth');
  const [apiPlanets,          setApiPlanets]         = useState({});
  const [asteroidList,        setAsteroidList]       = useState([]);
  const [asteroidListLoading, setAsteroidListLoading]= useState(false);
  const [selectedAsteroidId,  setSelectedAsteroidId] = useState(null);
  const [asteroidVectors,     setAsteroidVectors]    = useState([]);
  const [asteroidMeta,        setAsteroidMeta]       = useState(null);
  const [asteroidHazardous,   setAsteroidHazardous]  = useState(false);
  const [trajectoryLoading,   setTrajectoryLoading]  = useState(false);

  // ── Imperative refs for camera control from outside Canvas ────────────────
  const cameraRef  = useRef(null);
  const controlRef = useRef(null);

  // ── Fetch planets once on solar mode entry ────────────────────────────────
  useEffect(() => {
    if (mode === 'solar' && Object.keys(apiPlanets).length === 0) {
      fetch('https://asteria.fastapicloud.dev/planets')
        .then(r => r.json())
        .then(d => setApiPlanets(d.planets ?? d))
        .catch(err => console.error('❌ planets fetch failed:', err));
    }
  }, [mode, apiPlanets]);

  // ── Fetch asteroid list once on solar mode entry ──────────────────────────
  useEffect(() => {
    if (mode !== 'solar' || asteroidList.length > 0) return;
    const loadingTimer = setTimeout(() => setAsteroidListLoading(true), 0);
    fetch('https://asteria.fastapicloud.dev/asteroids?page=1&limit=100')
      .then(r => r.json())
      .then(d => { setAsteroidList(d); setAsteroidListLoading(false); })
      .catch(()  => setAsteroidListLoading(false));
    return () => clearTimeout(loadingTimer);
  }, [mode, asteroidList.length]);

  // ── Fetch trajectory + meta when selection changes ────────────────────────
  useEffect(() => {
    if (!selectedAsteroidId) {
      const resetTimer = setTimeout(() => {
        setAsteroidVectors([]);
        setAsteroidMeta(null);
        setAsteroidHazardous(false);
        setTrajectoryLoading(false);
      }, 0);
      return () => clearTimeout(resetTimer);
    }

    let cancelled = false;
    const loadingTimer = setTimeout(() => setTrajectoryLoading(true), 0);

    Promise.all([
      fetch(`https://asteria.fastapicloud.dev/trajectory/${selectedAsteroidId}`).then(r => r.json()),
      fetch(`https://asteria.fastapicloud.dev/asteroids/${selectedAsteroidId}`).then(r => r.json()),
    ])
      .then(([traj, meta]) => {
        if (cancelled) return;
        setAsteroidVectors(traj.vectors ?? []);
        setAsteroidMeta(meta);
        setAsteroidHazardous(meta?.is_hazardous ?? false);
        setTrajectoryLoading(false);
      })
      .catch(() => { if (!cancelled) setTrajectoryLoading(false); });

    return () => {
      cancelled = true;
      clearTimeout(loadingTimer);
    };
  }, [selectedAsteroidId]);            // ← asteroidList removed from deps (not needed)

  // ── Camera configs ────────────────────────────────────────────────────────
  const cameraConfig = mode === 'earth'
    ? { position: [0, EARTH_RADIUS_U * 1.2, EARTH_CAM_DISTANCE], fov: 45, near: 0.0001, far: 50_000 }
    : { position: [0, 600, 1200], fov: 60, near: 0.5, far: 15_000 };

  const controlsConfig = mode === 'earth'
    ? { minDistance: EARTH_RADIUS_U * 1.5, maxDistance: EARTH_RADIUS_U * 80, rotateSpeed: 0.45, zoomSpeed: 0.7 }
    : { minDistance: 8, maxDistance: 8000, rotateSpeed: 0.5, zoomSpeed: 1.2, minPolarAngle: 0, maxPolarAngle: Math.PI / 1.8 };

  return (
    <>
      <LoadingScreen ready={earthReady} />

      <ViewToggle
        mode={mode}
        onToggle={() => setMode(m => m === 'earth' ? 'solar' : 'earth')}
      />

      {mode === 'solar' && (
        <AsteroidSelector
          asteroids={asteroidList}
          loadingList={asteroidListLoading}
          selectedId={selectedAsteroidId}
          trajectoryLoading={trajectoryLoading}
          onChange={setSelectedAsteroidId}
        />
      )}

      {/* Locate button — outside Canvas, uses imperative cameraRef/controlRef */}
      {mode === 'solar' && (
        <LocateAsteroidButton
          vectors={asteroidVectors}
          cameraRef={cameraRef}
          controlRef={controlRef}
        />
      )}

      <Canvas
        key={mode}
        camera={cameraConfig}
        style={{ width: '100%', height: '100%' }}
        gl={{
          antialias:              true,
          alpha:                  false,
          powerPreference:        'high-performance',
          toneMapping:            3,
          toneMappingExposure:    mode === 'solar' ? 0.85 : 1.1,
          logarithmicDepthBuffer: mode === 'solar',
        }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor('#010205');
          cameraRef.current = camera;   // ← grab camera imperatively
        }}
      >
        {mode === 'earth'
          ? <EarthContent onEarthLoaded={() => setEarthReady(true)} />
          : <SolarSystemContent
              apiPlanets={apiPlanets}
              asteroidVectors={asteroidVectors}
              asteroidHazardous={asteroidHazardous}
              asteroidMeta={asteroidMeta}
            />
        }

        <OrbitControls
          ref={controlRef}             // ← grab controls imperatively
          makeDefault
          enablePan={true}
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

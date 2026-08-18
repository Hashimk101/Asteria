import { Suspense, useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Canvas, useThree }                                             from "@react-three/fiber";
import { OrbitControls, Html }                                          from "@react-three/drei";
import Earth                                                            from "./Earth";
import Sun                                                              from "./Sun";
import Planet                                                           from "./Planet";
import MilkyWay                                                         from "./MilkyWay";
import LoadingScreen                                                    from "./LoadingScreen";
import AsteroidPath                                                     from "../scene/AsteroidPath";
import EarthAsteroidPath                                                from "../scene/EarthAsteroidPath";
import * as THREE                                                       from "three";
import {
  EARTH_RADIUS_U,
  EARTH_CAM_DISTANCE,
  KM_TO_UNITS,
  ORBITAL_RADII_AU,
  AU_TO_UNITS,
  PLANET_VISUAL_RADII,
  toEarthRelVec3,
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

// Sun visual radius ≈ 20.9 units. Outer planets capped well BELOW the Sun.
// Real Sun:Jupiter diameter ratio ≈ 5:1 → at Sun=20.9u, Jupiter≈4.2u realistic.
// We use Jupiter=10u for visibility while keeping it clearly smaller than Sun.
const BASE_SCALE = PLANET_VISUAL_RADII.Earth; // ~6.4 units = 1 Earth radius
const PLANET_RENDER_RADIUS = {
  Mercury: Math.max(PLANET_VISUAL_RADII.Mercury, BASE_SCALE * 0.50),  // boosted min for clickability
  Venus:   Math.max(PLANET_VISUAL_RADII.Venus,   BASE_SCALE * 0.95),  // real: 0.95×
  Earth:   BASE_SCALE,                                                 // 1×
  Mars:    Math.max(PLANET_VISUAL_RADII.Mars,     BASE_SCALE * 0.60),  // boosted min for clickability
  // Gas giants — proportions preserved between them, all smaller than Sun (20.9u)
  Jupiter: 10,   // biggest planet — ~48% of Sun radius
  Saturn:   8,   // real: ~84% of Jupiter
  Uranus:   5,   // real: ~46% of Jupiter
  Neptune:  4.5, // real: ~44% of Jupiter
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
  const groupRef              = useRef();
  const [hovered,  setHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const { camera, controls }  = useThree();

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

  // ── Deterministic fallback position while API loads ──────────────────────
  const fallbackPos = useMemo(() => {
    const r = ORBIT_RING_RADII[name] ?? 100;
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    const angle = (hash / 0xffffffff) * Math.PI * 2;
    return new THREE.Vector3(Math.cos(angle) * r, 0, Math.sin(angle) * r);
  }, [name]);

  const pos = position ?? fallbackPos;

  // ── Camera actions ────────────────────────────────────────────────────────
  const focusOnPlanet = useCallback(() => {
    if (!controls) return;
    controls.target.copy(pos);
    camera.position.set(
      pos.x + radius * 8,
      pos.y + radius * 5,
      pos.z + radius * 8,
    );
    controls.update();
    setShowMenu(false);
  }, [camera, controls, pos, radius]);

  const viewFromPlanet = useCallback(() => {
    if (!controls) return;
    // Direction from Sun to this planet (outward radial)
    const outward = pos.clone().normalize();
    // Camera sits just outside the planet, offset slightly above the ecliptic
    const camPos = pos.clone()
      .add(outward.clone().multiplyScalar(radius * 6))
      .add(new THREE.Vector3(0, radius * 2, 0));
    // Look slightly past the Sun so the inner solar system is framed nicely
    const lookAt = new THREE.Vector3(0, 0, 0);
    camera.position.copy(camPos);
    controls.target.copy(lookAt);
    controls.update();
    setShowMenu(false);
  }, [camera, controls, pos, radius]);

  const handleDoubleClick = useCallback((e) => {
    e.stopPropagation();
    setShowMenu(s => !s);
  }, []);

  // Close menu when clicking empty space
  const handleBackgroundClick = useCallback(() => setShowMenu(false), []);

  return (
    <>
      <OrbitRing radius={ORBIT_RING_RADII[name] ?? 100} color={color} />
      <group ref={groupRef} position={pos}>

        {/* Invisible hit area (larger than planet for easy clicking) */}
        <mesh
          onPointerOver={e => { e.stopPropagation(); setHovered(true);  document.body.style.cursor = 'pointer'; }}
          onPointerOut={()  => { setHovered(false);  document.body.style.cursor = 'auto'; }}
          onDoubleClick={handleDoubleClick}
          onClick={e => { e.stopPropagation(); if (showMenu) setShowMenu(false); }}
        >
          <sphereGeometry args={[radius * 2.5, 8, 8]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>

        <Planet
          data={{ name, x_km: 0, y_km: 0, z_km: 0, ...(apiData ?? {}) }}
          sizeOverride={radius}
        />

        {/* Hover name tag */}
        {hovered && !showMenu && (
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
              {name} · double-click for options
            </div>
          </Html>
        )}

        {/* Double-click context menu */}
        {showMenu && (
          <Html
            center
            distanceFactor={200}
            position={[0, radius * 2.5, 0]}
            zIndexRange={[200, 0]}
          >
            <div style={{
              background:    'rgba(6,4,1,0.96)',
              border:        `1px solid ${color}66`,
              borderRadius:  '6px',
              padding:       '10px 12px',
              fontFamily:    'monospace',
              minWidth:      '170px',
              boxShadow:     `0 0 20px ${color}22, 0 4px 20px rgba(0,0,0,0.8)`,
              userSelect:    'none',
            }}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ color, fontSize: '11px', letterSpacing: '0.18em', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  {name}
                </span>
                <button
                  onClick={() => setShowMenu(false)}
                  style={{
                    background: 'transparent', border: '1px solid #333', borderRadius: '3px',
                    color: '#666', cursor: 'pointer', fontSize: '9px', padding: '1px 5px',
                    fontFamily: 'monospace', lineHeight: '1.4', flexShrink: 0, marginLeft: '8px',
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
                  onMouseLeave={e => e.currentTarget.style.color = '#666'}
                >✕</button>
              </div>

              <div style={{ borderTop: `1px solid ${color}22`, marginBottom: '8px' }} />

              {/* Focus button */}
              <button
                onClick={focusOnPlanet}
                style={{
                  display:       'block',
                  width:         '100%',
                  marginBottom:  '6px',
                  background:    `${color}12`,
                  border:        `1px solid ${color}44`,
                  borderRadius:  '4px',
                  color:         color,
                  padding:       '6px 10px',
                  fontSize:      '10px',
                  fontFamily:    'monospace',
                  letterSpacing: '0.12em',
                  cursor:        'pointer',
                  textAlign:     'left',
                  transition:    'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${color}28`}
                onMouseLeave={e => e.currentTarget.style.background = `${color}12`}
              >
                ⊙ FOCUS CAMERA
              </button>

              {/* View From Planet button */}
              <button
                onClick={viewFromPlanet}
                style={{
                  display:       'block',
                  width:         '100%',
                  background:    'rgba(255,255,255,0.04)',
                  border:        '1px solid rgba(255,255,255,0.15)',
                  borderRadius:  '4px',
                  color:         '#c8c8c8',
                  padding:       '6px 10px',
                  fontSize:      '10px',
                  fontFamily:    'monospace',
                  letterSpacing: '0.12em',
                  cursor:        'pointer',
                  textAlign:     'left',
                  transition:    'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.10)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
              >
                {"[>] VIEW FROM HERE"}
              </button>
            </div>
          </Html>
        )}
      </group>
    </>
  );
}


// ─── Asteroid Selector UI ─────────────────────────────────────────────────────
function AsteroidSelector({ asteroids, loadingList, selectedId, onChange, trajectoryLoading, mode }) {
  const isEarth = mode === 'earth';
  const [collapsed, setCollapsed] = useState(false);

  const icon = isEarth ? '◎' : '☉';
  const label = isEarth ? 'EARTH-VIEW TRACKER' : 'SOLAR TRACKER';

  // ── Collapsed: show a small icon button only ──────────────────────────────
  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        title={label}
        style={{
          position:             'fixed',
          top:                  '110px',
          right:                '20px',
          zIndex:               150,
          background:           'rgba(8,5,0,0.85)',
          border:               '1px solid rgba(196,140,64,0.35)',
          borderRadius:         '4px',
          color:                '#d4944a',
          padding:              '10px 14px',
          fontSize:             '13px',
          fontFamily:           'monospace',
          letterSpacing:        '0.1em',
          cursor:               'pointer',
          backdropFilter:       'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          transition:           'all 0.25s ease',
          display:              'flex',
          alignItems:           'center',
          gap:                  '6px',
          whiteSpace:           'nowrap',
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
        {icon}
        {selectedId && <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#d4944a', flexShrink: 0 }} />}
      </button>
    );
  }

  // ── Expanded panel ────────────────────────────────────────────────────────
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
      {/* Header row with label + collapse button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <label style={{
          color: '#c8a870', fontSize: '9px', letterSpacing: '0.2em',
          fontFamily: 'monospace', textTransform: 'uppercase', cursor: 'default',
        }}>
          {icon} {isEarth ? 'Earth-View Tracker' : 'Solar Tracker'}
        </label>
        <button
          onClick={() => setCollapsed(true)}
          title="Collapse"
          style={{
            background:    'transparent',
            border:        '1px solid rgba(196,140,64,0.25)',
            borderRadius:  '3px',
            color:         '#888',
            cursor:        'pointer',
            fontSize:      '9px',
            fontFamily:    'monospace',
            lineHeight:    '1.4',
            padding:       '1px 5px',
            flexShrink:    0,
            marginLeft:    '8px',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#d4944a'}
          onMouseLeave={e => e.currentTarget.style.color = '#888'}
        >−</button>
      </div>

      {isEarth && (
        <span style={{ color: '#5a7a5a', fontSize: '8px', fontFamily: 'monospace', letterSpacing: '0.1em' }}>
          Blue ring = Lunar distance
        </span>
      )}

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
            {a.name}{a.is_hazardous ? ' [!]' : ''}
          </option>
        ))}
      </select>

      {trajectoryLoading && (
        <span style={{ color: '#a08050', fontSize: '10px', fontFamily: 'monospace' }}>
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
function LocateAsteroidButton({ vectors, cameraRef, controlRef, earthMode, earthPos }) {
  const handleLocate = useCallback(() => {
    if (!vectors.length || !cameraRef.current || !controlRef.current) return;

    const now = Date.now();
    let best  = 0;
    let diff  = Infinity;
    vectors.forEach((v, i) => {
      const d = Math.abs(new Date(v.datetime).getTime() - now);
      if (d < diff) { diff = d; best = i; }
    });

    const v = vectors[best];
    let pos;

    if (earthMode) {
      pos = toEarthRelVec3(v, earthPos);
      const dist = pos.length();
      
      // Focus target at the midpoint between Earth (0,0,0) and the Asteroid (pos)
      // so both Earth and the Asteroid remain centered in the view
      const midpoint = pos.clone().multiplyScalar(0.45);
      
      const dir = pos.clone().normalize();
      const sideVec = new THREE.Vector3(-dir.z, 0.4, dir.x).normalize();
      
      const camDist = Math.max(dist * 0.95, 32);
      const camPos = midpoint.clone()
        .add(sideVec.multiplyScalar(camDist))
        .add(new THREE.Vector3(0, Math.max(dist * 0.35, 12), 0));

      controlRef.current.target.copy(midpoint);
      cameraRef.current.position.copy(camPos);
    } else {
      pos = new THREE.Vector3(
        v.x_km * KM_TO_UNITS,
        v.z_km * KM_TO_UNITS,
        v.y_km * KM_TO_UNITS,
      );
      controlRef.current.target.copy(pos);
      cameraRef.current.position.set(pos.x + 25, pos.y + 12, pos.z + 25);
    }
    controlRef.current.update();
  }, [vectors, cameraRef, controlRef, earthMode, earthPos]);

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
function EarthContent({ onEarthLoaded, asteroidVectors, asteroidMeta, asteroidHazardous, earthPos }) {
  return (
    <>
      <ambientLight intensity={0.35} color="#c8d8ff" />
      <hemisphereLight skyColor="#ffffff" groundColor="#0c1525" intensity={0.4} />
      <directionalLight position={[10, 8, 10]} intensity={2.6} color="#fff8e8" />
      <directionalLight position={[-10, -5, -10]} intensity={0.2} color="#2040c0" />
      <MilkyWay />
      <Suspense fallback={null}>
        <Earth onLoaded={onEarthLoaded} />
      </Suspense>
      {asteroidVectors.length > 0 && (
        <EarthAsteroidPath
          vectors={asteroidVectors}
          isHazardous={asteroidHazardous}
          asteroidMeta={asteroidMeta}
          earthPosKm={earthPos}
        />
      )}
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
  const [earthPos,            setEarthPos]           = useState(null); // heliocentric km
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

  // ── Fetch planets (both modes need Earth position) ────────────────────────
  useEffect(() => {
    if (Object.keys(apiPlanets).length === 0) {
      fetch('https://asteria.fastapicloud.dev/planets')
        .then(r => r.json())
        .then(d => {
          const planets = d.planets ?? d;
          setApiPlanets(planets);
          // Cache Earth's trajectory array for Earth-relative asteroid math
          if (planets.Earth) {
            setEarthPos(Array.isArray(planets.Earth) ? planets.Earth : [planets.Earth]);
          }
        })
        .catch(err => console.error('❌ planets fetch failed:', err));
    }
  }, [apiPlanets]);

  // ── Fetch asteroid list once (shared between both modes) ──────────────────
  useEffect(() => {
    if (asteroidList.length > 0) return;
    const loadingTimer = setTimeout(() => setAsteroidListLoading(true), 0);
    fetch('https://asteria.fastapicloud.dev/asteroids?page=1&limit=100')
      .then(r => r.json())
      .then(d => {
        // Deduplicate by spk_id — API occasionally returns the same asteroid twice
        const seen = new Set();
        const unique = (Array.isArray(d) ? d : []).filter(a => {
          if (seen.has(a.spk_id)) return false;
          seen.add(a.spk_id);
          return true;
        });
        setAsteroidList(unique);
        setAsteroidListLoading(false);
      })
      .catch(()  => setAsteroidListLoading(false));
    return () => clearTimeout(loadingTimer);
  }, [asteroidList.length]);

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
  // Solar mode: start zoomed in on inner solar system (Earth region focus).
  // Earth orbit = 100u, Mars = 152u, Jupiter = 520u.
  // Camera at z=400 shows Mercury→Mars comfortably; user can zoom out to Jupiter+.
  const cameraConfig = mode === 'earth'
    ? { position: [0, EARTH_RADIUS_U * 1.2, EARTH_CAM_DISTANCE], fov: 45, near: 0.1, far: 500_000 }
    : { position: [0, 200, 400], fov: 55, near: 0.5, far: 12_000 };

  const controlsConfig = mode === 'earth'
    ? { minDistance: EARTH_RADIUS_U * 1.5, maxDistance: EARTH_RADIUS_U * 20_000, rotateSpeed: 0.45, zoomSpeed: 0.7 }
    : { minDistance: 8, maxDistance: 6000, rotateSpeed: 0.5, zoomSpeed: 1.0, minPolarAngle: 0, maxPolarAngle: Math.PI / 1.8 };

  return (
    <>
      <LoadingScreen ready={earthReady} />

      <ViewToggle
        mode={mode}
        onToggle={() => setMode(m => m === 'earth' ? 'solar' : 'earth')}
      />

      {/* Asteroid selector — visible in BOTH modes */}
      <AsteroidSelector
        asteroids={asteroidList}
        loadingList={asteroidListLoading}
        selectedId={selectedAsteroidId}
        trajectoryLoading={trajectoryLoading}
        onChange={setSelectedAsteroidId}
        mode={mode}
      />

      {/* Locate button — outside Canvas, uses imperative cameraRef/controlRef */}
      <LocateAsteroidButton
        vectors={asteroidVectors}
        cameraRef={cameraRef}
        controlRef={controlRef}
        earthMode={mode === 'earth'}
        earthPos={earthPos}
      />

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
          logarithmicDepthBuffer: true,
        }}
        onCreated={({ gl, camera }) => {
          gl.setClearColor('#010205');
          cameraRef.current = camera;   // ← grab camera imperatively
        }}
      >
        {mode === 'earth'
          ? <EarthContent
              onEarthLoaded={() => setEarthReady(true)}
              asteroidVectors={asteroidVectors}
              asteroidMeta={asteroidMeta}
              asteroidHazardous={asteroidHazardous}
              earthPos={earthPos}
            />
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

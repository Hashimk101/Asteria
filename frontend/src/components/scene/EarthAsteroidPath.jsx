import { useMemo, useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import { EARTH_RADIUS_U, LD_RING_RADIUS, toEarthRelVec3 } from '../../lib/constants/scale.js';

function interpolatePosition(vectors, pts, nowMs) {
  if (!vectors.length) return null;
  for (let i = 0; i < vectors.length - 1; i++) {
    const t0 = new Date(vectors[i].datetime).getTime();
    const t1 = new Date(vectors[i + 1].datetime).getTime();
    if (nowMs >= t0 && nowMs <= t1) {
      const frac = (nowMs - t0) / (t1 - t0);
      return new THREE.Vector3().lerpVectors(pts[i], pts[i + 1], frac);
    }
  }
  const firstT = new Date(vectors[0].datetime).getTime();
  return nowMs < firstT ? pts[0] : pts[pts.length - 1];
}

// ─── Procedural rocky texture ─────────────────────────────────────────────────
function useAsteroidTexture() {
  return useMemo(() => {
    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#3a3530';
    ctx.fillRect(0, 0, size, size);
    let s = 42;
    const rand = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    for (let i = 0; i < 2400; i++) {
      const x = rand() * size, y = rand() * size, r = rand() * 18 + 2;
      const l = Math.floor(rand() * 60 + 28), a = rand() * 0.35 + 0.08;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${l + 10},${l},${l - 8},${a})`; ctx.fill();
    }
    for (let i = 0; i < 18; i++) {
      const x = rand() * size, y = rand() * size, r = rand() * 22 + 6;
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0, 'rgba(20,18,15,0.55)');
      grd.addColorStop(0.7, 'rgba(60,55,48,0.18)');
      grd.addColorStop(1, 'rgba(80,74,65,0.0)');
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grd; ctx.fill();
    }
    return new THREE.CanvasTexture(canvas);
  }, []);
}

// ─── Irregular asteroid geometry ──────────────────────────────────────────────
function useIrregularGeometry(radius) {
  return useMemo(() => {
    const geo = new THREE.SphereGeometry(radius, 32, 32);
    const pos = geo.attributes.position;
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const sx = 1.0 + (rand() - 0.5) * 0.55;
      const sy = 1.0 + (rand() - 0.5) * 0.40;
      const sz = 1.0 + (rand() - 0.5) * 0.45;
      const n = 1.0 + (rand() - 0.5) * 0.28;
      pos.setXYZ(i, x * sx * n, y * sy * n, z * sz * n);
    }
    geo.computeVertexNormals();
    return geo;
  }, [radius]);
}

// ─── Trajectory Tube ──────────────────────────────────────────────────────────
function TrajectoryTube({ pts, color }) {
  const geometry = useMemo(() => {
    if (pts.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(curve, pts.length * 2, 0.38, 8, false);
  }, [pts]);

  if (!geometry) return null;
  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial color={color} transparent opacity={0.75} depthWrite={false} />
    </mesh>
  );
}

// ─── Lunar Distance Reference Ring ────────────────────────────────────────────
// Radius = LD_RING_RADIUS (25 units = 1 Lunar Distance = 384,400 km)
function LunarDistanceRing() {
  const geo = useMemo(() => {
    const r = LD_RING_RADIUS;
    const pts = [];
    for (let i = 0; i <= 256; i++) {
      const a = (i / 256) * Math.PI * 2;
      pts.push(new THREE.Vector3(Math.cos(a) * r, 0, Math.sin(a) * r));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  return (
    <group>
      {/* Primary bright cyan line */}
      <line geometry={geo}>
        <lineBasicMaterial color="#00e5ff" opacity={0.7} transparent />
      </line>

      {/* Translucent glow ring plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[LD_RING_RADIUS - 0.3, LD_RING_RADIUS + 0.3, 128]} />
        <meshBasicMaterial color="#00e5ff" opacity={0.25} transparent side={THREE.DoubleSide} depthWrite={false} />
      </mesh>

      {/* 3D Moon sphere marker positioned on the ring (Physically scaled to 27.27% of Earth's radius) */}
      <group position={[LD_RING_RADIUS, 0, 0]}>
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS_U * (1737.4 / 6371), 32, 32]} />
          <meshStandardMaterial color="#d0d5dd" roughness={0.88} metalness={0.08} />
        </mesh>

        {/* Subtle cyan glow aura around Moon */}
        <mesh>
          <sphereGeometry args={[EARTH_RADIUS_U * (1737.4 / 6371) * 1.5, 16, 16]} />
          <meshBasicMaterial color="#00e5ff" transparent opacity={0.12} depthWrite={false} />
        </mesh>

        <Html distanceFactor={140} position={[0, EARTH_RADIUS_U * (1737.4 / 6371) + 1.2, 0]} center style={{ pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0, 20, 35, 0.88)',
            border: '1px solid rgba(0, 229, 255, 0.55)',
            borderRadius: '4px',
            padding: '3px 8px',
            color: '#00e5ff',
            fontSize: '9px',
            fontFamily: 'monospace',
            letterSpacing: '0.1em',
            whiteSpace: 'nowrap',
            boxShadow: '0 0 12px rgba(0,229,255,0.4)',
          }}>
            MOON (1 LD / 384,400 km)
          </div>
        </Html>
      </group>
    </group>
  );
}

// ─── Info Panel ───────────────────────────────────────────────────────────────
function EarthInfoPanel({ meta, isHazardous, onClose, currentPos }) {
  const color = isHazardous ? '#ff4444' : '#44aaff';

  // Inverse scale mapping: r_units -> km
  const distUnits = currentPos ? currentPos.length() : null;
  const distKm = distUnits != null ? 384400 * Math.pow(distUnits / LD_RING_RADIUS, 2.5) : null;
  const distLD = distKm != null ? (distKm / 384400).toFixed(2) : null;

  const dMinKm = meta?.estimated_diameter_min_m != null ? (meta.estimated_diameter_min_m / 1000).toFixed(3) : null;
  const dMaxKm = meta?.estimated_diameter_max_m != null ? (meta.estimated_diameter_max_m / 1000).toFixed(3) : null;
  const sizeStr = dMinKm && dMaxKm ? `${dMinKm} – ${dMaxKm} km` : '—';

  const approach = meta?.close_approaches?.[0];

  return (
    <div style={{
      background: 'rgba(4,3,2,0.94)',
      border: `1px solid ${color}44`,
      borderRadius: '8px',
      padding: '14px 16px',
      color: '#c8c8c8',
      fontSize: '10px',
      fontFamily: 'monospace',
      letterSpacing: '0.07em',
      minWidth: '240px',
      maxWidth: '280px',
      boxShadow: `0 0 28px ${color}18, 0 4px 24px rgba(0,0,0,0.7)`,
      lineHeight: '1.75',
      pointerEvents: 'all',
      userSelect: 'none',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ color, fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.12em' }}>
            {isHazardous ? '⚠ ' : '◉ '}{meta?.name ?? 'ASTEROID'}
          </div>
          <div style={{ color: '#444', fontSize: '9px', marginTop: '2px' }}>
            {meta?.orbit_class_name ?? ''} · SPK {meta?.spk_id ?? '—'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{ background: 'transparent', border: '1px solid #333', borderRadius: '3px', color: '#666', cursor: 'pointer', fontSize: '10px', padding: '1px 6px', fontFamily: 'monospace', lineHeight: '1.4', flexShrink: 0, marginLeft: '8px' }}
          onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
          onMouseLeave={e => e.currentTarget.style.color = '#666'}
        >✕</button>
      </div>

      <div style={{ borderTop: `1px solid ${color}18`, margin: '8px 0' }} />

      {distKm && (
        <>
          <div style={{ color: '#3d3d3d', fontSize: '8px', letterSpacing: '0.2em', marginBottom: '3px' }}>DISTANCE FROM EARTH</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: '#4a4a4a' }}>DISTANCE</span>
            <span style={{ color }}>{Math.round(distKm).toLocaleString()} km</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: '#4a4a4a' }}>LUNAR DIST</span>
            <span style={{ color: Number(distLD) < 1 ? '#ff6644' : '#888' }}>{distLD} LD</span>
          </div>
          <div style={{ borderTop: `1px solid ${color}18`, margin: '8px 0' }} />
        </>
      )}

      <div style={{ color: '#3d3d3d', fontSize: '8px', letterSpacing: '0.2em', marginBottom: '3px' }}>PHYSICAL</div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ color: '#4a4a4a' }}>DIAMETER</span>
        <span style={{ color }}>{sizeStr}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ color: '#4a4a4a' }}>HAZARDOUS</span>
        <span style={{ color: isHazardous ? '#ff4444' : '#44ff88' }}>{isHazardous ? 'YES' : 'NO'}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
        <span style={{ color: '#4a4a4a' }}>MOID</span>
        <span style={{ color: meta?.moid_au < 0.05 ? '#ffaa44' : '#d4944a' }}>
          {meta?.moid_au != null ? `${meta.moid_au} AU` : '—'}
        </span>
      </div>

      {approach && (
        <>
          <div style={{ borderTop: `1px solid ${color}18`, margin: '8px 0' }} />
          <div style={{ color: '#3d3d3d', fontSize: '8px', letterSpacing: '0.2em', marginBottom: '3px' }}>CLOSE APPROACH</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: '#4a4a4a' }}>DATE</span>
            <span style={{ color }}>{approach.date_full ?? approach.date}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: '#4a4a4a' }}>MISS DIST</span>
            <span style={{ color: '#d4944a' }}>{(approach.miss_distance_km / 1e6).toFixed(3)} M km</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
            <span style={{ color: '#4a4a4a' }}>VELOCITY</span>
            <span style={{ color: '#d4944a' }}>{Number(approach.relative_velocity_km_s).toFixed(2)} km/s</span>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function EarthAsteroidPath({ vectors, isHazardous, asteroidMeta, earthPosKm }) {
  const bodyRef = useRef();
  const posRef = useRef(null);
  const [selected, setSelected] = useState(false);
  const [panelPos, setPanelPos] = useState(null);
  const [startHovered, setStartHovered] = useState(false);
  const [endHovered, setEndHovered] = useState(false);

  const color = isHazardous ? '#ff4444' : '#44aaff';
  const texture = useAsteroidTexture();

  const asteroidRadius = useMemo(() => {
    const minM = asteroidMeta?.estimated_diameter_min_m;
    const maxM = asteroidMeta?.estimated_diameter_max_m;
    if (minM != null && maxM != null) {
      const meanKm = ((minM + maxM) / 2) / 1000;
      return Math.max(meanKm * 2.5, 1.8);
    }
    return 2.2;
  }, [asteroidMeta]);

  const irregularGeo = useIrregularGeometry(asteroidRadius);

  const pts = useMemo(() => {
    if (!vectors.length) return [];
    return vectors.map(v => toEarthRelVec3(v, earthPosKm));
  }, [vectors, earthPosKm]);

  // ── useFrame: only mutates Three.js objects — NO React state updates ──────
  useFrame(() => {
    if (!pts.length || !bodyRef.current) return;
    const pos = interpolatePosition(vectors, pts, Date.now());
    if (!pos) return;
    bodyRef.current.position.copy(pos); // imperative — zero re-renders
    posRef.current = pos;               // store for click handler
  });

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (posRef.current) setPanelPos(posRef.current.clone()); // snapshot on click only
    setSelected(s => !s);
  }, []);

  const startDateStr = useMemo(() => {
    if (!vectors[0]?.datetime) return null;
    return new Date(vectors[0].datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [vectors]);

  const endDateStr = useMemo(() => {
    if (!vectors[vectors.length - 1]?.datetime) return null;
    return new Date(vectors[vectors.length - 1].datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }, [vectors]);

  if (!pts.length) return null;

  return (
    <group>
      <LunarDistanceRing />
      <TrajectoryTube pts={pts} color={color} />

      {/* ── Start Marker (Hover to view tag) ──────────────────────── */}
      {pts.length > 0 && (
        <group
          position={pts[0]}
          onPointerOver={e => { e.stopPropagation(); setStartHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setStartHovered(false); document.body.style.cursor = 'auto'; }}
        >
          {/* Hit area */}
          <mesh>
            <sphereGeometry args={[asteroidRadius * 1.5, 12, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[asteroidRadius * 0.7, 16, 16]} />
            <meshBasicMaterial color="#00ffaa" transparent opacity={startHovered ? 0.95 : 0.6} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[asteroidRadius * 0.35, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          {startHovered && (
            <Html position={[0, asteroidRadius * 1.8, 0]} center distanceFactor={110} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(0, 35, 20, 0.94)',
                border: '1px solid #00ffaa',
                borderRadius: '4px',
                padding: '3px 8px',
                color: '#00ffaa',
                fontSize: '9px',
                fontFamily: 'monospace',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 14px rgba(0,255,170,0.6)',
              }}>
                ▶ START {startDateStr ? `· ${startDateStr}` : ''}
              </div>
            </Html>
          )}
        </group>
      )}

      {/* ── End Marker (Hover to view tag) ────────────────────────── */}
      {pts.length > 1 && (
        <group
          position={pts[pts.length - 1]}
          onPointerOver={e => { e.stopPropagation(); setEndHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={() => { setEndHovered(false); document.body.style.cursor = 'auto'; }}
        >
          {/* Hit area */}
          <mesh>
            <sphereGeometry args={[asteroidRadius * 1.5, 12, 12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[asteroidRadius * 0.7, 16, 16]} />
            <meshBasicMaterial color="#ff6644" transparent opacity={endHovered ? 0.95 : 0.6} depthWrite={false} />
          </mesh>
          <mesh>
            <sphereGeometry args={[asteroidRadius * 0.35, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>

          {endHovered && (
            <Html position={[0, asteroidRadius * 1.8, 0]} center distanceFactor={110} style={{ pointerEvents: 'none' }}>
              <div style={{
                background: 'rgba(40, 12, 8, 0.94)',
                border: '1px solid #ff6644',
                borderRadius: '4px',
                padding: '3px 8px',
                color: '#ff6644',
                fontSize: '9px',
                fontFamily: 'monospace',
                letterSpacing: '0.08em',
                whiteSpace: 'nowrap',
                boxShadow: '0 0 14px rgba(255,102,68,0.6)',
              }}>
                ⏹ END {endDateStr ? `· ${endDateStr}` : ''}
              </div>
            </Html>
          )}
        </group>
      )}

      {/* Animated asteroid body — moved by useFrame imperatively */}
      <group ref={bodyRef} onClick={handleClick}>
        <mesh geometry={irregularGeo}>
          <meshStandardMaterial
            map={texture}
            roughness={0.88}
            metalness={0.12}
            color={isHazardous ? '#ff9988' : '#b0a898'}
          />
        </mesh>
        {/* Glow */}
        <mesh>
          <sphereGeometry args={[asteroidRadius * 2.8, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.09} depthWrite={false} />
        </mesh>
      </group>

      {/* Floating info panel — only renders when user has clicked */}
      {selected && panelPos && (
        <Html
          position={[panelPos.x, panelPos.y + asteroidRadius * 8, panelPos.z]}
          center
          distanceFactor={80}
          zIndexRange={[100, 0]}
        >
          <EarthInfoPanel
            meta={asteroidMeta}
            isHazardous={isHazardous}
            onClose={() => setSelected(false)}
            currentPos={panelPos}
          />
        </Html>
      )}
    </group>
  );
}

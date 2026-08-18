import { useMemo, useRef, useState, useCallback } from 'react';
import { useFrame }                                from '@react-three/fiber';
import { Html }                                    from '@react-three/drei';
import * as THREE                                  from 'three';
import { KM_TO_UNITS, AU_TO_UNITS }                from '../../lib/constants/scale.js';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function toVec3(v) {
  return new THREE.Vector3(
    v.x_km * KM_TO_UNITS,
    v.z_km * KM_TO_UNITS,
    v.y_km * KM_TO_UNITS,
  );
}
// ─── At the top, add this helper ──────────────────────────────────────────────
function AsteroidTrail({ pts, color }) {
  const geometry = useMemo(() => {
    if (pts.length < 2) return null;
    const curve = new THREE.CatmullRomCurve3(pts);
    return new THREE.TubeGeometry(
      curve,   // path
      pts.length * 2,  // tubular segments — more = smoother
      0.4,     // ← THICKNESS — increase this to make it fatter (try 0.4–1.5)
      6,       // radial segments — 6 is fine for a thin tube
      false    // closed
    );
  }, [pts]);

  if (!geometry) return null;

  return (
    <mesh geometry={geometry}>
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.65}
        depthWrite={false}
      />
    </mesh>
  );
}

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
    const size   = 256;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = size;
    const ctx  = canvas.getContext('2d');

    ctx.fillStyle = '#3a3530';
    ctx.fillRect(0, 0, size, size);

    const rng = (seed) => {
      let s = seed;
      return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
    };
    const rand = rng(42);

    for (let i = 0; i < 2400; i++) {
      const x = rand() * size;
      const y = rand() * size;
      const r = rand() * 18 + 2;
      const l = Math.floor(rand() * 60 + 28);
      const a = rand() * 0.35 + 0.08;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${l+10},${l},${l-8},${a})`;
      ctx.fill();
    }
    for (let i = 0; i < 18; i++) {
      const x   = rand() * size;
      const y   = rand() * size;
      const r   = rand() * 22 + 6;
      const grd = ctx.createRadialGradient(x, y, 0, x, y, r);
      grd.addColorStop(0,   'rgba(20,18,15,0.55)');
      grd.addColorStop(0.7, 'rgba(60,55,48,0.18)');
      grd.addColorStop(1,   'rgba(80,74,65,0.0)');
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    return new THREE.CanvasTexture(canvas);
  }, []);
}

// ─── Irregular asteroid geometry ─────────────────────────────────────────────
// Distorts a sphere's vertices with seeded noise to look like a potato rock
function useIrregularGeometry(radius) {
  return useMemo(() => {
    const geo  = new THREE.SphereGeometry(radius, 32, 32);
    const pos  = geo.attributes.position;

    // Seeded pseudo-random for reproducibility
    let seed = 7;
    const rand = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);

      // Large-scale axis squash — makes it look elongated like a real asteroid
      const squashX = 1.0 + (rand() - 0.5) * 0.55;
      const squashY = 1.0 + (rand() - 0.5) * 0.40;
      const squashZ = 1.0 + (rand() - 0.5) * 0.45;

      // Fine surface noise
      const noise = 1.0 + (rand() - 0.5) * 0.28;

      pos.setXYZ(i, x * squashX * noise, y * squashY * noise, z * squashZ * noise);
    }

    geo.computeVertexNormals();
    return geo;
  }, [radius]);
}

// ─── Full orbital ellipse from Keplerian elements ─────────────────────────────
// Draws the complete predicted orbit so the short trajectory arc makes sense
function OrbitalEllipse({ meta, color }) {
  const geometry = useMemo(() => {
    const a = meta?.semi_major_axis_au;
    const e = meta?.eccentricity;
    const i = meta?.inclination_degrees;
    const Ω = meta?.longitude_of_ascending_node_degrees;
    const ω = meta?.argument_of_perihelion_degrees;

    if (a == null || e == null) return null;

    const sma  = a * AU_TO_UNITS;                    // semi-major axis in scene units
    const smb  = sma * Math.sqrt(1 - e * e);         // semi-minor axis
    const c    = sma * e;                             // focus offset

    // Convert degrees → radians
    const iR = (i  ?? 0) * Math.PI / 180;
    const ΩR = (Ω  ?? 0) * Math.PI / 180;
    const ωR = (ω  ?? 0) * Math.PI / 180;

    // Build rotation matrix from orbital elements
    // Order: argument of perihelion → inclination → longitude of ascending node
    const mω = new THREE.Matrix4().makeRotationY(-ωR);
    const mI = new THREE.Matrix4().makeRotationX(-iR);
    const mΩ = new THREE.Matrix4().makeRotationY(-ΩR);
    const rot = new THREE.Matrix4().multiplyMatrices(mΩ, new THREE.Matrix4().multiplyMatrices(mI, mω));

    const pts = [];
    const N   = 256;
    for (let k = 0; k <= N; k++) {
      const θ = (k / N) * Math.PI * 2;
      // Ellipse in orbital plane (x = along perihelion, y = 0, z = up in orbital plane)
      const px = sma * Math.cos(θ) - c;
      const pz = smb * Math.sin(θ);
      const v  = new THREE.Vector3(px, 0, pz).applyMatrix4(rot);
      pts.push(v);
    }

    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [meta]);

  if (!geometry) return null;

  return (
    <line geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.18} />
    </line>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────
function DetailPanel({ meta, vectors, isHazardous, onClose }) {
  const color = isHazardous ? '#ff4444' : '#44aaff';

  const dMinKm  = meta?.estimated_diameter_min_m != null ? (meta.estimated_diameter_min_m  / 1000).toFixed(3) : null;
  const dMaxKm  = meta?.estimated_diameter_max_m != null ? (meta.estimated_diameter_max_m / 1000).toFixed(3) : null;
  const sizeStr = dMinKm && dMaxKm ? `${dMinKm} – ${dMaxKm} km` : '—';

  const approach  = meta?.close_approaches?.[0];
  const trajStart = vectors[0]?.datetime
    ? new Date(vectors[0].datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';
  const trajEnd   = vectors[vectors.length - 1]?.datetime
    ? new Date(vectors[vectors.length - 1].datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : '—';

  return (
    <div style={{
      background:    'rgba(4,3,2,0.96)',
      border:        `1px solid ${color}55`,
      borderRadius:  '8px',
      padding:       '14px 16px',
      color:         '#e0e0e0',
      fontSize:      '10px',
      fontFamily:    'monospace',
      letterSpacing: '0.07em',
      minWidth:      '240px',
      maxWidth:      '280px',
      boxShadow:     `0 0 28px ${color}22, 0 4px 24px rgba(0,0,0,0.7)`,
      lineHeight:    '1.75',
      pointerEvents: 'all',
      userSelect:    'none',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <div style={{ color, fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.12em' }}>
            {isHazardous ? '[!] ' : '[*] '}{meta?.name ?? 'ASTEROID'}
          </div>
          <div style={{ color: '#7a8a9a', fontSize: '9px', marginTop: '2px' }}>
            {meta?.orbit_class_name ?? ''} · SPK {meta?.spk_id ?? '—'}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'transparent', border: '1px solid #333', borderRadius: '3px',
            color: '#666', cursor: 'pointer', fontSize: '10px', padding: '1px 6px',
            fontFamily: 'monospace', lineHeight: '1.4', flexShrink: 0, marginLeft: '8px',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#aaa'}
          onMouseLeave={e => e.currentTarget.style.color = '#666'}
        >✕</button>
      </div>

      <Divider color={color} />
      <SectionLabel label="PHYSICAL" />
      <Row label="DIAMETER"    value={sizeStr} color={color} />
      <Row label="HAZARDOUS"   value={isHazardous ? 'YES' : 'NO'} color={isHazardous ? '#ff4444' : '#44ff88'} />
      <Row label="SENTRY OBJ"  value={meta?.is_sentry_object ? 'YES' : 'NO'} />
      <Row label="PHA"         value={meta?.pha ? 'YES' : 'NO'} color={meta?.pha ? '#ffaa44' : undefined} />

      <Divider color={color} />
      <SectionLabel label="ORBITAL ELEMENTS" />
      <Row label="CLASS"        value={meta?.orbit_class_name} />
      <Row label="SEMI-MAJOR"   value={meta?.semi_major_axis_au != null ? `${meta.semi_major_axis_au} AU` : '—'} />
      <Row label="ECCENTRICITY" value={meta?.eccentricity} />
      <Row label="INCLINATION"  value={meta?.inclination_degrees != null ? `${meta.inclination_degrees}°` : '—'} />
      <Row label="PERIOD"       value={meta?.orbital_period_days != null ? `${meta.orbital_period_days} days` : '—'} />
      <Row label="MOID"         value={meta?.moid_au != null ? `${meta.moid_au} AU` : '—'}
                                color={meta?.moid_au < 0.05 ? '#ffaa44' : undefined} />

      {approach && <>
        <Divider color={color} />
        <SectionLabel label="CLOSE APPROACH" />
        <Row label="DATE"      value={approach.date_full ?? approach.date} color={color} />
        <Row label="MISS DIST" value={`${(approach.miss_distance_km / 1e6).toFixed(3)} M km`} />
        <Row label="VELOCITY"  value={`${Number(approach.relative_velocity_km_s).toFixed(2)} km/s`} />
      </>}

      <Divider color={color} />
      <div style={{ color: '#8a9aaa', fontSize: '9px', letterSpacing: '0.1em' }}>TRAJECTORY WINDOW</div>
      <div style={{ color: '#9aacbc', fontSize: '9px', marginTop: '2px' }}>{trajStart} → {trajEnd}</div>
    </div>
  );
}

function Divider({ color }) {
  return <div style={{ borderTop: `1px solid ${color}18`, margin: '8px 0' }} />;
}
function SectionLabel({ label }) {
  return <div style={{ color: '#8a9aaa', fontSize: '8px', letterSpacing: '0.2em', marginBottom: '3px' }}>{label}</div>;
}
function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
      <span style={{ color: '#9aacbc' }}>{label}</span>
      <span style={{ color: color ?? '#e8b870' }}>{value ?? '—'}</span>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function AsteroidPath({ vectors, isHazardous, asteroidMeta }) {
  const bodyRef        = useRef();       // single ref on the group — glow is a child
  const [selected,     setSelected]     = useState(false);
  const [dotPos,       setDotPos]       = useState(null);
  const [startHovered, setStartHovered] = useState(false);
  const [endHovered,   setEndHovered]   = useState(false);

  const color   = isHazardous ? '#ff4444' : '#44aaff';
  const texture = useAsteroidTexture();

  // Accurate radius from API metres, with visible minimum
  const asteroidRadius = useMemo(() => {
    const minM = asteroidMeta?.estimated_diameter_min_m;
    const maxM = asteroidMeta?.estimated_diameter_max_m;
    if (minM != null && maxM != null) {
      const meanKm = ((minM + maxM) / 2) / 1000;
      return Math.max((meanKm / 2) * KM_TO_UNITS, 1.2);
    }
    return 1.2;
  }, [asteroidMeta]);

  const irregularGeo = useIrregularGeometry(asteroidRadius);

  const { pts, lineArray } = useMemo(() => {
    if (!vectors.length) return { pts: [], lineArray: null };
    const p    = vectors.map(toVec3);
    const flat = new Float32Array(p.length * 3);
    p.forEach((v, i) => { flat[i*3]=v.x; flat[i*3+1]=v.y; flat[i*3+2]=v.z; });
    return { pts: p, lineArray: flat };
  }, [vectors]);

  // Animate body group — glow is a child so it moves for free
  useFrame(() => {
    if (!pts.length || !bodyRef.current) return;
    const pos = interpolatePosition(vectors, pts, Date.now());
    if (!pos) return;
    bodyRef.current.position.copy(pos);
    setDotPos(pos.clone());
  });

  const handleClick = useCallback((e) => {
    e.stopPropagation();
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

  if (!lineArray) return null;

  return (
    <group>

      {/* Full predicted orbital ellipse — context for the short arc */}
      <OrbitalEllipse meta={asteroidMeta} color={color} />

      <AsteroidTrail pts={pts} color={color} />

      {/* ── Start Marker (Hover to view tag) ──────────────────────── */}
      {pts.length > 0 && (
        <group
          position={pts[0]}
          onPointerOver={e => { e.stopPropagation(); setStartHovered(true); document.body.style.cursor = 'pointer'; }}
          onPointerOut={()  => { setStartHovered(false); document.body.style.cursor = 'auto'; }}
        >
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
            <Html position={[0, asteroidRadius * 1.6, 0]} center distanceFactor={140} style={{ pointerEvents: 'none' }}>
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
          onPointerOut={()  => { setEndHovered(false); document.body.style.cursor = 'auto'; }}
        >
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
            <Html position={[0, asteroidRadius * 1.6, 0]} center distanceFactor={140} style={{ pointerEvents: 'none' }}>
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

      {/* Asteroid body group — glow is a child, moves together */}
      <group ref={bodyRef} onClick={handleClick}>
        {/* Irregular rocky body */}
        <mesh geometry={irregularGeo}>
          <meshStandardMaterial
            map={texture}
            roughness={0.92}
            metalness={0.08}
            color={isHazardous ? '#ff9988' : '#b0a898'}
          />
        </mesh>

        {/* Glow — child of body group, always co-located */}
        <mesh>
          <sphereGeometry args={[asteroidRadius * 2.8, 12, 12]} />
          <meshBasicMaterial color={color} transparent opacity={0.07} depthWrite={false} />
        </mesh>
      </group>

      {/* Detail panel */}
      {selected && dotPos && (
        <Html
          position={[dotPos.x, dotPos.y + asteroidRadius * 8, dotPos.z]}
          center
          distanceFactor={150}
          zIndexRange={[100, 0]}
        >
          <DetailPanel
            meta={asteroidMeta}
            vectors={vectors}
            isHazardous={isHazardous}
            onClose={() => setSelected(false)}
          />
        </Html>
      )}
    </group>
  );
}

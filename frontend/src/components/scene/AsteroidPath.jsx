import { useMemo, useRef, useState, useCallback } from 'react';
import { useFrame }                                from '@react-three/fiber';
import { Html }                                    from '@react-three/drei';
import * as THREE                                  from 'three';
import { KM_TO_UNITS }                             from '../../lib/constants/scale.js';

function toVec3(v) {
  return new THREE.Vector3(
    v.x_km * KM_TO_UNITS,
    v.z_km * KM_TO_UNITS,
    v.y_km * KM_TO_UNITS,
  );
}

// Linearly interpolate position between two vectors based on real time
function interpolatePosition(vectors, pts, nowMs, startMs, endMs) {
  if (!vectors.length) return null;

  if (nowMs <= startMs) return pts[0];
  if (nowMs >= endMs) return pts[pts.length - 1];

  // Find the two surrounding vectors
  for (let i = 0; i < vectors.length - 1; i++) {
    const t0 = new Date(vectors[i].datetime).getTime();
    const t1 = new Date(vectors[i + 1].datetime).getTime();
    if (nowMs >= t0 && nowMs <= t1) {
      const frac = (nowMs - t0) / (t1 - t0);
      return new THREE.Vector3().lerpVectors(pts[i], pts[i + 1], frac);
    }
  }

  // Outside range — clamp to first or last
  const firstT = new Date(vectors[0].datetime).getTime();
  return nowMs < firstT ? pts[0] : pts[pts.length - 1];
}

export default function AsteroidPath({ vectors, isHazardous, asteroidMeta }) {
  const dotRef      = useRef();
  const glowRef     = useRef();
  const [selected, setSelected] = useState(false);
  const [dotPos,   setDotPos]   = useState(null);

  const color = isHazardous ? '#ff4444' : '#44aaff';

  // ── Build geometry once ──────────────────────────────────────────────────
  const { pts, lineArray, startMs, endMs } = useMemo(() => {
    if (!vectors.length) return { pts: [], lineArray: null, startMs: 0, endMs: 0 };

    const p       = vectors.map(toVec3);
    const flat    = new Float32Array(p.length * 3);
    p.forEach((v, i) => { flat[i*3]=v.x; flat[i*3+1]=v.y; flat[i*3+2]=v.z; });

    return {
      pts:       p,
      lineArray: flat,
      startMs:   new Date(vectors[0].datetime).getTime(),
      endMs:     new Date(vectors[vectors.length - 1].datetime).getTime(),
    };
  }, [vectors]);

  // ── Animate dot in real time ─────────────────────────────────────────────
  useFrame(() => {
    if (!pts.length || !dotRef.current) return;
    const pos = interpolatePosition(vectors, pts, Date.now(), startMs, endMs);
    if (!pos) return;
    dotRef.current.position.copy(pos);
    if (glowRef.current) glowRef.current.position.copy(pos);
    setDotPos(pos.clone());   // for Html panel positioning
  });

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    setSelected(s => !s);
  }, []);

  if (!lineArray) return null;

  // ── Close approach data from meta ────────────────────────────────────────
  const approach = asteroidMeta?.close_approach_data?.[0];

  return (
    <group>

      {/* ── Orbit trail ── */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={lineArray}
            count={lineArray.length / 3}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.45} />
      </line>

      {/* ── Animated dot ── */}
      <mesh ref={dotRef} onClick={handleClick}>
        <sphereGeometry args={[1.4, 16, 16]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* ── Glow halo ── */}
      <mesh ref={glowRef}>
        <sphereGeometry args={[3.0, 16, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.08} depthWrite={false} />
      </mesh>

      {/* ── Click-to-details panel ── */}
      {selected && dotPos && (
        <Html
          position={[dotPos.x, dotPos.y + 6, dotPos.z]}
          center
          distanceFactor={120}
          style={{ pointerEvents: 'none' }}
        >
          <div style={{
            background:     'rgba(5,3,0,0.92)',
            border:         `1px solid ${color}55`,
            borderRadius:   '6px',
            padding:        '10px 14px',
            color:          '#d4d4d4',
            fontSize:       '10px',
            fontFamily:     'monospace',
            letterSpacing:  '0.08em',
            minWidth:       '200px',
            boxShadow:      `0 0 20px ${color}22`,
            lineHeight:     '1.8',
          }}>
            {/* Header */}
            <div style={{ color, fontSize: '11px', fontWeight: 'bold', marginBottom: '6px', letterSpacing: '0.15em' }}>
              {isHazardous ? '⚠ ' : '◉ '}{asteroidMeta?.name ?? 'ASTEROID'}
            </div>

            {/* Rows */}
            <Row label="SPK ID"      value={asteroidMeta?.spk_id} />
            <Row label="HAZARDOUS"   value={isHazardous ? 'YES' : 'NO'} color={isHazardous ? '#ff4444' : '#44ff88'} />
            <Row label="DIAMETER"    value={asteroidMeta?.estimated_diameter_km_max != null
              ? `${asteroidMeta.estimated_diameter_km_max.toFixed(3)} km`
              : '—'} />

            {approach && <>
              <div style={{ borderTop: `1px solid ${color}22`, margin: '6px 0' }} />
              <Row label="CLOSE APPROACH" value={approach.close_approach_date} />
              <Row label="MISS DIST"      value={`${Number(approach.miss_distance_km).toLocaleString()} km`} />
              <Row label="VELOCITY"       value={`${Number(approach.relative_velocity_km_s).toFixed(2)} km/s`} />
            </>}

            <div style={{ borderTop: `1px solid ${color}22`, margin: '6px 0' }} />
            <div style={{ color: '#555', fontSize: '9px' }}>
              TRAJECTORY {new Date(vectors[0]?.datetime).toLocaleDateString()}
              {' → '}
              {new Date(vectors[vectors.length-1]?.datetime).toLocaleDateString()}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// Small helper for consistent label rows
function Row({ label, value, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
      <span style={{ color: '#555' }}>{label}</span>
      <span style={{ color: color ?? '#d4944a' }}>{value ?? '—'}</span>
    </div>
  );
}

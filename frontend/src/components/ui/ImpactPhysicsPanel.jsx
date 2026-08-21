import { useEffect, useMemo, useRef, useState } from 'react';
import {
  calculateImpact,
  formatEnergy,
  formatDistance,
  formatMass,
  toHiroshima,
} from '../../lib/impactPhysics.js';

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    let start = null;
    let raf;
    const step = (ts) => {
      if (!start) start = ts;
      const pct = Math.min((ts - start) / duration, 1);
      // ease-out cubic
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(target * ease);
      if (pct < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

// ─── Blast zone bar ───────────────────────────────────────────────────────────
function BlastZoneBar({ zone, maxRadius, index, totalZones }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), index * 80 + 200);
    return () => clearTimeout(t);
  }, [index]);

  const pct = Math.min((zone.radiusKm / maxRadius) * 100, 100);

  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        marginBottom:   '4px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{
            width:        '8px',
            height:       '8px',
            borderRadius: '50%',
            background:   zone.color,
            boxShadow:    `0 0 6px ${zone.color}`,
            flexShrink:   0,
          }} />
          <span style={{ color: zone.color, fontSize: '9px', letterSpacing: '0.15em', fontWeight: 'bold' }}>
            {zone.label}
          </span>
        </div>
        <span style={{ color: '#c8d4e0', fontSize: '9px', fontFamily: 'monospace' }}>
          r = {zone.radiusKm >= 1 ? `${zone.radiusKm.toFixed(1)} km` : `${(zone.radiusKm * 1000).toFixed(0)} m`}
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height:       '4px',
        background:   'rgba(255,255,255,0.06)',
        borderRadius: '2px',
        overflow:     'hidden',
        marginBottom: '3px',
      }}>
        <div style={{
          height:           '100%',
          width:            mounted ? `${pct}%` : '0%',
          background:       `linear-gradient(90deg, ${zone.color}44, ${zone.color})`,
          borderRadius:     '2px',
          transition:       'width 0.7s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow:        `0 0 6px ${zone.color}`,
        }} />
      </div>

      <div style={{ color: '#5a6a7a', fontSize: '8px', letterSpacing: '0.08em', paddingLeft: '14px' }}>
        {zone.desc} · {zone.overpressure}
      </div>
    </div>
  );
}

// ─── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = '#e8c870', glow = false }) {
  return (
    <div style={{
      background:   'rgba(255,255,255,0.03)',
      border:       `1px solid ${color}22`,
      borderRadius: '6px',
      padding:      '8px 10px',
      flex:         '1 1 0',
      minWidth:     '0',
    }}>
      <div style={{ color: '#6a7a8a', fontSize: '7.5px', letterSpacing: '0.2em', marginBottom: '4px', textTransform: 'uppercase' }}>
        {label}
      </div>
      <div style={{
        color:      color,
        fontSize:   '11px',
        fontWeight: 'bold',
        letterSpacing: '0.04em',
        wordBreak:  'break-all',
        textShadow: glow ? `0 0 12px ${color}` : 'none',
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ color: '#5a6a7a', fontSize: '8px', marginTop: '2px', letterSpacing: '0.06em' }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ icon, label, color = '#8a9aaa' }) {
  return (
    <div style={{
      display:       'flex',
      alignItems:    'center',
      gap:           '6px',
      marginBottom:  '8px',
      paddingBottom: '5px',
      borderBottom:  `1px solid ${color}22`,
    }}>
      <span style={{ fontSize: '10px' }}>{icon}</span>
      <span style={{ color, fontSize: '8px', letterSpacing: '0.22em', textTransform: 'uppercase', fontWeight: 'bold' }}>
        {label}
      </span>
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export default function ImpactPhysicsPanel({ meta, isHazardous, onClose }) {
  const [visible, setVisible] = useState(false);
  const panelRef = useRef();

  useEffect(() => {
    // Mount animation
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300);
  };

  const result = useMemo(() => {
    if (!meta) return null;
    return calculateImpact(meta);
  }, [meta]);

  if (!result) return null;

  const { classification, blastZones, kineticEnergyJ, energyMT, finalCraterKm,
          ejectaRadiusKm, tsunamiWaveHeightAt100km, massKg, velocityKmS, diameterKm } = result;

  const accentColor = isHazardous ? '#ff4444' : '#44aaff';
  const classColor  = classification.color;

  const maxBlastRadius = Math.max(...Object.values(blastZones).map(z => z.radiusKm));
  const zoneEntries    = Object.values(blastZones);

  return (
    <div style={{
      position:             'fixed',
      top:                  0,
      left:                 0,
      width:                '100vw',
      height:               '100vh',
      zIndex:               1000,
      display:              'flex',
      alignItems:           'center',
      justifyContent:       'center',
      pointerEvents:        'none',
    }}>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position:   'absolute',
          inset:      0,
          background: `radial-gradient(ellipse at center, ${classColor}08 0%, rgba(0,0,0,0.65) 70%)`,
          opacity:    visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'all',
          cursor:     'default',
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position:             'relative',
          pointerEvents:        'all',
          width:                '520px',
          maxWidth:             'calc(100vw - 40px)',
          maxHeight:            'calc(100vh - 60px)',
          overflowY:            'auto',
          background:           'rgba(3,5,8,0.97)',
          border:               `1px solid ${accentColor}40`,
          borderRadius:         '10px',
          padding:              '20px',
          fontFamily:           'monospace',
          boxShadow:            `0 0 60px ${classColor}18, 0 0 120px ${classColor}0a, 0 8px 40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.04)`,
          opacity:              visible ? 1 : 0,
          transform:            visible ? 'scale(1) translateY(0)' : 'scale(0.94) translateY(20px)',
          transition:           'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34,1.56,0.64,1)',
          scrollbarWidth:       'thin',
          scrollbarColor:       `${accentColor}33 transparent`,
        }}
      >
        {/* ── Header ───────────────────────────────────────────────────── */}
        <div style={{
          display:        'flex',
          justifyContent: 'space-between',
          alignItems:     'flex-start',
          marginBottom:   '16px',
        }}>
          <div>
            {/* Classification badge */}
            <div style={{
              display:      'inline-flex',
              alignItems:   'center',
              gap:          '6px',
              background:   `${classColor}18`,
              border:       `1px solid ${classColor}55`,
              borderRadius: '4px',
              padding:      '3px 8px',
              marginBottom: '6px',
            }}>
              <div style={{
                width:        '6px',
                height:       '6px',
                borderRadius: '50%',
                background:   classColor,
                boxShadow:    `0 0 8px ${classColor}`,
                animation:    'pulse 1.4s ease-in-out infinite',
              }} />
              <span style={{ color: classColor, fontSize: '8px', letterSpacing: '0.2em', fontWeight: 'bold' }}>
                {classification.label} · {classification.risk}
              </span>
            </div>

            <div style={{ color: '#ffffff', fontSize: '15px', fontWeight: 'bold', letterSpacing: '0.06em' }}>
              ☄ IMPACT ANALYSIS
            </div>
            <div style={{ color: '#6a7a8a', fontSize: '9px', letterSpacing: '0.12em', marginTop: '2px' }}>
              {meta?.name ?? 'UNKNOWN ASTEROID'} · SPK {meta?.spk_id ?? '—'}
            </div>
          </div>
          <button
            onClick={handleClose}
            style={{
              background:    'rgba(255,255,255,0.04)',
              border:        '1px solid rgba(255,255,255,0.12)',
              borderRadius:  '4px',
              color:         '#7a8a9a',
              cursor:        'pointer',
              fontSize:      '11px',
              padding:       '4px 8px',
              fontFamily:    'monospace',
              flexShrink:    0,
              transition:    'all 0.2s',
              marginLeft:    '12px',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.10)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              e.currentTarget.style.color = '#7a8a9a';
            }}
          >✕</button>
        </div>

        {/* ── Key stats row ─────────────────────────────────────────────── */}
        <SectionHeader icon="⚡" label="Kinetic Energy Release" color={accentColor} />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <StatCard
            label="Total Energy"
            value={formatEnergy(kineticEnergyJ)}
            sub={`${energyMT.toExponential(2)} MT TNT`}
            color={classColor}
            glow
          />
          <StatCard
            label="Hiroshima Equiv."
            value={toHiroshima(kineticEnergyJ)}
            color="#ffaa44"
          />
          <StatCard
            label="Impact Velocity"
            value={`${velocityKmS.toFixed(1)} km/s`}
            sub={`${(velocityKmS * 3600).toFixed(0)} km/h`}
            color="#88ccff"
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <StatCard label="Diameter"  value={diameterKm >= 1 ? `${diameterKm.toFixed(2)} km` : `${(diameterKm * 1000).toFixed(0)} m`} color={accentColor} />
          <StatCard label="Est. Mass" value={formatMass(massKg)}         color="#c8d4e0" />
          <StatCard label="Density"   value={`${result.density.toLocaleString()} kg/m³`} color="#8a9aaa" />
        </div>

        {/* ── Crater ────────────────────────────────────────────────────── */}
        <SectionHeader icon="🕳" label="Crater Formation" color={accentColor} />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <StatCard
            label="Crater Diameter"
            value={formatDistance(finalCraterKm)}
            sub="Simple/complex crater"
            color={classColor}
            glow
          />
          <StatCard
            label="Ejecta Blanket"
            value={formatDistance(ejectaRadiusKm)}
            sub="Debris field radius"
            color="#ffaa66"
          />
          <StatCard
            label="Tsunami (100 km)"
            value={`${tsunamiWaveHeightAt100km.toFixed(1)} m`}
            sub="Ocean impact estimate"
            color="#44ccff"
          />
        </div>

        {/* ── Blast zones ───────────────────────────────────────────────── */}
        <SectionHeader icon="💥" label="Blast Zones" color={accentColor} />
        <div style={{ marginBottom: '16px' }}>
          {zoneEntries.map((zone, i) => (
            <BlastZoneBar
              key={zone.label}
              zone={zone}
              maxRadius={maxBlastRadius}
              index={i}
              totalZones={zoneEntries.length}
            />
          ))}
        </div>

        {/* ── Legend / disclaimer ───────────────────────────────────────── */}
        <div style={{
          borderTop:    '1px solid rgba(255,255,255,0.06)',
          paddingTop:   '10px',
          color:        '#3a4a5a',
          fontSize:     '8px',
          letterSpacing:'0.06em',
          lineHeight:   '1.7',
        }}>
          ⓘ Calculations use Collins et al. (2005) crater scaling and Glasstone &amp; Dolan (1977) blast models.
          Assumes {result.density === 7900 ? 'iron' : result.density === 1500 ? 'cometary' : 'stony'} impactor,
          45° impact angle, continental rock target. Results are estimates only.
        </div>
      </div>

      {/* CSS keyframe for pulse animation */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  );
}

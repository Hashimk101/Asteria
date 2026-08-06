import { useAsteroidList } from '../../hooks/useAsteroid';

export default function AsteroidSelector({ selectedId, onChange }) {
  const { asteroids, loading } = useAsteroidList();

  return (
    <div style={{
      position:        'absolute',
      top:             '1rem',
      right:           '1rem',
      zIndex:          10,
      display:         'flex',
      flexDirection:   'column',
      gap:             '0.4rem',
      background:      'rgba(0,0,0,0.6)',
      border:          '1px solid rgba(255,255,255,0.1)',
      borderRadius:    '10px',
      padding:         '0.75rem 1rem',
      backdropFilter:  'blur(8px)',
      minWidth:        '240px',
    }}>
      <label style={{ color: '#aaa', fontSize: '11px', letterSpacing: '0.08em' }}>
        ASTEROID TRACKER
      </label>

      <select
        value={selectedId ?? ''}
        onChange={e => onChange(e.target.value || null)}
        disabled={loading}
        style={{
          background:   'rgba(255,255,255,0.07)',
          color:        '#fff',
          border:       '1px solid rgba(255,255,255,0.15)',
          borderRadius: '6px',
          padding:      '0.4rem 0.6rem',
          fontSize:     '13px',
          cursor:       'pointer',
          outline:      'none',
        }}
      >
        <option value="">
          {loading ? 'Loading...' : '— Select asteroid —'}
        </option>
        {asteroids.map(a => (
          <option key={a.spk_id} value={a.spk_id}>
            {a.name} {a.is_hazardous ? '⚠️' : ''}
          </option>
        ))}
      </select>

      {selectedId && (
        <button
          onClick={() => onChange(null)}
          style={{
            background:   'transparent',
            color:        '#ff6b6b',
            border:       '1px solid rgba(255,107,107,0.3)',
            borderRadius: '6px',
            padding:      '0.3rem',
            fontSize:     '12px',
            cursor:       'pointer',
          }}
        >
          ✕ Clear
        </button>
      )}
    </div>
  );
}

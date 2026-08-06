import { useState, useEffect } from 'react';

const BASE = 'https://asteria.fastapicloud.dev';

export function useAsteroidList() {
  const [asteroids, setAsteroids] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    fetch(`${BASE}/asteroids?page=1&limit=100`)
      .then(r => r.json())
      .then(data => { setAsteroids(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return { asteroids, loading };
}

export function useAsteroidTrajectory(spkId) {
  const [vectors,  setVectors]  = useState([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!spkId) return;

    // schedule setting loading and clearing error asynchronously to avoid synchronous setState in effect
    Promise.resolve().then(() => { setLoading(true); setError(null); });

    fetch(`${BASE}/trajectory/${spkId}`)
      .then(r => r.json())
      .then(data => { setVectors(data.vectors ?? []); setLoading(false); })
      .catch(e  => { setError(e.message);             setLoading(false); });
  }, [spkId]);

  return { vectors: spkId ? vectors : [], loading, error };
}

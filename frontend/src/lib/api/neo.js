import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

const BASE = import.meta.env.VITE_API_URL ?? "https://asteria.fastapicloud.dev";

// ─── Zod Schemas ──────────────────────────────────────────────────────────────

const AsteroidSchema = z.object({
  id:                        z.string(),
  spk_id:                    z.string(),
  name:                      z.string(),
  designation:               z.string().optional(),
  estimated_diameter_min_m:  z.number().optional(),
  estimated_diameter_max_m:  z.number().optional(),
  is_hazardous:              z.boolean(),
  is_sentry_object:          z.boolean().optional(),
  orbit_class_name:          z.string().optional(),
  close_approach_count:      z.number().optional(),
});

const AsteroidDetailSchema = AsteroidSchema.extend({
  semi_major_axis_au:  z.number().optional(),
  eccentricity:        z.number().optional(),
  inclination_degrees: z.number().optional(),
  close_approach_data: z.array(z.object({
    date:                  z.string(),
    miss_distance_km:      z.number(),
    relative_velocity_km_s: z.number(),
  })).optional(),
});

const TrajectoryVectorSchema = z.object({
  datetime: z.string(),
  jd:       z.number(),
  x_km:     z.number(),
  y_km:     z.number(),
  z_km:     z.number(),
  vx_kms:   z.number(),
  vy_kms:   z.number(),
  vz_kms:   z.number(),
});

const TrajectorySchema = z.object({
  spk_id:      z.string(),
  point_count: z.number(),
  vectors:     z.array(TrajectoryVectorSchema),
});

const SentrySchema = z.object({
  id:              z.string().optional(),
  name:            z.string().optional(),
  impact_probability: z.number().optional(),
  year_range:      z.string().optional(),
}).passthrough(); // sentry has many fields, passthrough catches the rest

// ─── Fetchers ─────────────────────────────────────────────────────────────────

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

export const fetchAsteroids = (page = 1, limit = 20, is_hazardous) => {
  const params = new URLSearchParams({ page, limit });
  if (is_hazardous !== undefined) params.set("is_hazardous", is_hazardous);
  return get(`/asteroids?${params}`).then(d => z.array(AsteroidSchema).parse(d));
};

export const fetchAsteroidDetail = (spk_id) =>
  get(`/asteroids/${spk_id}`).then(d => AsteroidDetailSchema.parse(d));

export const fetchTrajectory = (spk_id) =>
  get(`/trajectory/${spk_id}`).then(d => TrajectorySchema.parse(d));

export const fetchPlanets = (name) => {
  const params = name ? `?name=${encodeURIComponent(name)}` : "";
  return get(`/planets${params}`).then(d => {
    // Shape: { planets: { Neptune: [{jd, x_km, ...}, ...], Earth: [...], ... } }
    const planetsMap = d?.planets ?? d; // handle both wrapped and unwrapped

    return Object.entries(planetsMap).map(([planetName, vectors]) => {
      // Take the first vector (current position)
      const v = Array.isArray(vectors) ? vectors[0] : vectors;
      return {
        name:   planetName,
        x_km:   v.x_km  ?? 0,
        y_km:   v.y_km  ?? 0,
        z_km:   v.z_km  ?? 0,
        vx_kms: v.vx_kms ?? 0,
        vy_kms: v.vy_kms ?? 0,
        vz_kms: v.vz_kms ?? 0,
      };
    });
    // No Zod parse needed — we're constructing the shape ourselves
  });
};


export const fetchHazardous = () =>
  get(`/hazardous`).then(d => z.array(AsteroidSchema).parse(d));

export const fetchSentry = () =>
  get(`/sentry`).then(d => z.array(SentrySchema).parse(d));

export const fetchHealth = () =>
  get(`/health`);

// ─── TanStack Query Hooks ─────────────────────────────────────────────────────

const STALE = {
  short:  2 * 60 * 1000,   //  2 min — close approach data changes
  medium: 5 * 60 * 1000,   //  5 min — asteroid list
  long:   15 * 60 * 1000,  // 15 min — trajectories, planets (slow moving)
};

const retryDelay = (attempt) => Math.min(1000 * 2 ** attempt, 10_000);

export function useAsteroids(page = 1, limit = 20, is_hazardous) {
  return useQuery({
    queryKey:   ["asteroids", page, limit, is_hazardous],
    queryFn:    () => fetchAsteroids(page, limit, is_hazardous),
    staleTime:  STALE.medium,
    retry:      3,
    retryDelay,
  });
}

export function useAsteroidDetail(spk_id) {
  return useQuery({
    queryKey:   ["asteroid", spk_id],
    queryFn:    () => fetchAsteroidDetail(spk_id),
    staleTime:  STALE.medium,
    enabled:    !!spk_id,   // don't fetch if no id selected
    retry:      3,
    retryDelay,
  });
}

export function useTrajectory(spk_id) {
  return useQuery({
    queryKey:   ["trajectory", spk_id],
    queryFn:    () => fetchTrajectory(spk_id),
    staleTime:  STALE.long,
    enabled:    !!spk_id,
    retry:      2,
    retryDelay,
  });
}

export function usePlanets(name) {
  return useQuery({
    queryKey:   ["planets", name ?? "all"],
    queryFn:    () => fetchPlanets(name),
    staleTime:  STALE.long,
    retry:      3,
    retryDelay,
  });
}

export function useHazardous() {
  return useQuery({
    queryKey:   ["hazardous"],
    queryFn:    fetchHazardous,
    staleTime:  STALE.medium,
    retry:      3,
    retryDelay,
  });
}

export function useSentry() {
  return useQuery({
    queryKey:   ["sentry"],
    queryFn:    fetchSentry,
    staleTime:  STALE.short,
    retry:      3,
    retryDelay,
  });
}

// ─── Derived "Stats" hook — computed from real endpoints ──────────────────────
// Replaces the old /api/neo/stats that doesn't exist

export function useNeoStats() {
  const asteroids  = useAsteroids(1, 100);
  const hazardous  = useHazardous();
  const sentry     = useSentry();

  const isLoading = asteroids.isLoading || hazardous.isLoading;
  const isError   = asteroids.isError   || hazardous.isError;

  const stats = (!isLoading && !isError) ? {
    total_neos_tracked:     asteroids.data?.length ?? 0,
    potentially_hazardous:  hazardous.data?.length ?? 0,
    sentry_objects:         sentry.data?.length    ?? 0,

    // closest approach from asteroid list
    closest_approach_km: asteroids.data
      ?.flatMap(a => a.close_approach_count ? [a] : [])
      .length ?? 0,

    // largest diameter from asteroid list
    largest_diameter_km: Math.max(
      0,
      ...(asteroids.data?.map(a =>
        (a.estimated_diameter_max_m ?? 0) / 1000
      ) ?? [])
    ),
  } : null;

  return { data: stats, isLoading, isError };
}

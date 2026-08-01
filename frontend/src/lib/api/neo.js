import { z } from "zod";
import { useQuery } from "@tanstack/react-query";

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

// ── Zod Schemas (align with teammate's backend) ───────────────────────────────
// ⚠️  FLAG FOR TEAMMATE: GET /api/neo/stats must return this shape

export const NeoStatsSchema = z.object({
  total_neos_tracked:       z.number(),
  potentially_hazardous:    z.number(),
  close_approaches_today:   z.number(),
  closest_approach_km:      z.number(),
  largest_diameter_km:      z.number(),
  next_close_approach_date: z.string(),
  data_freshness_utc:       z.string(),
});

// ── Fetcher ───────────────────────────────────────────────────────────────────

async function fetchNeoStats() {
  const res = await fetch(`${BASE_URL}/api/neo/stats`);
  if (!res.ok) throw new Error(`Stats fetch failed: ${res.status}`);
  return NeoStatsSchema.parse(await res.json());
}

// ── Mock data — swap out when backend is live ─────────────────────────────────

export const MOCK_STATS = {
  total_neos_tracked:       34218,
  potentially_hazardous:    2350,
  close_approaches_today:   7,
  closest_approach_km:      284000,
  largest_diameter_km:      4.6,
  next_close_approach_date: "2026-07-19T14:22:00Z",
  data_freshness_utc:       new Date().toISOString(),
};

// ── TanStack Query Hook ───────────────────────────────────────────────────────

export function useNeoStats() {
  return useQuery({
    queryKey:   ["neo-stats"],
    queryFn:    fetchNeoStats,
    staleTime:  5 * 60 * 1000,
    retry:      3,
    retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10_000),
  });
}

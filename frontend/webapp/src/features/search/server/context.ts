import "server-only";

import sql from "@/config/database/db";

import { fold } from "../lib/fold";
import type { Place, SearchContext } from "../types";

const TTL_MS = 5 * 60_000;
let cached: { at: number; value: SearchContext } | null = null;
let inflight: Promise<SearchContext> | null = null;

type PlaceRow = { kind: Place["kind"]; name: string; aliases: string[]; city_slug: string; lat: number; lng: number; radius_m: number };
type SynonymRow = { term: string; canonical: string };

async function load(): Promise<SearchContext> {
  const [places, synonyms] = await Promise.all([
    sql<PlaceRow[]>`select kind, name, aliases, city_slug, lat, lng, radius_m from search.places`,
    sql<SynonymRow[]>`select term, canonical from search.synonyms`,
  ]);
  return {
    places: places.map((row) => ({
      kind: row.kind,
      name: row.name,
      aliases: row.aliases ?? [],
      citySlug: row.city_slug,
      lat: Number(row.lat),
      lng: Number(row.lng),
      radiusM: row.radius_m,
    })),
    synonyms: new Map(synonyms.map((row) => [fold(row.term), fold(row.canonical)])),
  };
}

/** Places and synonyms change rarely; keep them in memory for a few minutes. */
export async function getSearchContext(): Promise<SearchContext> {
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;
  inflight ??= load()
    .then((value) => {
      cached = { at: Date.now(), value };
      return value;
    })
    .finally(() => {
      inflight = null;
    });
  try {
    return await inflight;
  } catch (error) {
    // Serve stale data rather than failing every search while the database blips.
    if (cached) return cached.value;
    throw error;
  }
}

/** For tests. */
export function resetSearchContextCache() {
  cached = null;
}

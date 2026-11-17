/**
 * Location search for stays: "within 1 km of the shrine", "near this point on
 * the map", "close to my clinic". A search can be anchored to one place:
 *
 *   lm:<city-slug>/<landmark-slug>   a curated landmark (stay.landmarks)
 *   pt:<lat>,<lng>                   a point the visitor chose on the map / "near me"
 *   sp:<provider-uuid>               a Lsevin service provider (clinic, hospital, salon…) —
 *                                    used by booking add-ons ("a hotel near my appointment")
 *
 * Distances are straight-line (great-circle). Walking and driving times are
 * estimates and always labelled as such in the UI ("about", "approx.").
 */

export const RADII_M = [500, 1000, 2000, 3000, 5000, 10000] as const;
export type RadiusM = (typeof RADII_M)[number];
export const DEFAULT_RADIUS_M: RadiusM = 2000;

export type NearRef = { type: "lm"; city: string; slug: string } | { type: "pt"; lat: number; lng: number } | { type: "sp"; id: string };

const SLUG = /^[a-z0-9][a-z0-9-]{0,60}$/;
// Lsevin ids are not always RFC-4122 (version/variant bits vary) — accept any 8-4-4-4-12 hex id.
const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function parseNear(raw: string | null | undefined): NearRef | null {
  if (!raw) return null;
  const value = raw.trim();
  if (value.startsWith("lm:")) {
    const [city, slug] = value.slice(3).split("/");
    return city && slug && SLUG.test(city) && SLUG.test(slug) ? { type: "lm", city, slug } : null;
  }
  if (value.startsWith("pt:")) {
    const [a, b] = value.slice(3).split(",");
    const lat = Number(a);
    const lng = Number(b);
    if (a == null || b == null || a.trim() === "" || b.trim() === "") return null;
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 ? { type: "pt", lat: round5(lat), lng: round5(lng) } : null;
  }
  if (value.startsWith("sp:")) {
    const id = value.slice(3).toLowerCase();
    return GUID.test(id) ? { type: "sp", id } : null;
  }
  return null;
}

export function formatNear(n: NearRef): string {
  switch (n.type) {
    case "lm":
      return `lm:${n.city}/${n.slug}`;
    case "pt":
      return `pt:${round5(n.lat)},${round5(n.lng)}`;
    case "sp":
      return `sp:${n.id}`;
  }
}

/** ~1 m precision is plenty for a search anchor and keeps URLs short and cache-friendly. */
function round5(v: number) {
  return Math.round(v * 1e5) / 1e5;
}

export function parseRadius(raw: string | null | undefined): RadiusM | null {
  const n = Number(raw);
  return (RADII_M as readonly number[]).includes(n) ? (n as RadiusM) : null;
}

const EARTH_RADIUS_M = 6371008.8;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in metres. Mirrors stay.distance_m() in SQL. */
export function distanceM(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)));
}

/**
 * Walking minutes for a straight-line distance: streets are rarely straight,
 * so the path is taken as 1.3× the straight line at 4.8 km/h (80 m/min).
 */
export function walkMinutes(meters: number): number {
  return Math.max(1, Math.round((meters * 1.3) / 80));
}

/** City driving estimate: 1.4× detour at an average 25 km/h, plus 2 minutes to get going/park. */
export function driveMinutes(meters: number): number {
  return Math.max(2, Math.round((meters * 1.4) / 417 + 2));
}

/** Walking makes sense up to ~25 minutes; beyond that we lead with the car. */
export function preferWalking(meters: number): boolean {
  return walkMinutes(meters) <= 25;
}

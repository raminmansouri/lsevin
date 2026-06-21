// Pure, dependency-free geo + coordinate-parsing helpers. Kept free of any DB or
// React imports so they can be unit-tested in isolation (see nearby.geo.test.ts).

/**
 * Convert Persian (۰-۹) and Arabic-Indic (٠-٩) digits to ASCII and the Arabic
 * decimal separator (٫) to a dot, so coordinates that pass through a localized
 * field don't become NaN in Number(). Thousands separator (٬) is dropped.
 */
export function normalizeDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/٫/g, ".")
    .replace(/٬/g, "");
}

/** Parse a possibly-localized coordinate string, validating it falls in range. */
export function parseCoordinate(
  value: unknown,
  min: number,
  max: number,
): number | null {
  if (value == null) return null;
  const raw = normalizeDigits(String(value).trim());
  if (!raw) return null;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max) return null;
  return parsed;
}

export const EARTH_RADIUS_KM = 6371;

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Great-circle distance in km between two (lat, lng) points via the spherical
 * law of cosines, clamped for float safety. This mirrors the SQL used for the
 * `distance_km` column and the ORDER BY, so the JS reference and the DB agree.
 */
export function haversineKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const cosine =
    Math.cos(toRadians(aLat)) *
      Math.cos(toRadians(bLat)) *
      Math.cos(toRadians(bLng) - toRadians(aLng)) +
    Math.sin(toRadians(aLat)) * Math.sin(toRadians(bLat));
  return EARTH_RADIUS_KM * Math.acos(Math.max(-1, Math.min(1, cosine)));
}

export type GeoItem = {
  latitude: number | null;
  longitude: number | null;
};

/** Annotate each item with its distance from the user and sort nearest-first. */
export function sortByDistance<T extends GeoItem>(
  items: T[],
  userLat: number,
  userLng: number,
): Array<T & { distanceKm: number | null }> {
  return items
    .map((item) => ({
      ...item,
      distanceKm:
        item.latitude == null || item.longitude == null
          ? null
          : haversineKm(userLat, userLng, item.latitude, item.longitude),
    }))
    .sort((a, b) => {
      // Items without coordinates sink to the bottom (nulls last).
      if (a.distanceKm == null) return b.distanceKm == null ? 0 : 1;
      if (b.distanceKm == null) return -1;
      return a.distanceKm - b.distanceKm;
    });
}

/**
 * Models the nearby selection: providers within `radiusKm` sorted by distance,
 * but if none qualify the radius is dropped and the globally nearest providers
 * are returned instead (the "expanding radius" fallback) — so the result is never
 * empty just because the visitor's own area has no services.
 */
export function selectNearby<T extends GeoItem>(
  items: T[],
  userLat: number,
  userLng: number,
  radiusKm: number | null,
): { results: Array<T & { distanceKm: number | null }>; expanded: boolean } {
  const sorted = sortByDistance(items, userLat, userLng);
  if (radiusKm == null || radiusKm <= 0) {
    return { results: sorted, expanded: false };
  }
  const within = sorted.filter(
    (item) => item.distanceKm != null && item.distanceKm <= radiusKm,
  );
  if (within.length > 0) return { results: within, expanded: false };
  return { results: sorted, expanded: sorted.length > 0 };
}

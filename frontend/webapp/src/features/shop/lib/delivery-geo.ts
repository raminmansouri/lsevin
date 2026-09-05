/**
 * Delivery-method geographic eligibility (SHP-V03-012).
 *
 * Pure, dependency-free so it can be unit-tested and reused on both the quote
 * path and the server-authoritative place-order check. The rule shape lives in
 * `shop.delivery_methods.rules.geo`.
 */

export type GeoRules = {
  geo?: {
    /** allow-list: if non-empty, only these ISO country codes are served */
    includeCountries?: string[];
    /** deny-list: never served, wins over includeCountries */
    excludeCountries?: string[];
    /** state/region allow-list, applied only when a region is supplied */
    includeRegions?: string[];
    /** additive fee for matching countries/regions (method's base currency) */
    surcharges?: Array<{ countries?: string[]; regions?: string[]; amount: number }>;
    /** ETA replacement for matching countries */
    etaOverrides?: Array<{ countries?: string[]; minDays?: number; maxDays?: number }>;
  };
};

export type GeoMethod = {
  baseFee: number;
  etaMin: number | null;
  etaMax: number | null;
  rules: unknown;
};

export type GeoDestination = { country?: string | null; region?: string | null };

const up = (s?: string | null) => (s ?? "").trim().toUpperCase();
const listHas = (list: string[] | undefined, v: string) =>
  Array.isArray(list) && list.some((x) => up(x) === v);

/**
 * Returns null when the method does not serve the destination, otherwise the
 * method's effective fee + ETA with any country/region surcharge and ETA
 * override folded in. With no destination yet, the method is kept visible.
 */
export function applyGeoRules(
  method: GeoMethod,
  dest: GeoDestination
): { baseFee: number; etaMin: number | null; etaMax: number | null } | null {
  const geo = ((method.rules ?? {}) as GeoRules).geo;
  if (!geo) return { baseFee: method.baseFee, etaMin: method.etaMin, etaMax: method.etaMax };

  const country = up(dest.country);
  const region = up(dest.region);

  if (country) {
    if (geo.excludeCountries && listHas(geo.excludeCountries, country)) return null;
    if (geo.includeCountries && geo.includeCountries.length && !listHas(geo.includeCountries, country)) return null;
    if (geo.includeRegions && geo.includeRegions.length && region && !listHas(geo.includeRegions, region)) return null;
  }

  let baseFee = method.baseFee;
  let etaMin = method.etaMin;
  let etaMax = method.etaMax;

  if (country) {
    for (const s of geo.surcharges ?? []) {
      if (listHas(s.countries, country) || (region && listHas(s.regions, region))) {
        baseFee += Number(s.amount) || 0;
      }
    }
    for (const o of geo.etaOverrides ?? []) {
      if (listHas(o.countries, country)) {
        if (typeof o.minDays === "number") etaMin = o.minDays;
        if (typeof o.maxDays === "number") etaMax = o.maxDays;
      }
    }
  }

  return { baseFee, etaMin, etaMax };
}

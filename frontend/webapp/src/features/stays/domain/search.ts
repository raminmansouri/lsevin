/**
 * Explore/search query (H01, H02). The URL is the state: every filter lives in
 * the query string so refresh, back/forward and shared links reproduce the same
 * results. `toSearchParams` writes one canonical form (fixed key order, defaults
 * omitted) so equal searches have equal URLs.
 */
import { isIsoDate } from "@/features/tours/domain/calendar";

import { DEFAULT_RADIUS_M, formatNear, parseNear, parseRadius, type NearRef, type RadiusM } from "./geo";

/** sessionStorage key: the last results URL, so "back" and the stays home return to it. */
export const LAST_EXPLORE_KEY = "stays:last-explore";

export const PROPERTY_KINDS = [
  "hotel",
  "hotel_apartment",
  "boutique",
  "traditional",
  "motel",
  "hostel",
  "guesthouse",
  "villa",
  "apartment",
  "suite",
  "cottage",
  "ecolodge",
] as const;
export type PropertyKind = (typeof PROPERTY_KINDS)[number];

/** Kinds sold as one exclusive unit by default (stock 1). */
export const ENTIRE_PLACE_KINDS: readonly PropertyKind[] = ["villa", "apartment", "suite", "cottage", "ecolodge"];

export const MEAL_PLANS = ["room_only", "breakfast", "half_board", "full_board"] as const;
export type MealPlan = (typeof MEAL_PLANS)[number];

/** "distance" only applies when the search is anchored to a place (`near`). */
export const SORTS = ["recommended", "price_asc", "price_desc", "rating", "stars", "distance"] as const;
export type StaySort = (typeof SORTS)[number];

export type StaySearch = {
  city: string | null;
  q: string | null;
  checkIn: string | null;
  checkOut: string | null;
  adults: number;
  childAges: number[];
  rooms: number;
  kinds: PropertyKind[];
  stars: number[];
  amenities: string[];
  minPrice: number | null;
  maxPrice: number | null;
  minRating: number | null;
  freeCancellation: boolean;
  instantOnly: boolean;
  accessible: boolean;
  availableOnly: boolean;
  /** At least one bookable rate with breakfast (or more meals) included. */
  breakfast: boolean;
  /** Anchor place for distance filtering/sorting; see domain/geo.ts. */
  near: NearRef | null;
  /** Maximum straight-line distance from `near`, in metres (null = no limit, sort only). */
  radius: RadiusM | null;
  sort: StaySort;
  page: number;
};

export const DEFAULT_SEARCH: StaySearch = {
  city: null,
  q: null,
  checkIn: null,
  checkOut: null,
  adults: 2,
  childAges: [],
  rooms: 1,
  kinds: [],
  stars: [],
  amenities: [],
  minPrice: null,
  maxPrice: null,
  minRating: null,
  freeCancellation: false,
  instantOnly: false,
  accessible: false,
  availableOnly: false,
  breakfast: false,
  near: null,
  radius: null,
  sort: "recommended",
  page: 1,
};

type Raw = Record<string, string | string[] | undefined> | URLSearchParams;

function get(raw: Raw, key: string): string | null {
  if (raw instanceof URLSearchParams) return raw.get(key);
  const v = raw[key];
  return Array.isArray(v) ? (v[0] ?? null) : (v ?? null);
}

function int(value: string | null, min: number, max: number, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n >= min && n <= max ? n : fallback;
}

function list(value: string | null): string[] {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

const SLUG = /^[a-z0-9][a-z0-9-]{0,60}$/;
const CODE = /^[a-z][a-z0-9_]{1,40}$/;

export function parseStaySearch(raw: Raw): StaySearch {
  const checkIn = get(raw, "in");
  const checkOut = get(raw, "out");
  const validDates = isIsoDate(checkIn) && isIsoDate(checkOut) && checkOut! > checkIn!;
  const price = (k: string) => {
    const n = Number(get(raw, k));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  };
  const q = (get(raw, "q") ?? "").trim().slice(0, 80);
  const city = get(raw, "city");
  const sort = get(raw, "sort") as StaySort | null;
  const rating = Number(get(raw, "rating"));
  const near = parseNear(get(raw, "near"));
  // A radius without an anchor means nothing; an anchor without a radius gets the default.
  const radius = near ? (get(raw, "r") === "any" ? null : (parseRadius(get(raw, "r")) ?? DEFAULT_RADIUS_M)) : null;
  const sortValid = sort && (SORTS as readonly string[]).includes(sort) && (sort !== "distance" || near);
  return {
    city: city && SLUG.test(city) ? city : null,
    q: q || null,
    checkIn: validDates ? checkIn : null,
    checkOut: validDates ? checkOut : null,
    adults: int(get(raw, "adults"), 1, 30, DEFAULT_SEARCH.adults),
    childAges: list(get(raw, "ages"))
      .map(Number)
      .filter((a) => Number.isInteger(a) && a >= 0 && a <= 17)
      .slice(0, 10),
    rooms: int(get(raw, "rooms"), 1, 5, 1),
    kinds: [...new Set(list(get(raw, "type")).filter((k): k is PropertyKind => (PROPERTY_KINDS as readonly string[]).includes(k)))],
    stars: [...new Set(list(get(raw, "stars")).map(Number).filter((s) => Number.isInteger(s) && s >= 1 && s <= 5))].sort(),
    amenities: [...new Set(list(get(raw, "amen")).filter((c) => CODE.test(c)))].slice(0, 12).sort(),
    minPrice: price("min"),
    maxPrice: price("max"),
    minRating: [3, 3.5, 4, 4.5].includes(rating) ? rating : null,
    freeCancellation: get(raw, "free") === "1",
    instantOnly: get(raw, "instant") === "1",
    accessible: get(raw, "access") === "1",
    availableOnly: get(raw, "avail") === "1",
    breakfast: get(raw, "bf") === "1",
    near,
    radius,
    sort: sortValid ? sort! : "recommended",
    page: int(get(raw, "page"), 1, 200, 1),
  };
}

export function toSearchParams(s: Partial<StaySearch>, opts: { omitCity?: boolean } = {}): URLSearchParams {
  const p = new URLSearchParams();
  const d = DEFAULT_SEARCH;
  if (s.city && !opts.omitCity) p.set("city", s.city);
  if (s.q) p.set("q", s.q);
  if (s.checkIn && s.checkOut) {
    p.set("in", s.checkIn);
    p.set("out", s.checkOut);
  }
  if (s.adults != null && s.adults !== d.adults) p.set("adults", String(s.adults));
  if (s.childAges?.length) p.set("ages", s.childAges.join(","));
  if (s.rooms != null && s.rooms !== d.rooms) p.set("rooms", String(s.rooms));
  if (s.kinds?.length) p.set("type", [...s.kinds].sort().join(","));
  if (s.stars?.length) p.set("stars", [...s.stars].sort().join(","));
  if (s.amenities?.length) p.set("amen", [...s.amenities].sort().join(","));
  if (s.minPrice) p.set("min", String(s.minPrice));
  if (s.maxPrice) p.set("max", String(s.maxPrice));
  if (s.minRating) p.set("rating", String(s.minRating));
  if (s.freeCancellation) p.set("free", "1");
  if (s.instantOnly) p.set("instant", "1");
  if (s.accessible) p.set("access", "1");
  if (s.availableOnly) p.set("avail", "1");
  if (s.breakfast) p.set("bf", "1");
  if (s.near) {
    p.set("near", formatNear(s.near));
    if (s.radius == null) p.set("r", "any");
    else if (s.radius !== DEFAULT_RADIUS_M) p.set("r", String(s.radius));
  }
  if (s.sort && s.sort !== "recommended" && (s.sort !== "distance" || s.near)) p.set("sort", s.sort);
  if (s.page && s.page > 1) p.set("page", String(s.page));
  return p;
}

/** Only the stay itself (dates + party) — carried from results to a property page. */
export function stayQueryOnly(s: Partial<StaySearch>): URLSearchParams {
  return toSearchParams({ checkIn: s.checkIn, checkOut: s.checkOut, adults: s.adults, childAges: s.childAges, rooms: s.rooms });
}

/** The search with every narrowing filter removed (destination, dates, party and place kept). */
export function withoutFilters(s: StaySearch): StaySearch {
  return {
    ...s,
    kinds: [],
    stars: [],
    amenities: [],
    minPrice: null,
    maxPrice: null,
    minRating: null,
    freeCancellation: false,
    instantOnly: false,
    accessible: false,
    availableOnly: false,
    breakfast: false,
    page: 1,
  };
}

/** Number of narrowing filters applied (for the "Filters (3)" badge). */
export function activeFilterCount(s: StaySearch): number {
  return (
    s.kinds.length +
    s.stars.length +
    s.amenities.length +
    (s.minPrice ? 1 : 0) +
    (s.maxPrice ? 1 : 0) +
    (s.minRating ? 1 : 0) +
    (s.freeCancellation ? 1 : 0) +
    (s.instantOnly ? 1 : 0) +
    (s.accessible ? 1 : 0) +
    (s.availableOnly ? 1 : 0) +
    (s.breakfast ? 1 : 0)
  );
}

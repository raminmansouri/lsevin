import "server-only";

import db from "@/config/database/db";
import { pickTranslation } from "@/features/tours/domain/content";
import { normalizeSearchText } from "@/features/tours/domain/text";

import { normalizeRules } from "../domain/cancellation";
import { nightsBetween, todayIn, validateStayDates } from "../domain/dates";
import { occupancyFits, quoteStay, StayQuoteError, type Occupancy, type RatePlanPricing, type RoomCapacity } from "../domain/pricing";
import { distanceM, parseNear as parseNearRef, type NearRef } from "../domain/geo";
import { RADII_M } from "../domain/geo";
import { activeFilterCount, DEFAULT_SEARCH, withoutFilters, type MealPlan, type PropertyKind, type StaySearch } from "../domain/search";
import type {
  Amenity,
  Landmark,
  SearchAnchor,
  CityDetail,
  CitySummary,
  PropertyCard,
  PropertyDetail,
  RatePlanOffer,
  ReviewItem,
  RoomOffer,
  SearchResult,
  Text,
} from "../types";

import { STAY_CONTENT_FALLBACKS } from "../domain/locales";
import { getStaySettings } from "./settings";
import { withoutChosenParents } from "../domain/amenities";

/**
 * Customer-facing reads (H01–H05, H13, H14, H17). Only published properties in
 * published cities are ever returned outside admin preview. Prices shown with
 * dates are computed by the same quoteStay() the checkout uses, so a result
 * card can never show a total the checkout would not charge.
 */

type Tr = Record<string, string> | null;
const FALLBACKS = STAY_CONTENT_FALLBACKS;

export function pick(tr: unknown, locale: string): Text {
  return pickTranslation((tr ?? null) as Tr, locale, FALLBACKS);
}
export function pickStr(tr: unknown, locale: string): string {
  return pick(tr, locale)?.value ?? "";
}

const num = (v: unknown) => (v == null ? null : Number(v));

// Cities ---------------------------------------------------------------------

export async function listCities(locale: string, opts: { withProperties?: boolean; featuredOnly?: boolean } = {}): Promise<CitySummary[]> {
  const rows = await db<any[]>`
    select c.id::text, c.slug, c.name, c.region, c.cover_url, c.cover_alt, c.cover_credit, c.is_featured,
           count(p.id)::int as n, min(p.from_price) as from_price, min(p.currency_code) as currency
      from stay.cities c
      left join stay.properties p on p.city_id = c.id and p.status = 'published'
     where c.is_published
       and (${opts.featuredOnly ?? false}::boolean = false or c.is_featured)
     group by c.id
    having (${opts.withProperties ?? true}::boolean = false or count(p.id) > 0)
     order by c.sort_order, c.slug
  `;
  return rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    name: pickStr(r.name, locale),
    region: pick(r.region, locale)?.value ?? null,
    coverUrl: r.cover_url,
    coverAlt: pick(r.cover_alt, locale)?.value ?? pickStr(r.name, locale),
    coverCredit: r.cover_credit,
    propertyCount: r.n,
    fromPrice: num(r.from_price),
    currency: r.currency,
    isFeatured: r.is_featured,
  }));
}

export async function getCity(slug: string, locale: string): Promise<CityDetail | null> {
  const [r] = await db<any[]>`
    select c.id::text, c.slug, c.name, c.region, c.intro, c.cover_url, c.cover_alt, c.cover_credit, c.is_featured, c.latitude, c.longitude,
           (select count(*)::int from stay.properties p where p.city_id = c.id and p.status = 'published') as n,
           (select min(p.from_price) from stay.properties p where p.city_id = c.id and p.status = 'published') as from_price,
           (select min(p.currency_code) from stay.properties p where p.city_id = c.id and p.status = 'published') as currency
      from stay.cities c
     where c.slug = ${slug} and c.is_published
  `;
  if (!r) return null;
  return {
    id: r.id,
    slug: r.slug,
    name: pickStr(r.name, locale),
    region: pick(r.region, locale)?.value ?? null,
    intro: pick(r.intro, locale),
    coverUrl: r.cover_url,
    coverAlt: pick(r.cover_alt, locale)?.value ?? pickStr(r.name, locale),
    coverCredit: r.cover_credit,
    propertyCount: r.n,
    fromPrice: num(r.from_price),
    currency: r.currency,
    isFeatured: r.is_featured,
    latitude: num(r.latitude),
    longitude: num(r.longitude),
  };
}

// Amenities -------------------------------------------------------------------

export async function listAmenities(locale: string): Promise<Amenity[]> {
  const rows = await db<any[]>`select a.code, a.grp, a.label, a.icon, a.parent_code, m.file_url from stay.amenities a left join media.media_library m on m.id = a.image_id and m.is_public where a.is_active order by a.sort_order, a.code`;
  return rows.map((r) => ({ code: r.code, group: r.grp, imageUrl: r.file_url, parentCode: r.parent_code, label: pickStr(r.label, locale) || r.code, icon: r.icon }));
}

// Availability candidates ----------------------------------------------------

type Candidate = {
  propertyId: string;
  roomTypeId: string;
  ratePlanId: string;
  units: number;
  capacity: RoomCapacity;
  rate: RatePlanPricing;
  refundable: boolean;
  mealPlan: MealPlan;
  rpCode: string;
  rpName: unknown;
  minLeft: number | null;
  blocked: boolean;
  closedToArrival: boolean;
  minNightsOverride: number | null;
  legacyLocked: boolean;
  overrides: Record<string, number>;
};

let legacyTable: boolean | null = null;
async function hasLegacyHotelLocks(): Promise<boolean> {
  if (legacyTable == null) {
    const [r] = await db<{ ok: boolean }[]>`select to_regclass('provider_portal.hotel_date_availability') is not null as ok`;
    legacyTable = Boolean(r?.ok);
  }
  return legacyTable;
}

/**
 * Every active rate plan of the given properties with, when dates are given,
 * the per-night availability over [checkIn, checkOut) and dated prices.
 * Nights without an inventory row have the room type's full units.
 */
async function loadCandidates(propertyIds: string[], checkIn: string | null, checkOut: string | null): Promise<Candidate[]> {
  if (propertyIds.length === 0) return [];
  const withDates = Boolean(checkIn && checkOut);
  const nights = withDates ? nightsBetween(checkIn!, checkOut!) : 0;
  const legacy = withDates && (await hasLegacyHotelLocks());
  const rows = await db<any[]>`
    select p.id::text as property_id, p.inventory_model, p.service_provider_id::text as provider_id,
           rt.id::text as room_type_id, rt.units, rt.base_occupancy, rt.max_adults, rt.max_children, rt.max_occupancy,
           rp.id::text as rate_plan_id, rp.code as rp_code, rp.name as rp_name, rp.meal_plan, rp.refundable,
           rp.base_price, rp.extra_adult_price, rp.child_price, rp.min_nights, rp.max_nights, rp.long_stay_nights, rp.long_stay_percent,
           inv.n_rows, inv.min_left_rows, coalesce(inv.blocked, false) as blocked, coalesce(inv.cta, false) as cta, inv.mn,
           ov.overrides
      from stay.properties p
      join stay.room_types rt on rt.property_id = p.id and rt.is_active
      join stay.rate_plans rp on rp.room_type_id = rt.id and rp.is_active
      left join lateral (
        select count(*)::int as n_rows,
               min(coalesce(i.units_override, rt.units) - i.sold - i.held)::int as min_left_rows,
               bool_or(i.stop_sell) as blocked,
               bool_or(i.closed_to_arrival and i.stay_date = ${checkIn}::date) as cta,
               max(i.min_nights) filter (where i.stay_date = ${checkIn}::date) as mn
          from stay.inventory i
         where ${withDates}::boolean and i.room_type_id = rt.id and i.stay_date >= ${checkIn}::date and i.stay_date < ${checkOut}::date
      ) inv on true
      left join lateral (
        select jsonb_object_agg(o.stay_date::text, o.price) as overrides
          from stay.rate_overrides o
         where ${withDates}::boolean and o.rate_plan_id = rp.id and o.stay_date >= ${checkIn}::date and o.stay_date < ${checkOut}::date
      ) ov on true
     where p.id = any(${propertyIds}::uuid[])
     order by rp.sort_order, rp.base_price
  `;
  let lockedProviders = new Set<string>();
  if (legacy) {
    const providers = [...new Set(rows.filter((r) => r.inventory_model === "entire_place").map((r) => r.provider_id))];
    if (providers.length) {
      const locks = await db<{ id: string }[]>`
        select distinct service_provider_id::text as id from provider_portal.hotel_date_availability
         where service_provider_id = any(${providers}::uuid[]) and stay_date >= ${checkIn}::date and stay_date < ${checkOut}::date`;
      lockedProviders = new Set(locks.map((l) => l.id));
    }
  }
  return rows.map((r) => {
    let minLeft: number | null = null;
    if (withDates) {
      const fromRows = r.min_left_rows == null ? r.units : Number(r.min_left_rows);
      minLeft = Number(r.n_rows) < nights ? Math.min(r.units, fromRows) : fromRows;
    }
    const overrides: Record<string, number> = {};
    for (const [k, v] of Object.entries((r.overrides ?? {}) as Record<string, unknown>)) overrides[k] = Number(v);
    return {
      propertyId: r.property_id,
      roomTypeId: r.room_type_id,
      ratePlanId: r.rate_plan_id,
      units: r.units,
      capacity: { baseOccupancy: r.base_occupancy, maxAdults: r.max_adults, maxChildren: r.max_children, maxOccupancy: r.max_occupancy, units: r.units },
      rate: {
        id: r.rate_plan_id,
        basePrice: Number(r.base_price),
        extraAdultPrice: Number(r.extra_adult_price),
        childPrice: Number(r.child_price),
        minNights: r.min_nights,
        maxNights: r.max_nights,
        longStayNights: r.long_stay_nights,
        longStayPercent: r.long_stay_percent == null ? null : Number(r.long_stay_percent),
      },
      refundable: r.refundable,
      mealPlan: r.meal_plan,
      rpCode: r.rp_code,
      rpName: r.rp_name,
      minLeft,
      blocked: Boolean(r.blocked),
      closedToArrival: Boolean(r.cta),
      minNightsOverride: r.mn == null ? null : Number(r.mn),
      legacyLocked: r.inventory_model === "entire_place" && lockedProviders.has(r.provider_id),
      overrides,
    };
  });
}

type PropertyPricing = { currencyDecimals: number; childFreeUnderAge: number; taxPercent: number; currency: string };

/** Why a candidate cannot be sold for this stay, or null. Mirrors stay.place_hold. */
function unavailableReason(c: Candidate, occupancy: Occupancy, checkIn: string | null, checkOut: string | null): string | null {
  if (!occupancyFits(occupancy, c.capacity)) return "does_not_fit";
  if (!checkIn || !checkOut) return null;
  const nights = nightsBetween(checkIn, checkOut);
  if (c.legacyLocked) return "sold_out";
  if (c.blocked) return "sold_out";
  if (c.closedToArrival) return "closed_to_arrival";
  if (nights < Math.max(c.rate.minNights, c.minNightsOverride ?? 0)) return "min_nights";
  if (nights > c.rate.maxNights) return "max_nights";
  if ((c.minLeft ?? 0) < occupancy.rooms) return "sold_out";
  return null;
}

function tryQuote(c: Candidate, p: PropertyPricing, occupancy: Occupancy, checkIn: string, checkOut: string, serviceFeePercent: number, maxRooms: number) {
  try {
    return quoteStay({
      currency: p.currency,
      currencyDecimals: p.currencyDecimals,
      checkIn,
      checkOut,
      occupancy,
      capacity: c.capacity,
      rate: { ...c.rate, minNights: Math.max(c.rate.minNights, c.minNightsOverride ?? 0) },
      overrides: c.overrides,
      childFreeUnderAge: p.childFreeUnderAge,
      taxPercent: p.taxPercent,
      serviceFeePercent,
      maxRooms,
    });
  } catch (e) {
    if (e instanceof StayQuoteError) return null;
    throw e;
  }
}

async function currencyDecimals(codes: string[]): Promise<Record<string, number>> {
  if (codes.length === 0) return {};
  const rows = await db<{ code: string; d: number }[]>`select code, decimal_digits as d from finance.currencies where code = any(${codes})`.catch(() => []);
  const out: Record<string, number> = {};
  for (const c of codes) out[c] = c === "IRR" || c === "IRT" ? 0 : 2;
  for (const r of rows) out[r.code] = Number(r.d);
  return out;
}

// Search -------------------------------------------------------------------------

const PAGE_SIZE = 20;
const MAX_CANDIDATE_PROPERTIES = 600;

export async function searchProperties(s: StaySearch, locale: string, opts: { pageSize?: number } = {}): Promise<SearchResult> {
  const [settings, anchor] = await Promise.all([getStaySettings(), s.near ? resolveAnchor(s.near, locale) : Promise.resolve(null)]);
  const aLat = anchor?.latitude ?? null;
  const aLng = anchor?.longitude ?? null;
  // An anchor that no longer exists (deleted landmark, bad link) must not silently widen the search to everything.
  const radius = s.near && !anchor ? 0 : anchor ? s.radius : null;
  const pageSize = opts.pageSize ?? PAGE_SIZE;
  const dateError = s.checkIn && s.checkOut
    ? validateStayDates(s.checkIn, s.checkOut, { today: todayIn(), maxNights: settings.maxNights, windowDays: settings.bookingWindowDays })
    : null;
  const checkIn = s.checkIn && s.checkOut && !dateError ? s.checkIn : null;
  const checkOut = checkIn ? s.checkOut : null;
  const occupancy: Occupancy = { rooms: Math.min(s.rooms, settings.maxRooms), adults: Math.max(s.adults, s.rooms), childAges: s.childAges };
  const folded = s.q ? normalizeSearchText(s.q) : "";
  const q = folded ? `%${folded.replace(/[%_\\]/g, (m) => `\\${m}`)}%` : null;

  const props = await db<any[]>`
    select p.id::text, p.slug, p.name, p.kind, p.star_rating, p.rating_avg, p.review_count, p.amenity_codes, p.confirmation_mode,
           p.step_free_access, p.medical_friendly, p.currency_code, p.tax_percent, p.child_free_under_age, p.popularity, p.is_featured,
           p.latitude, p.longitude, p.location_privacy, p.published_at,
           case when ${aLat}::float8 is null or p.latitude is null then null
                else stay.distance_m(${aLat}::float8, ${aLng}::float8, p.latitude::float8, p.longitude::float8) end as dist,
           c.slug as city_slug, c.name as city_name,
           (select m.url from stay.media m where m.property_id = p.id and m.room_type_id is null order by m.is_cover desc, m.sort_order limit 1) as cover_url,
           (select m.alt from stay.media m where m.property_id = p.id and m.room_type_id is null order by m.is_cover desc, m.sort_order limit 1) as cover_alt,
           exists (select 1 from stay.rate_plans rp join stay.policies po on po.id = p.current_policy_id
                    where rp.property_id = p.id and rp.is_active and rp.refundable
                      and exists (select 1 from jsonb_array_elements(po.rules) r where (r->>'refundPercent')::int >= 100)) as free_cancel
      from stay.properties p
      join stay.cities c on c.id = p.city_id and c.is_published
     where p.status = 'published'
       and (${s.city}::text is null or c.slug = ${s.city})
       and (${q}::text is null or p.search_text ilike ${q} or translate(lower(c.name::text), 'يىكأإآٱةؤ', 'ییکااااهو') like ${q})
       and (cardinality(${s.kinds}::text[]) = 0 or p.kind = any(${s.kinds}::text[]))
       and (cardinality(${s.stars}::int[]) = 0 or p.star_rating = any(${s.stars}::int[]))
       and p.amenity_codes @> ${s.amenities}::text[]
       and (${s.minRating}::numeric is null or p.rating_avg >= ${s.minRating}::numeric)
       and (${s.instantOnly}::boolean = false or p.confirmation_mode = 'instant')
       and (${s.accessible}::boolean = false or p.step_free_access)
       and (${radius}::float8 is null
            or (p.latitude is not null and ${aLat}::float8 is not null
                and stay.distance_m(${aLat}::float8, ${aLng}::float8, p.latitude::float8, p.longitude::float8) <= ${radius}::float8))
     order by p.is_featured desc, p.popularity desc, p.published_at desc nulls last
     limit ${MAX_CANDIDATE_PROPERTIES}
  `;
  const candidates = await loadCandidates(props.map((p) => p.id), checkIn, checkOut);
  const decimals = await currencyDecimals([...new Set(props.map((p) => p.currency_code as string))]);
  const byProperty = new Map<string, Candidate[]>();
  for (const c of candidates) byProperty.set(c.propertyId, [...(byProperty.get(c.propertyId) ?? []), c]);

  let cards: (PropertyCard & { _rank: number })[] = [];
  props.forEach((p, idx) => {
    const list = byProperty.get(p.id) ?? [];
    const pricing: PropertyPricing = { currency: p.currency_code, currencyDecimals: decimals[p.currency_code] ?? 0, childFreeUnderAge: p.child_free_under_age, taxPercent: Number(p.tax_percent) };
    // "Breakfast included": only rates with at least breakfast count, so the prices shown are for those rates.
    const fitting = list.filter((c) => occupancyFits(occupancy, c.capacity) && (!s.breakfast || c.mealPlan !== "room_only"));
    let total: number | null = null;
    let nights: number | null = null;
    let unitsLeft: number | null = null;
    let available: boolean | null = null;
    let fromNightly: number | null = null;
    if (fitting.length) fromNightly = Math.min(...fitting.map((c) => c.rate.basePrice));
    if (checkIn && checkOut) {
      nights = nightsBetween(checkIn, checkOut);
      let best: { total: number; left: number | null } | null = null;
      for (const c of fitting) {
        if (unavailableReason(c, occupancy, checkIn, checkOut)) continue;
        const qte = tryQuote(c, pricing, occupancy, checkIn, checkOut, settings.serviceFeePercent, settings.maxRooms);
        if (qte && (!best || qte.total < best.total)) best = { total: qte.total, left: c.minLeft };
      }
      available = Boolean(best);
      total = best?.total ?? null;
      unitsLeft = best?.left ?? null;
    }
    const freeCancellation = Boolean(p.free_cancel);
    if (s.freeCancellation && !freeCancellation) return;
    if (s.availableOnly && available === false) return;
    if (fitting.length === 0) return; // nothing at this property can host the party
    // Price filters are per night (how guests compare hotel prices), with or without dates.
    const priceForFilter = total != null && nights ? Math.round(total / nights) : fromNightly;
    if (s.minPrice && (priceForFilter == null || priceForFilter < s.minPrice)) return;
    if (s.maxPrice && (priceForFilter == null || priceForFilter > s.maxPrice)) return;
    const approximate = p.location_privacy === "approximate";
    cards.push({
      _rank: idx,
      id: p.id,
      slug: p.slug,
      name: pickStr(p.name, locale),
      kind: p.kind as PropertyKind,
      starRating: p.star_rating,
      city: { slug: p.city_slug, name: pickStr(p.city_name, locale) },
      coverUrl: p.cover_url,
      coverAlt: pick(p.cover_alt, locale)?.value ?? pickStr(p.name, locale),
      ratingAvg: num(p.rating_avg),
      reviewCount: p.review_count,
      amenities: p.amenity_codes ?? [],
      instant: p.confirmation_mode === "instant",
      freeCancellation,
      accessible: Boolean(p.step_free_access),
      medicalFriendly: Boolean(p.medical_friendly),
      currency: p.currency_code,
      total,
      nights,
      fromNightly,
      unitsLeft,
      available,
      latitude: p.latitude == null ? null : roundCoord(Number(p.latitude), approximate),
      longitude: p.longitude == null ? null : roundCoord(Number(p.longitude), approximate),
      approximate,
      distanceM: p.dist == null ? null : approximate ? Math.max(500, Math.round(Number(p.dist) / 500) * 500) : Math.round(Number(p.dist)),
      breakfastIncluded: fitting.some((c) => c.mealPlan !== "room_only"),
      highlights: [],
    });
  });

  const priceOf = (c: PropertyCard) => c.total ?? c.fromNightly ?? Number.POSITIVE_INFINITY;
  const prices = cards.map(priceOf).filter(Number.isFinite);
  const priceBounds = prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
  // Available stays first when dates are known, then the requested order.
  const availFirst = (a: PropertyCard, b: PropertyCard) => Number(b.available !== false) - Number(a.available !== false);
  const nightlyOf = (c: PropertyCard) => (c.total != null && c.nights ? c.total / c.nights : c.fromNightly);
  const nightly = cards.map(nightlyOf).filter((v): v is number => v != null).sort((a, b) => a - b);
  const valueLine = nightly.length >= 4 ? nightly[Math.floor(nightly.length / 4)] : null;
  const scoreOf = new Map<string, number>();
  for (const c of cards) {
    const h: PropertyCard["highlights"] = [];
    if (c.distanceM != null && !c.approximate && c.distanceM <= 1200) h.push("walkable");
    if ((c.ratingAvg ?? 0) >= 4.5 && c.reviewCount >= 3) h.push("top_rated");
    const n = nightlyOf(c);
    if (valueLine != null && n != null && n <= valueLine) h.push("great_value");
    c.highlights = h;
    scoreOf.set(c.id, matchScore(c, cards.length, c._rank, radius));
  }
  const order: Record<string, (a: PropertyCard & { _rank: number }, b: PropertyCard & { _rank: number }) => number> = {
    // Best match: closeness to the chosen place, guest rating, availability and flexibility — see matchScore().
    recommended: (a, b) => scoreOf.get(b.id)! - scoreOf.get(a.id)! || a._rank - b._rank,
    distance: (a, b) => (a.distanceM ?? Number.POSITIVE_INFINITY) - (b.distanceM ?? Number.POSITIVE_INFINITY) || a._rank - b._rank,
    price_asc: (a, b) => priceOf(a) - priceOf(b) || a._rank - b._rank,
    price_desc: (a, b) => priceOf(b) - priceOf(a) || a._rank - b._rank,
    rating: (a, b) => (b.ratingAvg ?? 0) - (a.ratingAvg ?? 0) || b.reviewCount - a.reviewCount || a._rank - b._rank,
    stars: (a, b) => (b.starRating ?? 0) - (a.starRating ?? 0) || a._rank - b._rank,
  };
  cards = cards.sort((a, b) => availFirst(a, b) || order[s.sort](a, b));
  const start = (s.page - 1) * pageSize;
  return {
    items: cards.slice(start, start + pageSize).map(({ _rank: _r, ...c }) => c),
    total: cards.length,
    page: s.page,
    pageSize,
    priceBounds,
    anchor,
  };
}

/**
 * "Best match" (default sort). Transparent and deliberately simple:
 *   - distance to the chosen place (when there is one) weighs most — it is why the guest set it;
 *   - guest rating, damped when there are few reviews; star category;
 *   - bookable for the dates, free cancellation, instant confirmation;
 *   - the editorial order (featured, popularity) breaks near-ties.
 */
function matchScore(c: PropertyCard, count: number, rank: number, radius: number | null): number {
  let score = 0;
  if (c.distanceM != null) score += 40 * Math.max(0, 1 - c.distanceM / Math.max(radius ?? 5000, 1000));
  const reviews = Math.min(c.reviewCount, 20) / 20;
  score += ((c.ratingAvg ?? 4) / 5) * 20 * (0.5 + 0.5 * reviews);
  score += (c.starRating ?? 2) * 2;
  if (c.available === true) score += 15;
  if (c.freeCancellation) score += 4;
  if (c.instant) score += 3;
  score += 10 * (1 - rank / Math.max(count, 1));
  return score;
}

export type ExploreSuggestions = {
  /** Stays found when every filter is removed (null: there were no filters). */
  withoutFilters: number | null;
  /** The nearest larger radius that finds stays (null: no place, or none helps). */
  widerRadius: { radius: number | null; count: number } | null;
  /** A few well-rated stays for the same trip, so an empty search is never a dead end. */
  popular: PropertyCard[];
};

/**
 * Ways out of an empty result (H02): what removing filters or widening the
 * distance would find, plus popular stays for the same dates and party —
 * in the same city when it has any, otherwise anywhere.
 */
export async function exploreSuggestions(s: StaySearch, locale: string): Promise<ExploreSuggestions> {
  const base = { ...s, page: 1 };
  const withoutFiltersCount = activeFilterCount(s) > 0 ? (await searchProperties(withoutFilters(base), locale, { pageSize: 1 })).total : null;
  let widerRadius: ExploreSuggestions["widerRadius"] = null;
  if (s.near && s.radius != null) {
    const bigger: (number | null)[] = [...RADII_M.filter((r) => r > s.radius!), null];
    for (const radius of bigger) {
      const total = (await searchProperties({ ...base, radius: radius as StaySearch["radius"] }, locale, { pageSize: 1 })).total;
      if (total > 0) {
        widerRadius = { radius, count: total };
        break;
      }
    }
  }
  const trip = { ...DEFAULT_SEARCH, checkIn: s.checkIn, checkOut: s.checkOut, adults: s.adults, childAges: s.childAges, rooms: s.rooms };
  let popular = s.city ? (await searchProperties({ ...trip, city: s.city }, locale, { pageSize: 4 })).items : [];
  if (popular.length === 0) popular = (await searchProperties(trip, locale, { pageSize: 4 })).items;
  return { withoutFilters: withoutFiltersCount, widerRadius, popular };
}

/** Where a location search is anchored, in the visitor's language. Null when the reference is unknown. */
export async function resolveAnchor(near: NearRef, locale: string): Promise<SearchAnchor | null> {
  if (near.type === "pt") return { kind: "point", name: null, latitude: near.lat, longitude: near.lng, citySlug: null };
  if (near.type === "lm") {
    const [r] = await db<any[]>`
      select l.kind, l.name, l.latitude::float8 as lat, l.longitude::float8 as lng, c.slug as city
        from stay.landmarks l join stay.cities c on c.id = l.city_id
       where c.slug = ${near.city} and l.slug = ${near.slug} and l.is_active`;
    return r ? { kind: r.kind, name: pickStr(r.name, locale), latitude: r.lat, longitude: r.lng, citySlug: r.city } : null;
  }
  const [r] = await db<any[]>`
    select name_translations, latitude::float8 as lat, longitude::float8 as lng
      from category.service_providers where id = ${near.id}::uuid and is_active and latitude is not null and longitude is not null`;
  return r ? { kind: "provider", name: pickStr(r.name_translations, locale) || null, latitude: r.lat, longitude: r.lng, citySlug: null } : null;
}

/** Landmarks of a city (or of every published city), for "near …" choices and a property's surroundings. */
export async function listLandmarks(citySlug: string | null, locale: string): Promise<Landmark[]> {
  const rows = await db<any[]>`
    select l.slug, l.kind, l.name, l.latitude::float8 as lat, l.longitude::float8 as lng, l.is_quick, c.slug as city
      from stay.landmarks l join stay.cities c on c.id = l.city_id and c.is_published
     where l.is_active and (${citySlug}::text is null or c.slug = ${citySlug})
     order by c.sort_order, l.sort_order, l.slug`;
  return rows.map((r) => ({ city: r.city, slug: r.slug, kind: r.kind, name: pickStr(r.name, locale), latitude: r.lat, longitude: r.lng, quick: r.is_quick }));
}

/** Approximate locations are snapped to a ~1 km grid so the exact door is never exposed. */
function roundCoord(v: number, approximate: boolean) {
  return approximate ? Math.round(v * 100) / 100 : v;
}

/**
 * What is around a stay: places the host listed plus the city's landmarks within
 * 15 km, nearest first. Approximate locations get distances rounded to 500 m.
 */
function mergeNearby(listed: PropertyDetail["nearby"], computed: PropertyDetail["nearby"], approximate: boolean): PropertyDetail["nearby"] {
  const seen = new Set(listed.map((n) => n.name));
  const all = [...listed, ...computed.filter((n) => n.distanceM <= 15000 && !seen.has(n.name))];
  return all
    .map((n) => (approximate ? { ...n, distanceM: Math.max(500, Math.round(n.distanceM / 500) * 500) } : n))
    .sort((a, b) => a.distanceM - b.distanceM)
    .slice(0, 8);
}

// Property detail --------------------------------------------------------------

export async function resolvePropertyId(slug: string): Promise<string | null> {
  const [r] = await db<{ id: string }[]>`select id::text from stay.properties where slug = ${slug}`;
  return r?.id ?? null;
}

export async function getPropertyDetail(
  idOrSlug: { id?: string; slug?: string },
  locale: string,
  opts: { mode: "published" | "preview"; revealExactLocation?: boolean } = { mode: "published" },
): Promise<PropertyDetail | null> {
  const [p] = await db<any[]>`
    select p.*, p.id::text as id, p.service_provider_id::text as provider_id, p.check_in_time::text as cin, p.check_out_time::text as cout,
           c.slug as city_slug, c.name as city_name, c.region as city_region, c.is_published as city_published,
           sp.name_translations as provider_name
      from stay.properties p
      join stay.cities c on c.id = p.city_id
      left join category.service_providers sp on sp.id = p.service_provider_id
     where ${idOrSlug.id ?? null}::uuid is not null and p.id = ${idOrSlug.id ?? null}::uuid
        or ${idOrSlug.slug ?? null}::text is not null and p.slug = ${idOrSlug.slug ?? null}
  `;
  if (!p) return null;
  if (opts.mode === "published" && (p.status !== "published" || !p.city_published)) return null;

  const [media, amenities, policyRows, breakdown, landmarks] = await Promise.all([
    db<any[]>`select id::text, url, alt, credit, room_type_id::text from stay.media where property_id = ${p.id}::uuid order by is_cover desc, sort_order, created_at`,
    listAmenities(locale),
    p.current_policy_id
      ? db<any[]>`select id::text, version, rules, no_show_refund_percent, texts from stay.policies where id = ${p.current_policy_id}::uuid`
      : Promise.resolve([] as any[]),
    db<any[]>`select avg(cleanliness)::float8 as c, avg(location)::float8 as l, avg(staff)::float8 as s, avg(value)::float8 as v
                from stay.reviews where property_id = ${p.id}::uuid and status = 'published'`,
    listLandmarks(p.city_slug, locale).catch(() => [] as Landmark[]),
  ]);
  const amenitySet = new Set<string>(p.amenity_codes ?? []);
  const policy = policyRows[0];
  const approximate = p.location_privacy === "approximate" && !opts.revealExactLocation;
  const [{ from_nightly } = { from_nightly: null }] = await db<any[]>`
    select min(rp.base_price) as from_nightly from stay.rate_plans rp join stay.room_types rt on rt.id = rp.room_type_id
     where rp.property_id = ${p.id}::uuid and rp.is_active and rt.is_active`;

  return {
    id: p.id,
    slug: p.slug,
    status: p.status,
    kind: p.kind,
    inventoryModel: p.inventory_model,
    starRating: p.star_rating,
    name: pick(p.name, locale),
    summary: pick(p.summary, locale),
    description: pick(p.description, locale),
    houseRules: pick(p.house_rules, locale),
    address: approximate ? null : pick(p.address, locale),
    city: { slug: p.city_slug, name: pickStr(p.city_name, locale), region: pick(p.city_region, locale)?.value ?? null },
    provider: { id: p.provider_id, name: pick(p.provider_name, locale)?.value ?? null },
    media: media.map((m) => ({ id: m.id, url: m.url, alt: pick(m.alt, locale)?.value ?? pickStr(p.name, locale), credit: m.credit, roomTypeId: m.room_type_id })),
    location:
      p.latitude == null
        ? null
        : { latitude: roundCoord(Number(p.latitude), approximate), longitude: roundCoord(Number(p.longitude), approximate), approximate, radiusM: approximate ? 1200 : 0 },
    checkInTime: String(p.cin).slice(0, 5),
    checkOutTime: String(p.cout).slice(0, 5),
    // A chosen option ("Split AC") stands in for its parent ("Cooling system").
    amenities: withoutChosenParents(amenities.filter((a) => amenitySet.has(a.code))),
    nearby: mergeNearby(
      ((p.nearby ?? []) as any[])
        .map((n) => ({ kind: String(n.kind ?? "other"), name: pickStr(n.name, locale), distanceM: Number(n.distanceM) }))
        .filter((n) => n.name && Number.isFinite(n.distanceM)),
      p.latitude == null
        ? []
        : landmarks.map((l) => ({ kind: l.kind, name: l.name, distanceM: Math.round(distanceM(Number(p.latitude), Number(p.longitude), l.latitude, l.longitude)) })),
      approximate,
    ),
    accessibility: { stepFree: p.step_free_access, accessibleBathroom: p.accessible_bathroom, verified: Boolean(p.accessibility_verified_at) },
    medicalFriendly: p.medical_friendly,
    rules: {
      pets: p.pets_allowed,
      smoking: p.smoking_allowed,
      parties: p.parties_allowed,
      familiesOnly: p.families_only,
      idRequired: p.id_required,
      childFreeUnderAge: p.child_free_under_age,
    },
    confirmationMode: p.confirmation_mode,
    requestTimeoutHours: p.request_timeout_hours,
    currency: p.currency_code,
    taxPercent: Number(p.tax_percent),
    timezone: p.timezone,
    ratingAvg: num(p.rating_avg),
    reviewCount: p.review_count,
    ratingBreakdown: { cleanliness: num(breakdown[0]?.c), location: num(breakdown[0]?.l), staff: num(breakdown[0]?.s), value: num(breakdown[0]?.v) },
    policy: policy
      ? {
          id: policy.id,
          version: policy.version,
          rules: normalizeRules(policy.rules),
          noShowRefundPercent: policy.no_show_refund_percent,
          text: pick(policy.texts, locale),
        }
      : null,
    fromNightly: num(from_nightly),
    sourceLocale: p.source_locale,
    nameLocales: Object.keys((p.name ?? {}) as Record<string, string>),
    updatedAt: new Date(p.updated_at).toISOString(),
  };
}

/** Room types and rate plans of a property, priced for the stay when dates are known (H05). */
export async function getRoomOffers(
  propertyId: string,
  stay: { checkIn: string | null; checkOut: string | null; occupancy: Occupancy },
  locale: string,
): Promise<{ rooms: RoomOffer[]; dateError: string | null }> {
  const settings = await getStaySettings();
  const [prop] = await db<any[]>`select currency_code, tax_percent, child_free_under_age, timezone from stay.properties where id = ${propertyId}::uuid`;
  if (!prop) return { rooms: [], dateError: null };
  const dateError =
    stay.checkIn || stay.checkOut
      ? validateStayDates(stay.checkIn, stay.checkOut, { today: todayIn(prop.timezone), maxNights: settings.maxNights, windowDays: settings.bookingWindowDays })
      : null;
  const checkIn = dateError ? null : stay.checkIn;
  const checkOut = dateError ? null : stay.checkOut;
  const [roomRows, mediaRows, candidates, decimals] = await Promise.all([
    db<any[]>`select id::text, code, name, description, units, base_occupancy, max_adults, max_children, max_occupancy, bed_config,
                     size_m2, bedrooms, bathrooms, amenity_codes
                from stay.room_types where property_id = ${propertyId}::uuid and is_active order by sort_order, created_at`,
    db<any[]>`select id::text, url, alt, credit, room_type_id::text from stay.media where property_id = ${propertyId}::uuid and room_type_id is not null order by sort_order`,
    loadCandidates([propertyId], checkIn, checkOut),
    currencyDecimals([prop.currency_code]),
  ]);
  const pricing: PropertyPricing = {
    currency: prop.currency_code,
    currencyDecimals: decimals[prop.currency_code] ?? 0,
    childFreeUnderAge: prop.child_free_under_age,
    taxPercent: Number(prop.tax_percent),
  };
  const rooms: RoomOffer[] = roomRows.map((rt) => {
    const plans = candidates.filter((c) => c.roomTypeId === rt.id);
    const cap: RoomCapacity = { baseOccupancy: rt.base_occupancy, maxAdults: rt.max_adults, maxChildren: rt.max_children, maxOccupancy: rt.max_occupancy, units: rt.units };
    const fitsParty = occupancyFits(stay.occupancy, cap);
    const offers: RatePlanOffer[] = plans.map((c) => {
      const reason = unavailableReason(c, stay.occupancy, checkIn, checkOut);
      const quote = !reason && checkIn && checkOut ? tryQuote(c, pricing, stay.occupancy, checkIn, checkOut, settings.serviceFeePercent, settings.maxRooms) : null;
      return {
        ratePlanId: c.ratePlanId,
        code: c.rpCode,
        name: pick(c.rpName, locale)?.value ?? null,
        mealPlan: c.mealPlan,
        refundable: c.refundable,
        nightlyFrom: c.rate.basePrice,
        quote,
        unavailableReason: reason ?? (checkIn && checkOut && !quote ? "does_not_fit" : null),
        longStay: c.rate.longStayNights && c.rate.longStayPercent ? { nights: c.rate.longStayNights, percent: c.rate.longStayPercent } : null,
        minNights: Math.max(c.rate.minNights, c.minNightsOverride ?? 0),
      };
    });
    return {
      roomTypeId: rt.id,
      code: rt.code,
      name: pickStr(rt.name, locale),
      description: pick(rt.description, locale),
      media: mediaRows.filter((m) => m.room_type_id === rt.id).map((m) => ({ id: m.id, url: m.url, alt: pick(m.alt, locale)?.value ?? pickStr(rt.name, locale), credit: m.credit, roomTypeId: rt.id })),
      baseOccupancy: rt.base_occupancy,
      maxAdults: rt.max_adults,
      maxChildren: rt.max_children,
      maxOccupancy: rt.max_occupancy,
      beds: Array.isArray(rt.bed_config) ? rt.bed_config.map((b: any) => ({ type: String(b.type), count: Number(b.count) || 1 })) : [],
      sizeM2: rt.size_m2,
      bedrooms: rt.bedrooms,
      bathrooms: rt.bathrooms,
      amenities: rt.amenity_codes ?? [],
      units: rt.units,
      unitsLeft: checkIn && checkOut ? Math.max(0, Math.min(...plans.map((c) => c.minLeft ?? 0), rt.units)) : null,
      fitsParty,
      plans: offers,
    };
  });
  return { rooms, dateError };
}

// Reviews --------------------------------------------------------------------

export async function listReviews(propertyId: string, opts: { limit?: number; offset?: number; roomTypeId?: string | null; locale?: string } = {}): Promise<ReviewItem[]> {
  const rows = await db<any[]>`
    select r.id::text, r.rating, r.cleanliness, r.location, r.staff, r.value, r.body, r.locale, r.author_name, r.created_at, r.provider_reply,
           to_char(b.check_in, 'YYYY-MM') as stay_month, b.nights, b.room_type_id::text as room_type_id, rt.name as room_name
      from stay.reviews r
      join stay.bookings b on b.booking_id = r.booking_id
      left join stay.room_types rt on rt.id = b.room_type_id
     where r.property_id = ${propertyId}::uuid and r.status = 'published'
       and (${opts.roomTypeId ?? null}::uuid is null or b.room_type_id = ${opts.roomTypeId ?? null}::uuid)
     order by r.created_at desc
     limit ${opts.limit ?? 10} offset ${opts.offset ?? 0}
  `;
  return rows.map((r) => ({
    id: r.id,
    rating: r.rating,
    scores: { cleanliness: r.cleanliness, location: r.location, staff: r.staff, value: r.value },
    body: r.body,
    locale: r.locale,
    authorName: r.author_name,
    createdAt: new Date(r.created_at).toISOString(),
    providerReply: r.provider_reply,
    stayMonth: r.stay_month,
    nights: r.nights == null ? null : Number(r.nights),
    roomTypeId: r.room_type_id,
    roomName: r.room_name ? pickStr(r.room_name, opts.locale ?? "fa-IR") : null,
  }));
}

/** How many published reviews per star (1–5), and the share that rated 4 or 5. */
export async function reviewStats(propertyId: string): Promise<{ histogram: number[]; recommendPercent: number | null }> {
  const rows = await db<{ rating: number; n: number }[]>`
    select rating, count(*)::int as n from stay.reviews where property_id = ${propertyId}::uuid and status = 'published' group by rating`;
  const histogram = [0, 0, 0, 0, 0];
  for (const r of rows) if (r.rating >= 1 && r.rating <= 5) histogram[r.rating - 1] = r.n;
  const total = histogram.reduce((a, b) => a + b, 0);
  return { histogram, recommendPercent: total ? Math.round(((histogram[3] + histogram[4]) / total) * 100) : null };
}

/**
 * Cheapest bookable price per night for each day from `from` (the date picker shows it under the
 * day). A day is null when no room type that fits the party has a unit left (or stop-sell).
 * Base nightly price of one unit (taxes and fees come with the quote), like the result cards.
 */
export async function getPriceCalendar(
  propertyId: string,
  from: string,
  days: number,
  occupancy: Occupancy,
): Promise<{ currency: string; days: { date: string; price: number | null }[] }> {
  const party = occupancy.adults + occupancy.childAges.length;
  const rows = await db<{ date: string; price: string | null; currency: string; entire: boolean; provider_id: string | null }[]>`
    select d::date::text as date, p.currency_code as currency, p.inventory_model = 'entire_place' as entire, p.service_provider_id::text as provider_id,
           min(coalesce(o.price, rp.base_price)) filter (
             where coalesce(i.units_override, rt.units) - coalesce(i.sold, 0) - coalesce(i.held, 0) >= ${occupancy.rooms}
               and not coalesce(i.stop_sell, false)) as price
      from stay.properties p
      cross join generate_series(${from}::date, ${from}::date + ${Math.max(0, days - 1)}::int, interval '1 day') d
      join stay.room_types rt on rt.property_id = p.id and rt.is_active and rt.max_occupancy * ${occupancy.rooms}::int >= ${party}::int
      join stay.rate_plans rp on rp.room_type_id = rt.id and rp.is_active
      left join stay.inventory i on i.room_type_id = rt.id and i.stay_date = d::date
      left join stay.rate_overrides o on o.rate_plan_id = rp.id and o.stay_date = d::date
     where p.id = ${propertyId}::uuid and p.status = 'published'
     group by d, p.id
     order by d`;
  if (rows.length === 0) return { currency: "IRR", days: [] };
  let locked = new Set<string>();
  if (rows[0].entire && rows[0].provider_id && (await hasLegacyHotelLocks())) {
    const l = await db<{ d: string }[]>`
      select distinct stay_date::text as d from provider_portal.hotel_date_availability
       where service_provider_id = ${rows[0].provider_id}::uuid and stay_date >= ${from}::date and stay_date < ${from}::date + ${days}::int`;
    locked = new Set(l.map((x) => x.d));
  }
  return { currency: rows[0].currency, days: rows.map((r) => ({ date: r.date, price: r.price == null || locked.has(r.date) ? null : Number(r.price) })) };
}

/** Amenities at least one published stay (or one of its room types) has: the ones worth filtering by. */
export async function usedAmenityCodes(): Promise<string[]> {
  const rows = await db<{ code: string }[]>`
    select distinct c as code from (
      select unnest(p.amenity_codes) as c from stay.properties p join stay.cities ci on ci.id = p.city_id
       where p.status = 'published' and ci.is_published
      union
      select unnest(rt.amenity_codes) from stay.room_types rt join stay.properties p on p.id = rt.property_id
       where p.status = 'published' and rt.is_active) x`;
  return rows.map((r) => r.code);
}

/** Published stays per property type (home page "browse by type"). */
export async function kindCounts(): Promise<Record<string, number>> {
  const rows = await db<{ kind: string; n: number }[]>`
    select p.kind, count(*)::int as n
      from stay.properties p join stay.cities c on c.id = p.city_id
     where p.status = 'published' and c.is_published
     group by p.kind`;
  return Object.fromEntries(rows.map((r) => [r.kind, r.n]));
}

/** Other published stays of the same city, nearest first (or most popular without coordinates). */
export async function similarStays(property: Pick<PropertyDetail, "id" | "city" | "location">, locale: string, limit = 4): Promise<PropertyCard[]> {
  const near = property.location ? `pt:${property.location.latitude},${property.location.longitude}` : null;
  const res = await searchProperties(
    { ...EMPTY, city: property.city.slug, near: near ? parseNearRef(near) : null, radius: null, sort: near ? "distance" : "recommended" },
    locale,
    { pageSize: limit + 1 },
  );
  return res.items.filter((c) => c.id !== property.id).slice(0, limit);
}

// Personal lists ------------------------------------------------------------------

export async function wishlistIds(userId: string): Promise<string[]> {
  const rows = await db<{ id: string }[]>`select property_id::text as id from stay.wishlist where user_id = ${userId}::uuid`;
  return rows.map((r) => r.id);
}

async function cardsFor(ids: string[], locale: string): Promise<PropertyCard[]> {
  if (ids.length === 0) return [];
  const all = await searchProperties({ ...EMPTY, page: 1 }, locale, { pageSize: 600 });
  const byId = new Map(all.items.map((c) => [c.id, c]));
  return ids.map((id) => byId.get(id)).filter((c): c is PropertyCard => Boolean(c));
}

const EMPTY: StaySearch = {
  city: null, q: null, checkIn: null, checkOut: null, adults: 1, childAges: [], rooms: 1, kinds: [], stars: [], amenities: [],
  minPrice: null, maxPrice: null, minRating: null, freeCancellation: false, instantOnly: false, accessible: false, availableOnly: false,
  breakfast: false, near: null, radius: null,
  sort: "recommended", page: 1,
};

export async function listWishlist(userId: string, locale: string): Promise<PropertyCard[]> {
  const rows = await db<{ id: string }[]>`
    select w.property_id::text as id from stay.wishlist w join stay.properties p on p.id = w.property_id
     where w.user_id = ${userId}::uuid and p.status = 'published' order by w.created_at desc limit 100`;
  return cardsFor(rows.map((r) => r.id), locale);
}

export async function listRecentViews(owner: string, locale: string, limit = 10): Promise<PropertyCard[]> {
  const rows = await db<{ id: string }[]>`
    select v.property_id::text as id from stay.recent_views v join stay.properties p on p.id = v.property_id
     where v.owner_key = ${owner} and p.status = 'published' order by v.viewed_at desc limit ${limit}`;
  return cardsFor(rows.map((r) => r.id), locale);
}

export async function recordView(owner: string, propertyId: string): Promise<void> {
  await db`
    insert into stay.recent_views (owner_key, property_id) values (${owner}, ${propertyId}::uuid)
    on conflict (owner_key, property_id) do update set viewed_at = now()`;
  await db`update stay.properties set popularity = popularity + 1 where id = ${propertyId}::uuid`;
}

/** Published property slugs + last change, for the sitemap. */
export async function sitemapEntries(): Promise<{ properties: { slug: string; updatedAt: string }[]; cities: { slug: string; updatedAt: string }[] }> {
  const [properties, cities] = await Promise.all([
    db<any[]>`select p.slug, p.updated_at from stay.properties p join stay.cities c on c.id = p.city_id and c.is_published where p.status = 'published' order by p.slug`,
    db<any[]>`select c.slug, greatest(c.updated_at, max(p.updated_at)) as updated_at from stay.cities c join stay.properties p on p.city_id = c.id and p.status = 'published'
               where c.is_published group by c.id order by c.slug`,
  ]);
  return {
    properties: properties.map((r) => ({ slug: r.slug, updatedAt: new Date(r.updated_at).toISOString() })),
    cities: cities.map((r) => ({ slug: r.slug, updatedAt: new Date(r.updated_at).toISOString() })),
  };
}

import "server-only";

import db from "@/config/database/db";
import { pickTranslation } from "@/features/tours/domain/content";
import { normalizeSearchText } from "@/features/tours/domain/text";

import { normalizeRules } from "../domain/cancellation";
import { nightsBetween, todayIn, validateStayDates } from "../domain/dates";
import { occupancyFits, quoteStay, StayQuoteError, type Occupancy, type RatePlanPricing, type RoomCapacity } from "../domain/pricing";
import type { MealPlan, PropertyKind, StaySearch } from "../domain/search";
import type {
  Amenity,
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

import { getStaySettings } from "./settings";

/**
 * Customer-facing reads (H01–H05, H13, H14, H17). Only published properties in
 * published cities are ever returned outside admin preview. Prices shown with
 * dates are computed by the same quoteStay() the checkout uses, so a result
 * card can never show a total the checkout would not charge.
 */

type Tr = Record<string, string> | null;
const FALLBACKS = ["fa-IR", "en-US"];

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
  const rows = await db<any[]>`select code, grp, label, icon from stay.amenities where is_active order by sort_order, code`;
  return rows.map((r) => ({ code: r.code, group: r.grp, label: pickStr(r.label, locale) || r.code, icon: r.icon }));
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
  const settings = await getStaySettings();
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
    const fitting = list.filter((c) => occupancyFits(occupancy, c.capacity));
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
    const priceForFilter = total ?? fromNightly;
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
    });
  });

  const priceOf = (c: PropertyCard) => c.total ?? c.fromNightly ?? Number.POSITIVE_INFINITY;
  const prices = cards.map(priceOf).filter(Number.isFinite);
  const priceBounds = prices.length ? { min: Math.min(...prices), max: Math.max(...prices) } : null;
  // Available stays first when dates are known, then the requested order.
  const availFirst = (a: PropertyCard, b: PropertyCard) => Number(b.available !== false) - Number(a.available !== false);
  const order: Record<string, (a: PropertyCard & { _rank: number }, b: PropertyCard & { _rank: number }) => number> = {
    recommended: (a, b) => a._rank - b._rank,
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
  };
}

/** Approximate locations are snapped to a ~1 km grid so the exact door is never exposed. */
function roundCoord(v: number, approximate: boolean) {
  return approximate ? Math.round(v * 100) / 100 : v;
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

  const [media, amenities, policyRows, breakdown] = await Promise.all([
    db<any[]>`select id::text, url, alt, credit, room_type_id::text from stay.media where property_id = ${p.id}::uuid order by is_cover desc, sort_order, created_at`,
    listAmenities(locale),
    p.current_policy_id
      ? db<any[]>`select id::text, version, rules, no_show_refund_percent, texts from stay.policies where id = ${p.current_policy_id}::uuid`
      : Promise.resolve([] as any[]),
    db<any[]>`select avg(cleanliness)::float8 as c, avg(location)::float8 as l, avg(staff)::float8 as s, avg(value)::float8 as v
                from stay.reviews where property_id = ${p.id}::uuid and status = 'published'`,
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
    amenities: amenities.filter((a) => amenitySet.has(a.code)),
    nearby: ((p.nearby ?? []) as any[])
      .map((n) => ({ kind: String(n.kind ?? "place"), name: pickStr(n.name, locale), distanceM: Number(n.distanceM) }))
      .filter((n) => n.name && Number.isFinite(n.distanceM))
      .sort((a, b) => a.distanceM - b.distanceM),
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

export async function listReviews(propertyId: string, opts: { limit?: number; offset?: number } = {}): Promise<ReviewItem[]> {
  const rows = await db<any[]>`
    select r.id::text, r.rating, r.cleanliness, r.location, r.staff, r.value, r.body, r.locale, r.author_name, r.created_at, r.provider_reply,
           to_char(b.check_in, 'YYYY-MM') as stay_month
      from stay.reviews r join stay.bookings b on b.booking_id = r.booking_id
     where r.property_id = ${propertyId}::uuid and r.status = 'published'
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
  }));
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

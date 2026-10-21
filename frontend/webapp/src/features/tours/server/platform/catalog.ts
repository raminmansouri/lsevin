import "server-only";

import db from "@/config/database/db";

import { isIsoDate, normalizeDigits } from "../../domain/calendar";
import {
  TOUR_TEXT_FIELDS,
  directionOf,
  pickTranslation,
  resolveFields,
  type ContentRow,
  type Resolved,
} from "../../domain/content";
import { fromPrice, quote, type PricedOption, type PriceRule } from "../../domain/pricing";
import { normalizeSearchText, searchTokens } from "../../domain/text";

import { fail } from "./errors";
import { getTourSettings } from "./settings";

export type ContentMode = "published" | "preview";

const decimalsCache = new Map<string, number>();
/** Minor-unit digits from finance.currencies (IRR 0, USD 2, KWD 3 …). */
export async function currencyDecimals(code: string): Promise<number> {
  const hit = decimalsCache.get(code);
  if (hit !== undefined) return hit;
  const [row] = await db<{ d: number }[]>`select decimal_digits as d from finance.currencies where code = ${code}`;
  const value = row ? Number(row.d) : 2;
  decimalsCache.set(code, value);
  return value;
}

// ----------------------------------------------------------------------------
// Shapes returned to the UI. Text fields carry the locale actually used so the
// UI can label fallback content (C-117).
// ----------------------------------------------------------------------------

export type LocalizedText = { value: string; locale: string; isFallback: boolean; dir: "rtl" | "ltr" } | null;

export type TourCard = {
  id: string;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  destination: { slug: string; name: LocalizedText } | null;
  coverUrl: string | null;
  coverAlt: string | null;
  imageCount: number;
  currency: string;
  fromPrice: number | null;
  fromPriceBasis: "per_person" | "per_group" | null;
  regularFromPrice: number | null;
  durationDays: number;
  durationMinutes: number | null;
  nights: number;
  tourType: string;
  categories: string[];
  difficulty: string | null;
  ratingAvg: number | null;
  reviewCount: number;
  instantConfirmation: boolean;
  guideLanguages: string[];
  nextDeparture: { id: string; startsAt: string; remaining: number } | null;
  availability: "available" | "sold_out" | "no_departures" | "unknown";
  badges: ("discount" | "new" | "popular" | "sponsored")[];
  isSponsored: boolean;
};

function lt(r: Resolved): LocalizedText {
  return r ? { ...r, dir: directionOf(r.locale) } : null;
}

async function loadContent(entityType: string, entityIds: string[]): Promise<Map<string, ContentRow[]>> {
  const map = new Map<string, ContentRow[]>();
  if (entityIds.length === 0) return map;
  const rows = await db<{ entity_id: string; field_key: string; locale: string; published_value: string | null; draft_value: string | null; status: string }[]>`
    select entity_id::text, field_key, locale, published_value, draft_value, status
      from tour.content
     where entity_type = ${entityType} and entity_id = any(${entityIds}::uuid[])
  `;
  for (const r of rows) {
    const list = map.get(r.entity_id) ?? [];
    list.push({ fieldKey: r.field_key, locale: r.locale, publishedValue: r.published_value, draftValue: r.draft_value, status: r.status });
    map.set(r.entity_id, list);
  }
  return map;
}

async function loadOptions(tourIds: string[]): Promise<Map<string, PricedOption[]>> {
  const map = new Map<string, PricedOption[]>();
  if (tourIds.length === 0) return map;
  const rows = await db<any[]>`
    select o.id::text, o.tour_id::text, o.kind, o.min_group, o.max_group, o.private_group_price,
           coalesce(json_agg(json_build_object('travelerClass', p.traveler_class, 'amount', p.amount, 'minAge', p.min_age, 'maxAge', p.max_age))
                    filter (where p.id is not null), '[]') as tiers
      from tour.options o
      left join tour.price_tiers p on p.option_id = o.id
     where o.tour_id = any(${tourIds}::uuid[]) and o.is_active
     group by o.id
     order by o.sort_order, o.code
  `;
  for (const r of rows) {
    const list = map.get(r.tour_id) ?? [];
    list.push({
      id: r.id, kind: r.kind, minGroup: r.min_group, maxGroup: r.max_group,
      privateGroupPrice: r.private_group_price == null ? null : Number(r.private_group_price),
      tiers: (r.tiers as any[]).map((t) => ({ travelerClass: t.travelerClass, amount: Number(t.amount), minAge: t.minAge, maxAge: t.maxAge })),
    });
    map.set(r.tour_id, list);
  }
  return map;
}

// ----------------------------------------------------------------------------
// Search (C-021..C-027, AT-06)
// ----------------------------------------------------------------------------

export const SORTS = ["relevance", "price_asc", "price_desc", "start_date", "duration", "popularity", "rating"] as const;
export type TourSort = (typeof SORTS)[number];

export type TourSearch = {
  q?: string;
  destination?: string; // slug
  category?: string;
  dateFrom?: string; // ISO
  dateTo?: string; // ISO
  party?: number;
  minPrice?: number;
  maxPrice?: number;
  minDays?: number;
  maxDays?: number;
  startAfter?: string; // HH:MM local
  startBefore?: string; // HH:MM local
  guideLanguage?: string;
  difficulty?: string;
  accessible?: boolean;
  family?: boolean;
  lowMobility?: boolean;
  recovery?: boolean;
  privateOnly?: boolean;
  instantOnly?: boolean;
  minRating?: number;
  transport?: string;
  provider?: string; // service_provider_id
  sort?: TourSort;
  page?: number;
  pageSize?: number;
  includeUnavailable?: boolean;
};

const num = (v: unknown) => {
  const n = Number(normalizeDigits(String(v ?? "")));
  return Number.isFinite(n) && String(v ?? "").trim() !== "" ? n : undefined;
};
const bool = (v: unknown) => v === "1" || v === "true" || v === true;

/** Parses URL search params into a validated search (shareable URLs, C-027). */
export function parseTourSearch(params: Record<string, string | string[] | undefined>): TourSearch {
  const s = (k: string) => {
    const v = params[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const time = (v?: string) => (v && /^([01]\d|2[0-3]):[0-5]\d$/.test(v) ? v : undefined);
  const sort = s("sort") as TourSort | undefined;
  const party = num(s("party"));
  return {
    q: s("q")?.slice(0, 120) || undefined,
    destination: s("destination") && /^[a-z0-9-]{1,80}$/.test(s("destination")!) ? s("destination") : undefined,
    category: s("category") && /^[a-z0-9_-]{1,62}$/.test(s("category")!) ? s("category") : undefined,
    dateFrom: isIsoDate(s("from")) ? s("from") : undefined,
    dateTo: isIsoDate(s("to")) ? s("to") : undefined,
    party: party && party >= 1 && party <= 50 ? Math.floor(party) : undefined,
    minPrice: num(s("minPrice")),
    maxPrice: num(s("maxPrice")),
    minDays: num(s("minDays")),
    maxDays: num(s("maxDays")),
    startAfter: time(s("startAfter")),
    startBefore: time(s("startBefore")),
    guideLanguage: s("lang") && /^[a-z]{2,3}$/.test(s("lang")!) ? s("lang") : undefined,
    difficulty: s("difficulty") && /^[a-z]{3,20}$/.test(s("difficulty")!) ? s("difficulty") : undefined,
    accessible: bool(s("accessible")) || undefined,
    family: bool(s("family")) || undefined,
    lowMobility: bool(s("lowMobility")) || undefined,
    recovery: bool(s("recovery")) || undefined,
    privateOnly: bool(s("private")) || undefined,
    instantOnly: bool(s("instant")) || undefined,
    minRating: num(s("minRating")),
    transport: s("transport") && /^[a-z_]{2,20}$/.test(s("transport")!) ? s("transport") : undefined,
    sort: sort && (SORTS as readonly string[]).includes(sort) ? sort : "relevance",
    page: Math.max(1, Math.floor(num(s("page")) ?? 1)),
    pageSize: 12,
    includeUnavailable: bool(s("all")) || undefined,
  };
}

export function searchToParams(search: TourSearch): URLSearchParams {
  const p = new URLSearchParams();
  const set = (k: string, v: unknown) => { if (v !== undefined && v !== null && v !== "" && v !== false) p.set(k, v === true ? "1" : String(v)); };
  set("q", search.q); set("destination", search.destination); set("category", search.category);
  set("from", search.dateFrom); set("to", search.dateTo); set("party", search.party);
  set("minPrice", search.minPrice); set("maxPrice", search.maxPrice); set("minDays", search.minDays); set("maxDays", search.maxDays);
  set("startAfter", search.startAfter); set("startBefore", search.startBefore);
  set("lang", search.guideLanguage); set("difficulty", search.difficulty); set("accessible", search.accessible);
  set("family", search.family); set("lowMobility", search.lowMobility); set("recovery", search.recovery);
  set("private", search.privateOnly); set("instant", search.instantOnly); set("minRating", search.minRating);
  set("transport", search.transport); set("provider", search.provider);
  if (search.sort && search.sort !== "relevance") p.set("sort", search.sort);
  if (search.page && search.page > 1) p.set("page", String(search.page));
  if (search.includeUnavailable) p.set("all", "1");
  return p;
}

type CardRow = {
  id: string; slug: string; source_locale: string; currency_code: string; from_price: string | null;
  duration_days: number; duration_minutes: number | null; nights: number; tour_type: string; category_codes: string[];
  difficulty: string | null; rating_avg: string | null; review_count: number; confirmation_mode: string;
  guide_languages: string[]; is_sponsored: boolean; published_at: string | null; popularity: number;
  destination_slug: string | null; destination_names: Record<string, string> | null;
  cover_url: string | null; cover_alt: Record<string, string> | null; image_count: number;
  next_departure_id: string | null; next_starts_at: string | null; next_remaining: number | null;
  any_future: boolean; has_discount: boolean; rank: number | null; total_count: number;
};

export async function searchTours(search: TourSearch, locale: string): Promise<{ items: TourCard[]; total: number; page: number; pageSize: number }> {
  const pageSize = Math.min(search.pageSize ?? 12, 48);
  const page = search.page ?? 1;
  const tokens = search.q ? searchTokens(search.q) : [];
  const party = search.party ?? 1;
  const dateFiltered = Boolean(search.dateFrom || search.dateTo || search.party || search.startAfter || search.startBefore);
  const requireAvailable = dateFiltered && !search.includeUnavailable;
  const from = search.dateFrom ?? null;
  const to = search.dateTo ?? null;
  const sort = search.sort ?? "relevance";

  const rows = await db<CardRow[]>`
    with eligible as (
      select d.tour_id, d.id, d.starts_at, (d.capacity - d.booked_count - d.held_count) as remaining
        from tour.departures d
       where d.tour_id is not null and d.is_active and not d.is_blocked
         and d.status in ('scheduled','delayed')
         and coalesce(d.booking_cutoff_at, d.starts_at) > now()
         and (${from}::date is null or d.starts_on >= ${from}::date)
         and (${to}::date is null or d.starts_on <= ${to}::date)
         and (${search.startAfter ?? null}::time is null or d.local_start_time >= ${search.startAfter ?? null}::time)
         and (${search.startBefore ?? null}::time is null or d.local_start_time <= ${search.startBefore ?? null}::time)
    ), nextdep as (
      select distinct on (tour_id) tour_id, id, starts_at, remaining
        from eligible where remaining >= ${party}
       order by tour_id, starts_at
    ), base as (
      select t.*,
             ds.slug as destination_slug, ds.name_translations as destination_names,
             n.id as next_departure_id, n.starts_at as next_starts_at, n.remaining as next_remaining,
             exists (select 1 from eligible e where e.tour_id = t.id) as any_future,
             exists (select 1 from tour.price_rules pr where pr.tour_id = t.id and pr.value < 0 and pr.date_to >= current_date) as has_discount,
             case when ${tokens.length > 0} then similarity(coalesce(t.search_text, ''), ${normalizeSearchText(search.q ?? "")}) else null end as rank
        from tour.tours t
        left join tour.destinations ds on ds.id = t.destination_id
        left join nextdep n on n.tour_id = t.id
       where t.status = 'published'
         and exists (select 1 from category.service_providers sp where sp.id = t.service_provider_id and sp.is_active)
         and (${search.destination ?? null}::text is null or ds.slug = ${search.destination ?? null})
         and (${search.category ?? null}::text is null or ${search.category ?? null} = any(t.category_codes))
         and (${search.provider ?? null}::uuid is null or t.service_provider_id = ${search.provider ?? null}::uuid)
         and (${search.minDays ?? null}::int is null or t.duration_days >= ${search.minDays ?? null})
         and (${search.maxDays ?? null}::int is null or t.duration_days <= ${search.maxDays ?? null})
         and (${search.minPrice ?? null}::numeric is null or t.from_price >= ${search.minPrice ?? null})
         and (${search.maxPrice ?? null}::numeric is null or t.from_price <= ${search.maxPrice ?? null})
         and (${search.guideLanguage ?? null}::text is null or exists (select 1 from unnest(t.guide_languages) gl where split_part(lower(gl), '-', 1) = ${search.guideLanguage ?? null}))
         and (${search.difficulty ?? null}::text is null or t.difficulty = ${search.difficulty ?? null})
         and (${search.transport ?? null}::text is null or ${search.transport ?? null} = any(t.transport_modes))
         and (${!!search.accessible} = false or t.wheelchair_accessible)
         and (${!!search.family} = false or t.family_friendly)
         and (${!!search.lowMobility} = false or (t.low_mobility_friendly and t.attributes_verified_at is not null))
         and (${!!search.recovery} = false or (t.recovery_friendly and t.attributes_verified_at is not null))
         and (${!!search.privateOnly} = false or t.private_available)
         and (${!!search.instantOnly} = false or t.confirmation_mode = 'instant')
         and (${search.minRating ?? null}::numeric is null or coalesce(t.rating_avg, 0) >= ${search.minRating ?? null})
         and (${tokens.length === 0} or (
               select bool_and(coalesce(t.search_text, '') like '%' || tok || '%') from unnest(${tokens}::text[]) tok))
         and (${!requireAvailable} or n.id is not null)
    )
    select b.id::text, b.slug, b.source_locale, b.currency_code, b.from_price, b.duration_days, b.duration_minutes, b.nights,
           b.tour_type, b.category_codes, b.difficulty, b.rating_avg, b.review_count, b.confirmation_mode,
           b.guide_languages, b.is_sponsored, b.published_at, b.popularity,
           b.destination_slug, b.destination_names,
           cov.url as cover_url, cov.alt_translations as cover_alt,
           (select count(*)::int from tour.media m where m.tour_id = b.id and m.moderation_status = 'approved') as image_count,
           b.next_departure_id::text, b.next_starts_at, b.next_remaining, b.any_future, b.has_discount, b.rank,
           count(*) over ()::int as total_count
      from base b
      left join lateral (
        select m.url, m.alt_translations from tour.media m
         where m.tour_id = b.id and m.moderation_status = 'approved' and m.kind = 'image'
         order by m.is_cover desc, m.sort_order, m.created_at limit 1) cov on true
     order by
       case when ${sort} = 'relevance' then coalesce(b.rank, 0) end desc nulls last,
       case when ${sort} = 'price_asc' then b.from_price end asc nulls last,
       case when ${sort} = 'price_desc' then b.from_price end desc nulls last,
       case when ${sort} = 'start_date' then b.next_starts_at end asc nulls last,
       case when ${sort} = 'duration' then coalesce(b.duration_minutes, b.duration_days * 1440) end asc nulls last,
       case when ${sort} = 'popularity' then b.popularity end desc nulls last,
       case when ${sort} = 'rating' then coalesce(b.rating_avg, 0) end desc nulls last,
       case when ${sort} = 'rating' then b.review_count end desc,
       b.is_featured desc, b.popularity desc, b.published_at desc nulls last, b.id
     limit ${pageSize} offset ${(page - 1) * pageSize}
  `;
  const items = await toCards(rows, locale);
  return { items, total: rows[0]?.total_count ?? 0, page, pageSize };
}

async function toCards(rows: CardRow[], locale: string): Promise<TourCard[]> {
  const settings = await getTourSettings();
  const content = await loadContent("tour", rows.map((r) => r.id));
  const options = await loadOptions(rows.map((r) => r.id));
  const regular = new Map(rows.map((r) => [r.id, fromPrice(options.get(r.id) ?? [])]));
  const thirtyDaysAgo = Date.now() - 30 * 86_400_000;
  return rows.map((r) => {
    const text = resolveFields(content.get(r.id) ?? [], ["title", "summary"] as const, locale, r.source_locale, { platformOrder: settings.contentFallbackOrder });
    const destName = r.destination_names ? pickTranslation(r.destination_names, locale) : null;
    const coverAlt = r.cover_alt ? pickTranslation(r.cover_alt, locale)?.value ?? null : null;
    const fp = regular.get(r.id);
    const badges: TourCard["badges"] = [];
    if (r.has_discount) badges.push("discount");
    if (r.published_at && new Date(r.published_at).getTime() > thirtyDaysAgo) badges.push("new");
    if (r.review_count >= 10 && Number(r.rating_avg ?? 0) >= 4.5) badges.push("popular");
    if (r.is_sponsored) badges.push("sponsored");
    return {
      id: r.id,
      slug: r.slug,
      title: lt(text.title),
      summary: lt(text.summary),
      destination: r.destination_slug ? { slug: r.destination_slug, name: lt(destName) } : null,
      coverUrl: r.cover_url,
      coverAlt,
      imageCount: r.image_count,
      currency: r.currency_code,
      fromPrice: r.from_price == null ? fp?.amount ?? null : Number(r.from_price),
      fromPriceBasis: fp?.basis ?? null,
      regularFromPrice: fp?.amount ?? null,
      durationDays: r.duration_days,
      durationMinutes: r.duration_minutes,
      nights: r.nights,
      tourType: r.tour_type,
      categories: r.category_codes,
      difficulty: r.difficulty,
      ratingAvg: r.review_count > 0 && r.rating_avg != null ? Number(r.rating_avg) : null,
      reviewCount: r.review_count,
      instantConfirmation: r.confirmation_mode === "instant",
      guideLanguages: r.guide_languages,
      nextDeparture: r.next_departure_id && r.next_starts_at
        ? { id: r.next_departure_id, startsAt: new Date(r.next_starts_at).toISOString(), remaining: Number(r.next_remaining) }
        : null,
      availability: r.next_departure_id ? "available" : r.any_future ? "sold_out" : "no_departures",
      badges,
      isSponsored: r.is_sponsored,
    };
  });
}

/** Cards for explicit ids, preserving order; unpublished/hidden ids are dropped (C-014). */
export async function cardsByIds(ids: string[], locale: string): Promise<TourCard[]> {
  if (ids.length === 0) return [];
  const rows = await db<CardRow[]>`
    with nextdep as (
      select distinct on (d.tour_id) d.tour_id, d.id, d.starts_at, (d.capacity - d.booked_count - d.held_count) as remaining
        from tour.departures d
       where d.tour_id = any(${ids}::uuid[]) and d.is_active and not d.is_blocked and d.status in ('scheduled','delayed')
         and coalesce(d.booking_cutoff_at, d.starts_at) > now() and d.capacity - d.booked_count - d.held_count > 0
       order by d.tour_id, d.starts_at)
    select t.id::text, t.slug, t.source_locale, t.currency_code, t.from_price, t.duration_days, t.duration_minutes, t.nights,
           t.tour_type, t.category_codes, t.difficulty, t.rating_avg, t.review_count, t.confirmation_mode,
           t.guide_languages, t.is_sponsored, t.published_at, t.popularity,
           ds.slug as destination_slug, ds.name_translations as destination_names,
           cov.url as cover_url, cov.alt_translations as cover_alt,
           (select count(*)::int from tour.media m where m.tour_id = t.id and m.moderation_status = 'approved') as image_count,
           n.id::text as next_departure_id, n.starts_at as next_starts_at, n.remaining as next_remaining,
           exists (select 1 from tour.departures d2 where d2.tour_id = t.id and d2.starts_at > now() and d2.status in ('scheduled','delayed')) as any_future,
           exists (select 1 from tour.price_rules pr where pr.tour_id = t.id and pr.value < 0 and pr.date_to >= current_date) as has_discount,
           null::real as rank, 0 as total_count
      from tour.tours t
      left join tour.destinations ds on ds.id = t.destination_id
      left join nextdep n on n.tour_id = t.id
      left join lateral (select m.url, m.alt_translations from tour.media m where m.tour_id = t.id and m.moderation_status = 'approved' and m.kind = 'image'
                          order by m.is_cover desc, m.sort_order limit 1) cov on true
     where t.id = any(${ids}::uuid[]) and t.status = 'published'
       and exists (select 1 from category.service_providers sp where sp.id = t.service_provider_id and sp.is_active)
  `;
  const cards = await toCards(rows, locale);
  const byId = new Map(cards.map((c) => [c.id, c]));
  return ids.map((id) => byId.get(id)).filter((c): c is TourCard => Boolean(c));
}

// ----------------------------------------------------------------------------
// Destinations and home (C-009..C-015)
// ----------------------------------------------------------------------------

export type DestinationCard = {
  id: string; slug: string; name: LocalizedText; region: LocalizedText; description: LocalizedText;
  countryCode: string | null; coverUrl: string | null; coverAlt: string | null; tourCount: number;
  latitude: number | null; longitude: number | null;
};

/**
 * Published destinations that have at least one bookable-catalog tour.
 * Emptiness is filtered in SQL *before* the limit — filtering afterwards let
 * empty destinations use up the page, so real ones silently vanished from the
 * Explore filter once there were more than `limit` destinations.
 */
export async function listDestinations(locale: string, opts: { featuredOnly?: boolean; limit?: number; slug?: string } = {}): Promise<DestinationCard[]> {
  const rows = await db<any[]>`
    select d.id::text, d.slug, d.name_translations, d.region_translations, d.description_translations, d.country_code,
           d.cover_url, d.cover_alt_translations, d.latitude, d.longitude, x.tour_count
      from tour.destinations d
      cross join lateral (
        select count(*)::int as tour_count
          from tour.tours t
          join category.service_providers sp on sp.id = t.service_provider_id and sp.is_active
         where t.destination_id = d.id and t.status = 'published') x
     where d.is_published
       and x.tour_count > 0
       and (d.publish_from is null or d.publish_from <= now())
       and (d.publish_until is null or d.publish_until > now())
       and (${!!opts.featuredOnly} = false or d.is_featured)
       and (${opts.slug ?? null}::text is null or d.slug = ${opts.slug ?? null})
     order by d.sort_order, d.slug
     limit ${opts.limit ?? 1000}
  `;
  return rows
    .map((r) => ({
      id: r.id, slug: r.slug,
      name: lt(pickTranslation(r.name_translations, locale)),
      region: lt(pickTranslation(r.region_translations, locale)),
      description: lt(pickTranslation(r.description_translations, locale)),
      countryCode: r.country_code, coverUrl: r.cover_url,
      coverAlt: pickTranslation(r.cover_alt_translations, locale)?.value ?? null,
      tourCount: r.tour_count,
      latitude: r.latitude == null ? null : Number(r.latitude),
      longitude: r.longitude == null ? null : Number(r.longitude),
    }));
}

export type EditorialModule = {
  id: string; kind: string; code: string; title: LocalizedText; subtitle: LocalizedText; cta: LocalizedText;
  imageUrl: string | null; isSponsored: boolean; tours: TourCard[]; destinations: DestinationCard[];
};

export async function listEditorialModules(locale: string, kinds?: string[]): Promise<EditorialModule[]> {
  const rows = await db<any[]>`
    select id::text, kind, code, title_translations, subtitle_translations, cta_translations, image_url,
           rules, tour_ids::text[] as tour_ids, destination_ids::text[] as destination_ids, is_sponsored
      from tour.editorial_modules
     where status = 'published'
       and (publish_from is null or publish_from <= now())
       and (publish_until is null or publish_until > now())
       and (${kinds ?? null}::text[] is null or kind = any(${kinds ?? null}::text[]))
     order by sort_order, code
  `;
  const allDest = await listDestinations(locale);
  const out: EditorialModule[] = [];
  for (const r of rows) {
    let tours: TourCard[] = [];
    if (r.tour_ids.length > 0) tours = await cardsByIds(r.tour_ids, locale);
    else if (r.rules?.category || r.rules?.family || r.rules?.accessible || r.rules?.sort) {
      const res = await searchTours({
        category: r.rules.category, family: r.rules.family, accessible: r.rules.accessible,
        sort: r.rules.sort ?? "popularity", pageSize: Math.min(Number(r.rules.maxItems ?? 10), 20),
      }, locale);
      tours = res.items;
    }
    const destinations = r.destination_ids.length > 0 ? allDest.filter((d) => r.destination_ids.includes(d.id)) : r.kind === "popular_destinations" ? allDest : [];
    // A module whose items all disappeared (expired/unpublished) is hidden rather than shown empty.
    if ((r.kind === "collection" || r.kind === "offers") && tours.length === 0) continue;
    if (r.kind === "popular_destinations" && destinations.length === 0) continue;
    out.push({
      id: r.id, kind: r.kind, code: r.code,
      title: lt(pickTranslation(r.title_translations, locale)),
      subtitle: lt(pickTranslation(r.subtitle_translations, locale)),
      cta: lt(pickTranslation(r.cta_translations, locale)),
      imageUrl: r.image_url, isSponsored: r.is_sponsored, tours, destinations,
    });
  }
  return out;
}

/** Offers: published tours whose discount is a real active price rule (C-012, C-017). */
export async function listOffers(locale: string, limit = 10): Promise<TourCard[]> {
  const ids = await db<{ id: string }[]>`
    select t.id::text from tour.tours t
     where t.status = 'published'
       and exists (select 1 from tour.price_rules pr where pr.tour_id = t.id and pr.value < 0 and pr.date_to >= current_date
                     and exists (select 1 from tour.departures d where d.tour_id = t.id and d.starts_on between pr.date_from and pr.date_to
                                   and d.starts_at > now() and d.status in ('scheduled','delayed') and d.capacity > d.booked_count + d.held_count))
     order by t.is_featured desc, t.popularity desc limit ${limit}
  `;
  return cardsByIds(ids.map((r) => r.id), locale);
}

// ----------------------------------------------------------------------------
// Recent views, wishlist, recent searches (C-009, C-030, C-103, C-104)
// ----------------------------------------------------------------------------

export async function recordRecentView(owner: string, tourId: string) {
  const settings = await getTourSettings();
  await db.begin(async (tx) => {
    await tx`
      insert into tour.recent_views (owner_key, tour_id) values (${owner}, ${tourId}::uuid)
      on conflict (owner_key, tour_id) do update set viewed_at = now(), view_count = tour.recent_views.view_count + 1
    `;
    await tx`
      delete from tour.recent_views
       where owner_key = ${owner}
         and (viewed_at < now() - make_interval(days => ${settings.recentViewsRetentionDays})
              or tour_id in (select tour_id from tour.recent_views where owner_key = ${owner}
                              order by viewed_at desc offset ${settings.recentViewsLimit}))
    `;
    await tx`update tour.tours set popularity = popularity + 1 where id = ${tourId}::uuid`;
  });
}

export async function listRecentViews(owner: string, locale: string, limit = 10): Promise<TourCard[]> {
  const rows = await db<{ tour_id: string }[]>`
    select tour_id::text from tour.recent_views where owner_key = ${owner} order by viewed_at desc limit ${limit * 2}
  `;
  return (await cardsByIds(rows.map((r) => r.tour_id), locale)).slice(0, limit);
}

export async function clearRecentViews(owner: string) {
  await db`delete from tour.recent_views where owner_key = ${owner}`;
}

/** On sign-in, a device's guest history becomes the account's (never the reverse). */
export async function mergeGuestHistory(guestOwner: string, userOwner: string) {
  if (!guestOwner.startsWith("g:") || !userOwner.startsWith("u:")) return;
  await db.begin(async (tx) => {
    await tx`
      insert into tour.recent_views (owner_key, tour_id, viewed_at, view_count)
      select ${userOwner}, tour_id, viewed_at, view_count from tour.recent_views where owner_key = ${guestOwner}
      on conflict (owner_key, tour_id) do update set viewed_at = greatest(tour.recent_views.viewed_at, excluded.viewed_at)
    `;
    await tx`delete from tour.recent_views where owner_key = ${guestOwner}`;
    await tx`update tour.recent_searches set owner_key = ${userOwner} where owner_key = ${guestOwner}`;
  });
}

export async function recordRecentSearch(owner: string, query: string, filters: Record<string, string>) {
  const settings = await getTourSettings();
  const q = query.trim().slice(0, 120);
  if (!q && Object.keys(filters).length === 0) return;
  await db.begin(async (tx) => {
    await tx`delete from tour.recent_searches where owner_key = ${owner} and query = ${q} and filters = ${db.json(filters as never)}`;
    await tx`insert into tour.recent_searches (owner_key, query, filters) values (${owner}, ${q}, ${db.json(filters as never)})`;
    await tx`
      delete from tour.recent_searches where owner_key = ${owner}
         and id in (select id from tour.recent_searches where owner_key = ${owner} order by created_at desc offset ${settings.recentSearchesLimit})
    `;
  });
}

export async function listRecentSearches(owner: string) {
  return db<{ id: string; query: string; filters: Record<string, string>; created_at: string }[]>`
    select id::text, query, filters, created_at from tour.recent_searches where owner_key = ${owner} order by created_at desc limit 10
  `;
}

export async function clearRecentSearches(owner: string) {
  await db`delete from tour.recent_searches where owner_key = ${owner}`;
}

export async function toggleWishlist(userId: string, tourId: string): Promise<boolean> {
  const [exists] = await db<{ ok: boolean }[]>`select exists (select 1 from tour.tours where id = ${tourId}::uuid and status = 'published') as ok`;
  if (!exists?.ok) throw fail.notFound("tour_not_found");
  const removed = await db`delete from tour.wishlist where user_id = ${userId}::uuid and tour_id = ${tourId}::uuid returning tour_id`;
  if (removed.length > 0) return false;
  await db`insert into tour.wishlist (user_id, tour_id) values (${userId}::uuid, ${tourId}::uuid) on conflict do nothing`;
  return true;
}

export async function wishlistIds(userId: string): Promise<string[]> {
  const rows = await db<{ tour_id: string }[]>`select tour_id::text from tour.wishlist where user_id = ${userId}::uuid order by created_at desc`;
  return rows.map((r) => r.tour_id);
}

// ----------------------------------------------------------------------------
// Tour details (C-032..C-049, AT-03, AT-04)
// ----------------------------------------------------------------------------

export type TourDetail = {
  id: string;
  slug: string;
  status: string;
  sourceLocale: string;
  serviceProviderId: string;
  text: Record<(typeof TOUR_TEXT_FIELDS)[number], LocalizedText>;
  anyFallback: boolean;
  destination: DestinationCard | null;
  provider: { id: string; name: LocalizedText; verified: boolean; city: string | null; country: string | null; imageUrl: string | null };
  media: { id: string; kind: string; url: string; thumbnailUrl: string | null; album: string; alt: string | null; caption: string | null; width: number | null; height: number | null }[];
  facts: {
    tourType: string; categories: string[]; tags: string[]; transportModes: string[]; difficulty: string | null; activityLevel: number | null;
    durationMinutes: number | null; durationDays: number; nights: number; minParticipants: number; maxParticipants: number | null;
    minAge: number | null; maxAge: number | null; guideLanguages: string[]; confirmationMode: "instant" | "request";
    requestTimeoutHours: number; bookingCutoffMinutes: number; timezone: string; currency: string;
    pickupAvailable: boolean; privateAvailable: boolean;
    accessibility: { wheelchair: boolean; lowMobility: boolean; family: boolean; recovery: boolean; verified: boolean };
  };
  location: {
    privacy: "exact" | "approximate";
    meeting: { lat: number; lng: number; exact: boolean; radiusM: number } | null;
    end: { lat: number; lng: number } | null;
  };
  itinerary: {
    id: string; day: number; position: number; type: string; title: LocalizedText; description: LocalizedText; instructions: LocalizedText;
    lat: number | null; lng: number | null; exact: boolean; startTime: string | null; durationMinutes: number | null;
    transportMode: string | null; travelMinutesFromPrev: number | null; distanceKmFromPrev: number | null; imageUrl: string | null; included: boolean;
  }[];
  options: (PricedOption & { code: string; label: LocalizedText; pickupIncluded: boolean; guideLanguage: string | null })[];
  addons: { id: string; code: string; label: LocalizedText; pricing: "per_person" | "per_booking"; amount: number; maxQty: number }[];
  policy: {
    id: string; version: number; cancellationRules: { hoursBefore: number; refundPercent: number }[];
    noShowRefundPercent: number; lateArrivalMinutes: number | null; weatherPolicy: string;
    text: { cancellation: LocalizedText; rules: LocalizedText };
  } | null;
  guides: { id: string; displayName: string; photoUrl: string | null; languages: { code: string; level: string }[]; bio: LocalizedText; verified: boolean }[];
  fromPrice: number | null;
  fromPriceBasis: "per_person" | "per_group" | null;
  rating: { avg: number | null; count: number };
  reviews: { id: string; rating: number; body: string; locale: string; createdAt: string; providerReply: string | null; translated: { locale: string; body: string; isMachine: boolean } | null }[];
};

/** Rounds a coordinate to roughly the privacy radius so an approximate area never pinpoints the place (C-043). */
function blur(value: number, radiusM: number) {
  const step = Math.max(radiusM / 111_000, 0.001);
  return Math.round(value / step) * step;
}

export async function getTourDetail(
  slugOrId: string,
  locale: string,
  opts: { mode?: ContentMode; revealExactLocation?: boolean } = {},
): Promise<TourDetail | null> {
  const mode = opts.mode ?? "published";
  const isUuid = /^[0-9a-f-]{36}$/i.test(slugOrId);
  const [t] = await db<any[]>`
    select t.*, t.id::text as id, t.service_provider_id::text as service_provider_id,
           sp.name_translations as provider_names, sp.accredited, sp.is_active as provider_active, sp.city as provider_city,
           sp.country as provider_country, sp.image_url as provider_image
      from tour.tours t
      join category.service_providers sp on sp.id = t.service_provider_id
     where ${isUuid ? db`t.id = ${slugOrId}::uuid` : db`t.slug = ${slugOrId}`}
  `;
  if (!t) return null;
  if (mode === "published" && (t.status !== "published" || !t.provider_active)) return null;

  const settings = await getTourSettings();
  const order = settings.contentFallbackOrder;
  const tourContent = (await loadContent("tour", [t.id])).get(t.id) ?? [];
  const text = resolveFields(tourContent, TOUR_TEXT_FIELDS, locale, t.source_locale, { mode, platformOrder: order });
  const ltText = Object.fromEntries(Object.entries(text).map(([k, v]) => [k, lt(v)])) as TourDetail["text"];

  const media = await db<any[]>`
    select id::text, kind, url, thumbnail_url, album, alt_translations, caption_translations, width, height
      from tour.media
     where tour_id = ${t.id}::uuid
       and (${mode === "preview"} or moderation_status = 'approved')
       and moderation_status <> 'rejected'
     order by is_cover desc, album, sort_order, created_at
  `;

  const stops = await db<any[]>`
    select id::text, day_number, position, stop_type, latitude, longitude, location_exact, start_time::text, duration_minutes,
           transport_mode, travel_minutes_from_prev, distance_km_from_prev, image_url, included
      from tour.itinerary_stops where tour_id = ${t.id}::uuid order by day_number, position
  `;
  const stopContent = await loadContent("stop", stops.map((s) => s.id));

  const optionRows = await db<any[]>`
    select id::text, code, kind, pickup_included, guide_language from tour.options where tour_id = ${t.id}::uuid and is_active order by sort_order, code
  `;
  const priced = (await loadOptions([t.id])).get(t.id) ?? [];
  const optionContent = await loadContent("option", optionRows.map((o) => o.id));
  const addons = await db<any[]>`
    select id::text, code, pricing, amount, max_qty from tour.addons where tour_id = ${t.id}::uuid and is_active order by sort_order, code
  `;
  const addonContent = await loadContent("addon", addons.map((a) => a.id));

  const [policy] = await db<any[]>`
    select id::text, version, cancellation_rules, no_show_refund_percent, late_arrival_minutes, weather_policy, texts
      from tour.policy_versions where tour_id = ${t.id}::uuid order by version desc limit 1
  `;

  const guides = await db<any[]>`
    select distinct g.id::text, g.display_name, g.photo_url, g.languages, g.status
      from tour.guides g
      join tour.provider_guides pg on pg.guide_id = g.id and pg.service_provider_id = ${t.service_provider_id}::uuid
                                   and pg.status = 'active' and pg.publish_bio
      join tour.departure_assignments a on a.guide_id = g.id and a.status in ('assigned','accepted')
      join tour.departures d on d.id = a.departure_id and d.tour_id = ${t.id}::uuid and d.starts_at > now() - interval '1 day'
     where g.status = 'verified'
  `;
  const guideContent = await loadContent("guide", guides.map((g) => g.id));

  const reviews = await db<any[]>`
    select r.id::text, r.rating, r.body, r.locale, r.created_at, case when r.reply_status = 'published' then r.provider_reply end as provider_reply,
           tr.locale as tr_locale, tr.body as tr_body, tr.is_machine
      from tour.reviews r
      left join tour.review_translations tr on tr.review_id = r.id and tr.locale = ${locale}
     where r.tour_id = ${t.id}::uuid and r.status = 'published'
     order by r.created_at desc limit 20
  `;

  const destination = t.destination_id
    ? (await db<any[]>`select id::text, slug, name_translations, region_translations, description_translations, country_code, cover_url, cover_alt_translations, latitude, longitude from tour.destinations where id = ${t.destination_id}::uuid`)[0]
    : null;

  const exact = t.location_privacy === "exact" || Boolean(opts.revealExactLocation);
  const fp = fromPrice(priced);
  const policyText = (key: "cancellation" | "rules"): LocalizedText => {
    const texts = (policy?.texts ?? {}) as Record<string, Record<string, string>>;
    const flat = Object.fromEntries(Object.entries(texts).map(([loc, v]) => [loc, v?.[key] ?? ""]));
    return lt(pickTranslation(flat, locale, [t.source_locale, ...order.filter((o: string) => o !== "source")]));
  };

  return {
    id: t.id,
    slug: t.slug,
    status: t.status,
    sourceLocale: t.source_locale,
    serviceProviderId: t.service_provider_id,
    text: ltText,
    anyFallback: Object.values(ltText).some((v) => v?.isFallback),
    destination: destination
      ? {
          id: destination.id, slug: destination.slug,
          name: lt(pickTranslation(destination.name_translations, locale)),
          region: lt(pickTranslation(destination.region_translations, locale)),
          description: lt(pickTranslation(destination.description_translations, locale)),
          countryCode: destination.country_code, coverUrl: destination.cover_url,
          coverAlt: pickTranslation(destination.cover_alt_translations, locale)?.value ?? null, tourCount: 0,
          latitude: destination.latitude == null ? null : Number(destination.latitude),
          longitude: destination.longitude == null ? null : Number(destination.longitude),
        }
      : null,
    provider: {
      id: t.service_provider_id,
      name: lt(pickTranslation(t.provider_names, locale)),
      verified: Boolean(t.accredited),
      city: t.provider_city ?? null,
      country: t.provider_country ?? null,
      imageUrl: t.provider_image ?? null,
    },
    media: media.map((m) => ({
      id: m.id, kind: m.kind, url: m.url, thumbnailUrl: m.thumbnail_url, album: m.album,
      alt: pickTranslation(m.alt_translations, locale)?.value ?? null,
      caption: pickTranslation(m.caption_translations, locale)?.value ?? null,
      width: m.width, height: m.height,
    })),
    facts: {
      tourType: t.tour_type, categories: t.category_codes, tags: t.tag_codes, transportModes: t.transport_modes,
      difficulty: t.difficulty, activityLevel: t.activity_level, durationMinutes: t.duration_minutes, durationDays: t.duration_days,
      nights: t.nights, minParticipants: t.min_participants, maxParticipants: t.max_participants, minAge: t.min_age, maxAge: t.max_age,
      guideLanguages: t.guide_languages, confirmationMode: t.confirmation_mode, requestTimeoutHours: t.request_timeout_hours,
      bookingCutoffMinutes: t.booking_cutoff_minutes, timezone: t.timezone, currency: t.currency_code,
      pickupAvailable: t.pickup_available, privateAvailable: t.private_available,
      accessibility: {
        wheelchair: t.wheelchair_accessible, lowMobility: t.low_mobility_friendly, family: t.family_friendly,
        recovery: t.recovery_friendly, verified: t.attributes_verified_at != null,
      },
    },
    location: {
      privacy: t.location_privacy,
      meeting: t.meeting_lat == null ? null : exact
        ? { lat: Number(t.meeting_lat), lng: Number(t.meeting_lng), exact: true, radiusM: 0 }
        : { lat: blur(Number(t.meeting_lat), t.approx_radius_m), lng: blur(Number(t.meeting_lng), t.approx_radius_m), exact: false, radiusM: t.approx_radius_m },
      end: t.end_lat == null || !exact ? null : { lat: Number(t.end_lat), lng: Number(t.end_lng) },
    },
    itinerary: stops.map((s) => {
      const rows = stopContent.get(s.id) ?? [];
      const r = resolveFields(rows, ["title", "description", "instructions"] as const, locale, t.source_locale, { mode, platformOrder: order });
      // A stop is pinpointed only when the stop itself is public AND the tour's
      // location is visible to this viewer; otherwise only its approximate area.
      const pinpoint = exact && s.location_exact;
      const hasCoords = s.latitude != null;
      return {
        id: s.id, day: s.day_number, position: s.position, type: s.stop_type,
        title: lt(r.title), description: lt(r.description), instructions: lt(r.instructions),
        lat: hasCoords ? (pinpoint ? Number(s.latitude) : blur(Number(s.latitude), t.approx_radius_m)) : null,
        lng: hasCoords ? (pinpoint ? Number(s.longitude) : blur(Number(s.longitude), t.approx_radius_m)) : null,
        exact: hasCoords && pinpoint,
        startTime: s.start_time ? String(s.start_time).slice(0, 5) : null,
        durationMinutes: s.duration_minutes, transportMode: s.transport_mode,
        travelMinutesFromPrev: s.travel_minutes_from_prev,
        distanceKmFromPrev: s.distance_km_from_prev == null ? null : Number(s.distance_km_from_prev),
        imageUrl: s.image_url, included: s.included,
      };
    }),
    options: optionRows.map((o) => {
      const p = priced.find((x) => x.id === o.id)!;
      return {
        ...(p ?? { id: o.id, kind: o.kind, minGroup: 1, maxGroup: null, privateGroupPrice: null, tiers: [] }),
        code: o.code,
        label: lt(resolveFields(optionContent.get(o.id) ?? [], ["label"] as const, locale, t.source_locale, { mode, platformOrder: order }).label),
        pickupIncluded: o.pickup_included,
        guideLanguage: o.guide_language,
      };
    }),
    addons: addons.map((a) => ({
      id: a.id, code: a.code, pricing: a.pricing, amount: Number(a.amount), maxQty: a.max_qty,
      label: lt(resolveFields(addonContent.get(a.id) ?? [], ["label"] as const, locale, t.source_locale, { mode, platformOrder: order }).label),
    })),
    policy: policy
      ? {
          id: policy.id, version: policy.version, cancellationRules: policy.cancellation_rules,
          noShowRefundPercent: policy.no_show_refund_percent, lateArrivalMinutes: policy.late_arrival_minutes,
          weatherPolicy: policy.weather_policy,
          text: { cancellation: policyText("cancellation"), rules: policyText("rules") },
        }
      : null,
    guides: guides.map((g) => ({
      id: g.id, displayName: g.display_name, photoUrl: g.photo_url, languages: g.languages, verified: g.status === "verified",
      bio: lt(resolveFields(guideContent.get(g.id) ?? [], ["bio"] as const, locale, t.source_locale, { mode, platformOrder: order }).bio),
    })),
    fromPrice: t.from_price == null ? fp?.amount ?? null : Number(t.from_price),
    fromPriceBasis: fp?.basis ?? null,
    rating: { avg: t.review_count > 0 && t.rating_avg != null ? Number(t.rating_avg) : null, count: t.review_count },
    reviews: reviews.map((r) => ({
      id: r.id, rating: r.rating, body: r.body, locale: r.locale, createdAt: new Date(r.created_at).toISOString(),
      providerReply: r.provider_reply,
      translated: r.tr_body && r.locale !== locale ? { locale: r.tr_locale, body: r.tr_body, isMachine: r.is_machine } : null,
    })),
  };
}

// ----------------------------------------------------------------------------
// Departures + date-price calendar (C-038, C-082, booking_process_1.png)
// ----------------------------------------------------------------------------

export type DepartureView = {
  id: string; optionId: string | null; localDate: string; localTime: string | null; startsAt: string; endsAt: string | null;
  timezone: string; cutoffAt: string | null; capacity: number; remaining: number; status: string; delayMinutes: number;
  bookable: boolean; reason: "ok" | "sold_out" | "cutoff" | "blocked" | "cancelled" | "below_party";
  priceFrom: number | null;
};

export async function listDepartures(tourId: string, opts: { from?: string; to?: string; party?: number; optionId?: string | null } = {}): Promise<DepartureView[]> {
  const rows = await db<any[]>`
    select d.id::text, d.option_id::text, d.starts_on, d.local_start_time::text, d.starts_at, d.ends_at, d.timezone, d.booking_cutoff_at,
           d.capacity, d.booked_count, d.held_count, d.status, d.delay_minutes, d.is_blocked, d.is_active, t.currency_code
      from tour.departures d join tour.tours t on t.id = d.tour_id
     where d.tour_id = ${tourId}::uuid
       and d.starts_at > now() - interval '1 day'
       and (${opts.from ?? null}::date is null or d.starts_on >= ${opts.from ?? null}::date)
       and (${opts.to ?? null}::date is null or d.starts_on <= ${opts.to ?? null}::date)
       and (${opts.optionId ?? null}::uuid is null or d.option_id is null or d.option_id = ${opts.optionId ?? null}::uuid)
       and d.status <> 'cancelled'
     order by d.starts_at
     limit 400
  `;
  const options = (await loadOptions([tourId])).get(tourId) ?? [];
  const rules = await db<any[]>`select option_id::text, date_from::text, date_to::text, kind, value from tour.price_rules where tour_id = ${tourId}::uuid`;
  const priceRules: PriceRule[] = rules.map((r) => ({ optionId: r.option_id, dateFrom: r.date_from, dateTo: r.date_to, kind: r.kind, value: Number(r.value) }));
  const party = opts.party ?? 1;
  const now = Date.now();
  const decimals = rows[0] ? await currencyDecimals(rows[0].currency_code) : 2;
  return rows.map((d) => {
    const localDate = d.starts_on instanceof Date ? d.starts_on.toISOString().slice(0, 10) : String(d.starts_on).slice(0, 10);
    const remaining = Math.max(0, d.capacity - d.booked_count - d.held_count);
    const cutoff = d.booking_cutoff_at ? new Date(d.booking_cutoff_at).getTime() : new Date(d.starts_at).getTime();
    let reason: DepartureView["reason"] = "ok";
    if (d.is_blocked || !d.is_active) reason = "blocked";
    else if (cutoff <= now) reason = "cutoff";
    else if (remaining === 0) reason = "sold_out";
    else if (remaining < party) reason = "below_party";
    const option = options.find((o) => o.id === d.option_id) ?? options.find((o) => o.kind === "public") ?? options[0];
    let priceFrom: number | null = null;
    if (option) {
      try {
        priceFrom = quote({
          currency: d.currency_code, currencyDecimals: decimals, option,
          departureDate: localDate, travelers: option.kind === "private" ? { adult: Math.max(option.minGroup, 1) } : { adult: 1 }, priceRules,
        }).total;
      } catch { priceFrom = null; }
    }
    return {
      id: d.id, optionId: d.option_id, localDate, localTime: d.local_start_time ? String(d.local_start_time).slice(0, 5) : null,
      startsAt: new Date(d.starts_at).toISOString(), endsAt: d.ends_at ? new Date(d.ends_at).toISOString() : null,
      timezone: d.timezone, cutoffAt: d.booking_cutoff_at ? new Date(d.booking_cutoff_at).toISOString() : null,
      capacity: d.capacity, remaining, status: d.status, delayMinutes: d.delay_minutes,
      bookable: reason === "ok", reason, priceFrom,
    };
  });
}

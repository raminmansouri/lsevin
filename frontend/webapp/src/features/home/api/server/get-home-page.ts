import 'server-only';

import sql from '@/config/database/db';
import { categoryProviderCountsCte } from '@/features/categories/db/category-tree';

export type HomeQueryInput = {
  locale: string;
  countryCode?: string | null;
  cityCode?: string | null;
  /** Visitor coordinates (GPS/profile/IP). When present, provider lists are
   *  ordered nearest-first so the home page shows what's actually around them. */
  latitude?: number | null;
  longitude?: number | null;
};

export type HomeCategory = {
  id: string;
  label: string;
  imageUrl: string | null;
  gradient: string | null;
  /** Active providers filed under this category or anything beneath it. */
  providerCount: number;
  /** Active subcategories. Zero means the card opens providers, not another level. */
  childCount: number;
};

export type HomeFeaturedService = {
  id: string;
  providerId: string;
  displayName: string;
  description: string;
  providerName: string;
  location: string;
  rating: number;
  reviewCount: number;
  currencyCode: string;
  priceAmount: number;
  originalAmount: number | null;
  discountPercent: number | null;
  imageUrl: string | null;
  badges: string[];
  features: string[];
};

export type HomeTrendingService = {
  id: string;
  displayName: string;
  imageUrl: string | null;
  bookingCount: number;
  bookingLabel: string;
  growthLabel: string | null;
};

export type HomeTrustedProvider = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  rating: number;
  reviewCount: number;
  location: string;
  verified: boolean;
  specialties: string[];
};

export type HomeHeroOffer = {
  id: string;
  title: string;
  subtitle: string | null;
  discountPercent: number | null;
  validUntil: string | null;
  serviceId: string | null;
  imageUrl: string | null;
};

const FALLBACK_GRADIENTS = [
  'from-red-500/90 to-red-600/90',
  'from-pink-500/90 to-rose-600/90',
  'from-purple-500/90 to-purple-600/90',
  'from-blue-500/90 to-blue-600/90',
  'from-teal-500/90 to-teal-600/90',
  'from-amber-500/90 to-orange-600/90',
];

function normalizeLocale(locale?: string | null) {
  const value = (locale || 'fa-IR').trim();
  if (value.toLowerCase() === 'en') return 'en-US';
  if (value.toLowerCase() === 'fa') return 'fa-IR';
  if (value.toLowerCase() === 'ar') return 'ar-SA';
  if (value.toLowerCase() === 'tr') return 'tr-TR';
  return value;
}

function normalizeFilter(value?: string | null) {
  const normalized = (value || '').trim();
  return normalized.length ? normalized : null;
}

function coordOrNull(value?: number | null): number | null {
  if (value == null) return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

// Haversine distance (km) from the visitor to a provider (sp.latitude/sp.longitude),
// returned as a SQL fragment to prepend to ORDER BY so nearer providers rank first.
// Returns null when we don't have the visitor's coordinates (then ordering is unchanged).
function nearbyDistanceFragment(latitude?: number | null, longitude?: number | null) {
  const lat = coordOrNull(latitude);
  const lng = coordOrNull(longitude);
  if (lat == null || lng == null) return null;

  return sql`(
    6371 * acos(
      least(1, greatest(-1,
        cos(radians(${lat}::double precision)) * cos(radians(sp.latitude::double precision)) *
        cos(radians(sp.longitude::double precision) - radians(${lng}::double precision)) +
        sin(radians(${lat}::double precision)) * sin(radians(sp.latitude::double precision))
      ))
    )
  )`;
}

function numberValue(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
}

function integerValue(value: unknown): number {
  return Math.trunc(numberValue(value));
}

function arrayValue(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(String).map((item) => item.trim()).filter(Boolean);
}

function compactNumber(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value >= 10_000_000 ? 0 : 1)}m`;
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(value);
}

function buildServiceBadges(input: {
  providerAccredited: boolean;
  isPopular: boolean;
  discountPercent: number | null;
  rating: number;
}) {
  const badges: string[] = [];
  if (input.providerAccredited) badges.push('Verified');
  if (input.isPopular) badges.push('Popular');
  if (input.rating >= 4.7) badges.push('Top Rated');
  if (input.discountPercent && input.discountPercent > 0) badges.push('Offer');
  return badges.slice(0, 3);
}

function buildFeatureList(tags: unknown, fallbackValues: Array<string | null | undefined>) {
  const fromTags = arrayValue(tags).slice(0, 3);
  if (fromTags.length) return fromTags;

  return fallbackValues
    .map((item) => (item || '').trim())
    .filter(Boolean)
    .slice(0, 3);
}

function locationLabel(city: string | null, country: string | null) {
  return [city, country].map((item) => (item || '').trim()).filter(Boolean).join(', ');
}

export async function getHomeCategories(input: HomeQueryInput, limit = 6): Promise<HomeCategory[]> {
  const locale = normalizeLocale(input.locale);
  const rows = await sql<{
    id: string;
    label: string;
    imageUrl: string | null;
    gradient: string | null;
    providerCount: string | number;
    childCount: string | number;
  }[]>`
    -- The top of the category tree, which is the same tree /n/app/mobile/categories
    -- browses. That is the point: a card here is a node there, so tapping Clinic
    -- descends into its subcategories exactly as it would from the browser, and a
    -- subcategory added in the admin panel shows up on both without further work.
    --
    -- These cards used to come from category.provider_types, which is flat, so a tap
    -- could only ever jump straight to a provider list — there was no level to
    -- descend into. The reason for that detour was that category membership was
    -- derived from the services a provider sells, which cross-listed clinics as
    -- hospitals; service_providers.category_id (migration 0020) fixes the membership
    -- itself, so the tree can be used directly again.
    with recursive ${categoryProviderCountsCte()}
    select
      c.id::text as id,
      common.get_translation_t(c.name_translations, ${locale}::text, 'en-US') as label,
      -- icon_url may hold a lucide icon NAME rather than a path, so only image_url
      -- is safe to use as an image source.
      nullif(btrim(coalesce(c.image_url, '')), '') as "imageUrl",
      nullif(btrim(coalesce(c.gradient, '')), '') as gradient,
      coalesce(pc.provider_count, 0) as "providerCount",
      coalesce(cc.child_count, 0) as "childCount"
    from category.categories c
    left join category_provider_counts pc on pc.category_id = c.id
    left join category_child_counts cc on cc.category_id = c.id
    where c.is_active = true
      and c.parent_id is null
      -- The admin "show on home page" switch. It writes
      -- category.categories.display_in_home_page, and this shelf was reading the
      -- tree without ever consulting it, so turning a category off changed
      -- nothing here. NULL means shown, matching getCategoryHomepageFlags.
      and coalesce(c.display_in_home_page, true) = true
      -- A root with nothing under it is a card that opens an empty page, which is
      -- what made Beauty and Tourism dead ends before.
      and coalesce(pc.provider_count, 0) > 0
    order by coalesce(pc.provider_count, 0) desc, label asc
    limit ${limit}
  `;

  return rows.map((row, index) => ({
    id: row.id,
    label: row.label,
    imageUrl: row.imageUrl,
    gradient: row.gradient || FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length],
    providerCount: integerValue(row.providerCount),
    childCount: integerValue(row.childCount),
  }));
}

export async function getFeaturedHomeServices(input: HomeQueryInput, limit = 8): Promise<HomeFeaturedService[]> {
  const locale = normalizeLocale(input.locale);
  const countryCode = normalizeFilter(input.countryCode);
  const cityCode = normalizeFilter(input.cityCode);
  const nearby = nearbyDistanceFragment(input.latitude, input.longitude);

  const rows = await sql<{
    id: string;
    providerId: string;
    displayName: string;
    description: string;
    providerName: string;
    city: string | null;
    country: string | null;
    rating: string | number | null;
    reviewCount: string | number | null;
    currencyCode: string;
    value: string | number;
    priceAmount: string | number;
    originalAmount: string | number | null;
    discountPercent: string | number | null;
    imageUrl: string | null;
    tags: string[] | null;
    recovery: string | null;
    successRate: string | null;
    stayRequired: string | null;
    providerAccredited: boolean | null;
    isPopular: boolean | null;
  }[]>`
    select
      ps.id::text as id,
      sp.id::text as "providerId",
      coalesce(
        nullif(common.get_translation_t(sd.name_translations, ${locale}::text, 'en-US'), ''),
        nullif(common.get_translation_t(ps.display_name_translations, ${locale}::text, 'en-US'), ''),
        common.get_translation_t(sp.name_translations, ${locale}::text, 'en-US')
      ) as "displayName",
      coalesce(
        nullif(common.get_translation_t(sd.description_translations, ${locale}::text, 'en-US'), ''),
        common.get_translation_t(ps.description_translations, ${locale}::text, 'en-US')
      ) as description,
      common.get_translation_t(sp.name_translations, ${locale}::text, 'en-US') as "providerName",
      sp.city,
      sp.country,
      coalesce(ps.rating, sp.rating, 0) as rating,
      coalesce(ps.review_count, sp.review_count, 0) as "reviewCount",
      upper(coalesce(nullif(ps.currency, ''), nullif(sd.currency, ''), 'USD')) as "currencyCode",
      ps.value,
      case
        when active_offer.discount_percent is not null and active_offer.discount_percent > 0
          then round(ps.value * (1 - (active_offer.discount_percent / 100.0)), 2)
        else ps.value
      end as "priceAmount",
      case
        when active_offer.discount_percent is not null and active_offer.discount_percent > 0
          then ps.value
        else null
      end as "originalAmount",
      active_offer.discount_percent as "discountPercent",
      -- The service's own featured image first. It used to sit near the end of this
      -- chain, so a service with a hand-picked picture still showed the definition's
      -- stock image or a gallery photo from another provider offering the same
      -- definition -- the "random image" symptom.
      nullif(coalesce(psm.file_url, ps.image_url, sdm.file_url, sd.image_url, def_gm.file_url, definition_gallery.url, gm.file_url, gallery.url, spm.file_url, sp.image_url, ''), '') as "imageUrl",
      ps.tags,
      ps.recovery,
      ps.success_rate as "successRate",
      ps.stay_required as "stayRequired",
      coalesce(sp.accredited, false) as "providerAccredited",
      coalesce(ps.is_popular, false) as "isPopular"
    from category.provider_services ps
    join category.service_providers sp
      on sp.id = ps.service_provider_id
     and sp.is_active = true
    join category.service_definitions sd
      on sd.id = ps.service_definition_id
     and sd.is_active = true
    left join lateral (
      select psgi.url
      from category.provider_service_gallery_items psgi
      join category.provider_services definition_ps
        on definition_ps.id = psgi.provider_service_id
       and definition_ps.is_active = true
      join category.service_providers definition_sp
        on definition_sp.id = definition_ps.service_provider_id
       and definition_sp.is_active = true
      where definition_ps.service_definition_id = sd.id
      order by
        psgi.is_primary desc,
        coalesce(definition_ps.is_popular, false) desc,
        coalesce(definition_sp.is_sponsored, false) desc,
        psgi.display_order asc,
        psgi.create_date desc
      limit 1
    ) definition_gallery on true
    left join lateral (
      select psgi.url
      from category.provider_service_gallery_items psgi
      where psgi.provider_service_id = ps.id
      order by psgi.is_primary desc, psgi.display_order asc, psgi.create_date desc
      limit 1
    ) gallery on true
    left join lateral (
      select o.discount_percent
      from marketing.offers o
      where o.provider_service_id = ps.id
        and coalesce(o.is_active, true) = true
        and (o.valid_until is null or o.valid_until > now())
      order by coalesce(o.is_featured, false) desc, o.discount_percent desc, o.created_at desc
      limit 1
    ) active_offer on true
    left join media.media_library sdm on sdm.id::text = nullif(sd.image_url, '')
    left join media.media_library def_gm on def_gm.id::text = definition_gallery.url
    left join media.media_library gm on gm.id::text = gallery.url
    left join media.media_library psm on psm.id::text = ps.image_url
    left join media.media_library spm on spm.id::text = sp.image_url
    where ps.is_active = true
      -- The featured shelf is editorial: a service is on it because an admin ticked
      -- "Featured" on it, and for no other reason. This used to be missing entirely,
      -- so the shelf listed the whole active catalogue and is_popular / discount /
      -- trending_score below only decided the order. They still decide the order —
      -- but only among services that were actually chosen.
      and coalesce(ps.is_featured, false) = true
      and (${countryCode}::text is null or upper(sp.country) = upper(${countryCode}::text))
      and (${cityCode}::text is null or upper(sp.city) = upper(${cityCode}::text))
    order by
      ${nearby ? sql`${nearby} asc nulls last,` : sql``}
      coalesce(ps.is_popular, false) desc,
      coalesce(active_offer.discount_percent, 0) desc,
      coalesce(ps.trending_score, 0) desc,
      coalesce(ps.rating, sp.rating, 0) desc,
      ps.create_date desc
    limit ${limit}
  `;

  return rows.map((row) => {
    const discountPercent = row.discountPercent == null ? null : numberValue(row.discountPercent);
    const rating = numberValue(row.rating);

    return {
      id: row.id,
      providerId: row.providerId,
      displayName: row.displayName,
      description: row.description,
      providerName: row.providerName,
      location: locationLabel(row.city, row.country),
      rating,
      reviewCount: integerValue(row.reviewCount),
      currencyCode: row.currencyCode,
      priceAmount: numberValue(row.priceAmount),
      originalAmount: row.originalAmount == null ? null : numberValue(row.originalAmount),
      discountPercent,
      imageUrl: row.imageUrl,
      badges: buildServiceBadges({
        providerAccredited: Boolean(row.providerAccredited),
        isPopular: Boolean(row.isPopular),
        discountPercent,
        rating,
      }),
      features: buildFeatureList(row.tags, [row.recovery, row.successRate, row.stayRequired]),
    };
  });
}

export async function getTrendingHomeServices(input: HomeQueryInput, limit = 8): Promise<HomeTrendingService[]> {
  const locale = normalizeLocale(input.locale);
  const countryCode = normalizeFilter(input.countryCode);
  const cityCode = normalizeFilter(input.cityCode);

  const rows = await sql<{
    id: string;
    displayName: string;
    imageUrl: string | null;
    bookingCount: string | number | null;
    growth: string | null;
    trendingScore: string | number | null;
  }[]>`
    select
      ps.id::text as id,
      coalesce(
        nullif(common.get_translation_t(sd.name_translations, ${locale}::text, 'en-US'), ''),
        common.get_translation_t(ps.display_name_translations, ${locale}::text, 'en-US')
      ) as "displayName",
      -- The service's own featured image first; see the featured shelf above.
      nullif(coalesce(psm.file_url, ps.image_url, sdm.file_url, sd.image_url, gm.file_url, gallery.url, spm.file_url, sp.image_url, ''), '') as "imageUrl",
      coalesce(recent_bookings.booking_count, 0)::int as "bookingCount",
      nullif(ps.growth, '') as growth,
      coalesce(ps.trending_score, 0) as "trendingScore"
    from category.provider_services ps
    join category.service_providers sp
      on sp.id = ps.service_provider_id
     and sp.is_active = true
    join category.service_definitions sd
      on sd.id = ps.service_definition_id
     and sd.is_active = true
    left join lateral (
      select psgi.url
      from category.provider_service_gallery_items psgi
      where psgi.provider_service_id = ps.id
      order by psgi.is_primary desc, psgi.display_order asc, psgi.create_date desc
      limit 1
    ) gallery on true
    left join lateral (
      select count(*)::int as booking_count
      from booking.bookings b
      where b.service_id = ps.id
        and b.create_date >= now() - interval '30 days'
        and coalesce(b.booking_status, '') not in ('Cancelled', 'Rejected')
    ) recent_bookings on true
    left join media.media_library sdm on sdm.id::text = nullif(sd.image_url, '')
    left join media.media_library gm on gm.id::text = gallery.url
    left join media.media_library psm on psm.id::text = ps.image_url
    left join media.media_library spm on spm.id::text = sp.image_url
    where ps.is_active = true
      and (${countryCode}::text is null or upper(sp.country) = upper(${countryCode}::text))
      and (${cityCode}::text is null or upper(sp.city) = upper(${cityCode}::text))
    order by
      coalesce(ps.trending_score, 0) desc,
      coalesce(recent_bookings.booking_count, 0) desc,
      coalesce(ps.rating, sp.rating, 0) desc,
      ps.create_date desc
    limit ${limit}
  `;

  return rows.map((row) => {
    const bookingCount = integerValue(row.bookingCount);
    const trendingScore = numberValue(row.trendingScore);

    return {
      id: row.id,
      displayName: row.displayName,
      imageUrl: row.imageUrl,
      bookingCount,
      bookingLabel: compactNumber(bookingCount),
      growthLabel: row.growth || (trendingScore > 0 ? `+${Math.round(trendingScore)}%` : null),
    };
  });
}

export async function getTrustedHomeProviders(input: HomeQueryInput, limit = 8): Promise<HomeTrustedProvider[]> {
  const locale = normalizeLocale(input.locale);
  const countryCode = normalizeFilter(input.countryCode);
  const cityCode = normalizeFilter(input.cityCode);
  const nearby = nearbyDistanceFragment(input.latitude, input.longitude);

  const rows = await sql<{
    id: string;
    name: string;
    description: string;
    imageUrl: string | null;
    city: string | null;
    country: string | null;
    rating: string | number | null;
    reviewCount: string | number | null;
    verified: boolean | null;
    specialties: string[] | null;
  }[]>`
    select
      sp.id::text as id,
      common.get_translation_t(sp.name_translations, ${locale}::text, 'en-US') as name,
      common.get_translation_t(sp.description_translations, ${locale}::text, 'en-US') as description,
      -- The provider's own picture first. The gallery used to lead this chain, so
      -- a provider that had set an avatar still showed a gallery item here.
      nullif(coalesce(spm.file_url, sp.image_url, gm.file_url, gallery.url, ''), '') as "imageUrl",
      sp.city,
      sp.country,
      coalesce(sp.rating, 0) as rating,
      coalesce(sp.review_count, 0) as "reviewCount",
      coalesce(sp.accredited, false) as verified,
      sp.specialties
    from category.service_providers sp
    left join lateral (
      select pgi.url
      from category.provider_gallery_items pgi
      where pgi.service_provider_id = sp.id
      order by pgi.display_order asc, pgi.create_date desc
      limit 1
    ) gallery on true
    left join media.media_library gm on gm.id::text = gallery.url
    left join media.media_library spm on spm.id::text = sp.image_url
    where sp.is_active = true
      -- Trim as well as fold case. upper(sp.country) = upper('IR') drops every
      -- provider whose stored code carries stray whitespace, which is why the
      -- listing showed only part of the providers for a country. This matches
      -- what the Explore filters already do and can only widen the result.
      and (${countryCode}::text is null or lower(btrim(sp.country)) = lower(btrim(${countryCode}::text)))
      and (${cityCode}::text is null or lower(btrim(sp.city)) = lower(btrim(${cityCode}::text)))
    order by
      ${nearby ? sql`${nearby} asc nulls last,` : sql``}
      coalesce(sp.accredited, false) desc,
      coalesce(sp.featured_score, 0) desc,
      coalesce(sp.rating, 0) desc,
      coalesce(sp.review_count, 0) desc,
      sp.create_date desc
    limit ${limit}
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    imageUrl: row.imageUrl,
    rating: numberValue(row.rating),
    reviewCount: integerValue(row.reviewCount),
    location: locationLabel(row.city, row.country),
    verified: Boolean(row.verified),
    specialties: arrayValue(row.specialties).slice(0, 2),
  }));
}

export async function getHomeHeroOffer(input: HomeQueryInput): Promise<HomeHeroOffer | null> {
  const locale = normalizeLocale(input.locale);
  const countryCode = normalizeFilter(input.countryCode);
  const cityCode = normalizeFilter(input.cityCode);

  const rows = await sql<{
    id: string;
    title: string;
    subtitle: string | null;
    discountPercent: string | number | null;
    validUntil: string | null;
    serviceId: string | null;
    imageUrl: string | null;
  }[]>`
    select
      o.id::text as id,
      o.title,
      nullif(coalesce(o.subtitle, common.get_translation_t(o.description_translations, ${locale}::text, 'en-US')), '') as subtitle,
      o.discount_percent as "discountPercent",
      o.valid_until::text as "validUntil",
      ps.id::text as "serviceId",
      -- The service's own featured image first; see the featured shelf above.
      nullif(coalesce(psm.file_url, ps.image_url, sdm.file_url, sd.image_url, gm.file_url, gallery.url, spm.file_url, sp.image_url, ''), '') as "imageUrl"
    from marketing.offers o
    join category.provider_services ps
      on ps.id = o.provider_service_id
     and ps.is_active = true
    join category.service_providers sp
      on sp.id = ps.service_provider_id
     and sp.is_active = true
    join category.service_definitions sd
      on sd.id = ps.service_definition_id
     and sd.is_active = true
    left join lateral (
      select psgi.url
      from category.provider_service_gallery_items psgi
      where psgi.provider_service_id = ps.id
      order by psgi.is_primary desc, psgi.display_order asc, psgi.create_date desc
      limit 1
    ) gallery on true
    left join media.media_library sdm on sdm.id::text = nullif(sd.image_url, '')
    left join media.media_library gm on gm.id::text = gallery.url
    left join media.media_library psm on psm.id::text = ps.image_url
    left join media.media_library spm on spm.id::text = sp.image_url
    where coalesce(o.is_active, true) = true
      and coalesce(o.is_featured, false) = true
      and (o.valid_until is null or o.valid_until > now())
      and (${countryCode}::text is null or upper(sp.country) = upper(${countryCode}::text))
      and (${cityCode}::text is null or upper(sp.city) = upper(${cityCode}::text))
    order by o.discount_percent desc, o.valid_until asc, o.created_at desc
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    id: row.id,
    title: row.title,
    subtitle: row.subtitle,
    discountPercent: row.discountPercent == null ? null : numberValue(row.discountPercent),
    validUntil: row.validUntil,
    serviceId: row.serviceId,
    imageUrl: row.imageUrl,
  };
}

export async function getNearbyProviderCount(input: HomeQueryInput): Promise<number> {
  const countryCode = normalizeFilter(input.countryCode);
  const cityCode = normalizeFilter(input.cityCode);

  const rows = await sql<{ count: string | number }[]>`
    select count(*)::int as count
    from category.service_providers sp
    where sp.is_active = true
      and (${countryCode}::text is null or upper(sp.country) = upper(${countryCode}::text))
      and (${cityCode}::text is null or upper(sp.city) = upper(${cityCode}::text))
  `;

  return integerValue(rows[0]?.count);
}

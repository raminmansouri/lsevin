import "server-only";

import sql from "@/config/database/db";
import { convertMoney, resolvePreferredCurrencyCode } from "@/features/finance/lib/server/currency-queries";
import type { ConvertedMoney } from "@/features/finance/types";
import type {
  ProviderAttribute,
  ProviderPageDataResponse,
  ProviderPolicy,
  Recommendation,
  ReviewsPage,
  Review,
  Service,
  ServiceAttribute,
} from "@/features/service-providers/types/provider-page-types";
import type { ApiReturnType } from "@/types/network";

export type ProviderPageQueryInput = {
  providerId: string;
  locale?: string | null;
  userId?: string | null;
  targetCurrencyCode?: string | null;
  selectedCountryCode?: string | null;
  browserCountryCode?: string | null;
  marginProfile?: string | null;
};

export type ProviderReviewInput = {
  providerId: string;
  userId?: string | null;
  rating: number;
  title?: string | null;
  comment: string;
  treatment?: string | null;
  imageUrls?: string[] | null;
};

type ProviderRow = {
  id: string;
  name: string;
  providerType: string | null;
  tagline: string;
  about: string;
  location: string;
  city: string;
  country: string;
  street: string | null;
  email: string | null;
  phoneNumberCountryCode: string | null;
  phoneNumber: string | null;
  rating: number | string | null;
  reviews: number | string | null;
  verified: boolean | null;
  accredited: boolean | null;
  responseTime: string | null;
  images: string[] | null;
  certifications: { name: string; verified: boolean }[] | null;
  languages: string[] | null;
  established: number | null;
  totalPatients: string | null;
  successRate: string | null;
};

type ServiceRow = {
  id: string;
  name: string;
  description: string | null;
  price: number | string | null;
  currency: string | null;
  durationMinutes: number | null;
  recovery: string | null;
  rating: number | string | null;
  reviews: number | string | null;
  popular: boolean | null;
  image: string | null;
  images: string[] | null;
  attributes: ServiceAttribute[] | null;
  bookingUiMode: string | null;
};

type RecommendationRow = {
  id: string;
  image: string | null;
  title: string;
  rating: number | string | null;
  reviewCount: number | string | null;
  city: string | null;
  country: string | null;
  verified: boolean | null;
  link: string;
  priceFrom: number | string | null;
  currency: string | null;
};

type CustomerIdentity = {
  id: string;
  name: string;
  country: string | null;
};

const UUID_PATTERN = "^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$";
const DEFAULT_REVIEW_LIMIT = 10;

const ok = <T,>(data: T): ApiReturnType<T> => ({ data, error: undefined } as ApiReturnType<T>);
const fail = <T,>(title: string, status = 500, detail?: string): ApiReturnType<T> => ({
  data: undefined,
  error: { title, status, detail },
} as ApiReturnType<T>);

function isUuid(value?: string | null): value is string {
  return Boolean(value && new RegExp(UUID_PATTERN).test(String(value).trim()));
}

function toNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function toStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((item) => String(item || "").trim()).filter(Boolean) : [];
}

function toObjectArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value.filter(Boolean) as T[]) : [];
}

function normalizeLocale(locale?: string | null): string {
  const raw = String(locale || "en-US").trim().replace("_", "-");
  const map: Record<string, string> = {
    en: "en-US",
    fa: "fa-IR",
    ar: "ar-SA",
    tr: "tr-TR",
    de: "de-DE",
    fr: "fr-FR",
    es: "es-ES",
    ku: "ku-KU",
  };
  return map[raw.toLowerCase()] || raw || "en-US";
}

function durationLabel(minutes?: number | null): string {
  const value = Number(minutes || 0);
  if (!Number.isFinite(value) || value <= 0) return "Flexible";
  if (value < 60) return `${value} min`;
  const hours = value / 60;
  return Number.isInteger(hours) ? `${hours} hour${hours === 1 ? "" : "s"}` : `${value} min`;
}

function normalizePhone(countryCode?: string | null, phone?: string | null): string | null {
  const cc = String(countryCode || "").trim().replace(/^\+/, "");
  const num = String(phone || "").trim();
  if (!cc && !num) return null;
  return `${cc ? `+${cc}` : ""}${cc && num ? " " : ""}${num}`;
}

function relativeDateLabel(value?: string | null): string {
  if (!value) return "Recently";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Recently";
  const minutes = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (minutes < 60) return minutes <= 1 ? "Just now" : `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours === 1 ? "1 hour ago" : `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return days === 1 ? "1 day ago" : `${days} days ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return months === 1 ? "1 month ago" : `${months} months ago`;
  const years = Math.floor(months / 12);
  return years === 1 ? "1 year ago" : `${years} years ago`;
}

async function safeConvert(input: {
  amount: number;
  sourceCurrencyCode: string;
  targetCurrencyCode: string;
  marginProfile?: string | null;
}): Promise<ConvertedMoney> {
  const sourceCurrencyCode = (input.sourceCurrencyCode || "USD").trim().toUpperCase();
  const targetCurrencyCode = (input.targetCurrencyCode || sourceCurrencyCode).trim().toUpperCase();

  try {
    return await convertMoney({
      amount: input.amount,
      sourceCurrencyCode,
      targetCurrencyCode,
      marginProfile: input.marginProfile || "standard",
    });
  } catch {
    return {
      sourceAmount: input.amount,
      sourceCurrencyCode,
      targetAmount: input.amount,
      targetCurrencyCode: sourceCurrencyCode,
      baseRate: 1,
      appliedRate: 1,
      marginPercent: 0,
      exchangeRateIds: [],
      ratePath: [sourceCurrencyCode, sourceCurrencyCode],
      asOf: new Date().toISOString(),
      expiresAt: null,
    };
  }
}

async function resolveDisplayCurrency(input: ProviderPageQueryInput): Promise<string> {
  try {
    return await resolvePreferredCurrencyCode({
      userId: input.userId,
      explicitCurrencyCode: input.targetCurrencyCode,
      selectedCountryCode: input.selectedCountryCode,
      browserCountryCode: input.browserCountryCode,
      fallbackCurrencyCode: "USD",
    });
  } catch {
    return (input.targetCurrencyCode || "USD").trim().toUpperCase();
  }
}

async function resolveCustomerIdentity(userId?: string | null): Promise<CustomerIdentity | null> {
  const rawUserId = String(userId || "").trim();
  if (!isUuid(rawUserId)) return null;

  const rows = await sql<CustomerIdentity[]>`
    select distinct on (id)
      id::text,
      coalesce(nullif(trim(name), ''), 'LSevin customer') as name,
      country
    from (
      select
        c.id,
        concat_ws(' ', nullif(c.first_name, ''), nullif(c.last_name, '')) as name,
        c.country,
        1 as priority
      from customer.customers c
      where c.id = ${rawUserId}::uuid

      union all

      select
        c.id,
        concat_ws(' ', nullif(c.first_name, ''), nullif(c.last_name, '')) as name,
        c.country,
        2 as priority
      from identity.asp_net_users u
      join customer.customers c
        on (
          (nullif(c.email, '') is not null and lower(c.email) = lower(u.email))
          or (
            nullif(c.phone_number, '') is not null
            and c.phone_number = u.phone_number
            and c.phone_number_country_code = u.phone_number_country_code
          )
        )
      where u.id = ${rawUserId}::uuid
    ) matched
    order by id, priority
    limit 1
  `;

  return rows[0] || null;
}

async function isProviderFavorite(providerId: string, userId?: string | null): Promise<boolean> {
  const customer = await resolveCustomerIdentity(userId);
  if (!customer) return false;

  const rows = await sql<{ exists: boolean }[]>`
    select exists(
      select 1
      from customer.favorites f
      where f.customer_id = ${customer.id}::uuid
        and f.favorite_type = 'provider'::customer.favorite_type
        and f.entity_id = ${providerId}::uuid
    ) as exists
  `;

  return Boolean(rows[0]?.exists);
}

export async function getProviderPageDataFromDb(input: ProviderPageQueryInput): Promise<ApiReturnType<ProviderPageDataResponse>> {
  const providerId = String(input.providerId || "").trim();
  if (!isUuid(providerId)) return fail("A valid provider id is required.", 400);

  const locale = normalizeLocale(input.locale);

  try {
    const providerRows = await sql<ProviderRow[]>`
      select
        sp.id::text,
        common.get_translation_t(sp.name_translations, ${locale}, 'en-US') as name,
        nullif(common.get_translation_t(pt.name_translations, ${locale}, 'en-US'), '') as "providerType",
        common.get_translation_t(sp.description_translations, ${locale}, 'en-US') as tagline,
        common.get_translation_t(coalesce(sp.detail_translations, sp.description_translations), ${locale}, 'en-US') as about,
        concat_ws(', ', nullif(sp.city, ''), nullif(sp.country, '')) as location,
        sp.city,
        sp.country,
        nullif(common.get_translation_t(coalesce(sp.street_translations, '{}'::jsonb), ${locale}, 'en-US'), '') as street,
        sp.email,
        sp.phone_number_country_code as "phoneNumberCountryCode",
        sp.phone_number as "phoneNumber",
        coalesce(sp.rating, 0)::float8 as rating,
        coalesce(sp.review_count, 0)::int as reviews,
        true as verified,
        coalesce(sp.accredited, false) as accredited,
        coalesce(nullif(sp.response_time, ''), 'Usually responds fast') as "responseTime",
        array_cat(
          array_remove(array[coalesce(sp_media.file_url, nullif(sp.image_url, ''))], null),
          coalesce(gallery.images, array[]::text[])
        ) as images,
        coalesce(cert.certifications, '[]'::jsonb) as certifications,
        coalesce(lang.languages, sp.languages, array[]::text[]) as languages,
        sp.established_year as established,
        sp.total_patients as "totalPatients",
        sp.success_rate as "successRate"
      from category.service_providers sp
      join category.provider_types pt on pt.id = sp.provider_type_id
      left join media.media_library sp_media
        on sp_media.id = case when sp.image_url ~* ${UUID_PATTERN} then sp.image_url::uuid else null end
      left join lateral (
        select array_agg(resolved_url order by display_order, create_date) as images
        from (
          select
            coalesce(ml.file_url, nullif(pgi.url, '')) as resolved_url,
            pgi.display_order,
            pgi.create_date
          from category.provider_gallery_items pgi
          left join media.media_library ml
            on ml.id = case when pgi.url ~* ${UUID_PATTERN} then pgi.url::uuid else null end
          where pgi.service_provider_id = sp.id
        ) media_items
        where resolved_url is not null
      ) gallery on true
      left join lateral (
        select jsonb_agg(jsonb_build_object('name', pc.name, 'verified', coalesce(pc.is_verified, false)) order by pc.name) as certifications
        from category.provider_certifications pc
        where pc.service_provider_id = sp.id
      ) cert on true
      left join lateral (
        select array_agg(pl.language order by pl.language) as languages
        from category.provider_languages pl
        where pl.service_provider_id = sp.id
      ) lang on true
      where sp.id = ${providerId}::uuid
        and sp.is_active = true
      limit 1
    `;

    const row = providerRows[0];
    if (!row) return fail("Provider was not found or is not active.", 404);

    const displayCurrencyCode = await resolveDisplayCurrency(input);
    const [serviceRows, specialistRows, reviewsPage, localRows, internationalRows, attributes, policies, isFavorite] = await Promise.all([
      getServiceRows(locale, providerId),
      getSpecialistRows(locale, providerId),
      getProviderReviewsPage({ providerId, offset: 0, limit: DEFAULT_REVIEW_LIMIT }),
      getRecommendationRows(locale, providerId, row.country, true),
      getRecommendationRows(locale, providerId, row.country, false),
      getProviderAttributes(locale, providerId),
      getProviderPolicies(locale, providerId),
      isProviderFavorite(providerId, input.userId),
    ]);

    const services = await Promise.all(serviceRows.map((service) => mapService(service, displayCurrencyCode, input.marginProfile)));
    const [localRecommendations, internationalRecommendations] = await Promise.all([
      mapRecommendations(localRows, displayCurrencyCode, input.marginProfile),
      mapRecommendations(internationalRows, displayCurrencyCode, input.marginProfile),
    ]);

    const providerImages = toStringArray(row.images);

    return ok({
      provider: {
        id: row.id,
        name: row.name,
        providerType: row.providerType,
        tagline: row.tagline,
        description: row.tagline || null,
        about: row.about || row.tagline,
        location: row.location,
        city: row.city,
        country: row.country,
        street: row.street,
        email: row.email || null,
        phone: normalizePhone(row.phoneNumberCountryCode, row.phoneNumber),
        rating: toNumber(row.rating),
        reviews: toNumber(row.reviews),
        verified: Boolean(row.verified),
        accredited: Boolean(row.accredited),
        responseTime: row.responseTime || "Usually responds fast",
        image: providerImages[0] || "",
        images: providerImages,
        certifications: toObjectArray<{ name: string; verified: boolean }>(row.certifications),
        languages: toStringArray(row.languages),
        attributes,
        policies,
        established: row.established || new Date().getFullYear(),
        totalPatients: row.totalPatients || "—",
        successRate: row.successRate || "—",
        displayCurrencyCode,
        isFavorite,
      },
      services,
      specialists: specialistRows.map((specialist: any) => ({
        id: specialist.id,
        name: specialist.name,
        specialty: specialist.specialty || "Specialist",
        experience: specialist.experienceYears ? `${specialist.experienceYears} years` : specialist.experience || "Experienced",
        patients: specialist.patients || "—",
        rating: toNumber(specialist.rating),
        image: specialist.image || "",
        verified: Boolean(specialist.verified),
      })),
      recentReviews: reviewsPage.reviews,
      reviewsTotal: reviewsPage.total,
      reviewsHasMore: reviewsPage.hasMore,
      localRecommendations,
      internationalRecommendations,
    });
  } catch (error) {
    return fail("Could not load provider page.", 500, error instanceof Error ? error.message : undefined);
  }
}

async function mapService(service: ServiceRow, displayCurrencyCode: string, marginProfile?: string | null): Promise<Service> {
  const sourcePrice = toNumber(service.price);
  const sourceCurrency = (service.currency || "USD").trim().toUpperCase();
  const converted = await safeConvert({
    amount: sourcePrice,
    sourceCurrencyCode: sourceCurrency,
    targetCurrencyCode: displayCurrencyCode,
    marginProfile,
  });

  return {
    id: service.id,
    name: service.name,
    description: service.description,
    price: converted.targetAmount,
    currency: converted.targetCurrencyCode,
    sourcePrice: converted.sourceAmount,
    sourceCurrency: converted.sourceCurrencyCode,
    exchangeRate: converted.appliedRate,
    exchangeRateIds: converted.exchangeRateIds,
    duration: durationLabel(service.durationMinutes),
    recovery: service.recovery || "Varies by case",
    rating: toNumber(service.rating),
    reviews: toNumber(service.reviews),
    popular: Boolean(service.popular),
    image: service.image || "",
    images: toStringArray(service.images),
    attributes: toObjectArray<ServiceAttribute>(service.attributes),
    bookingUiMode: service.bookingUiMode || "default_slot",
  };
}

async function getServiceRows(locale: string, providerId: string): Promise<ServiceRow[]> {
  return sql<ServiceRow[]>`
    select
      ps.id::text,
      coalesce(nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'en-US'), ''), common.get_translation_t(sd.name_translations, ${locale}, 'en-US')) as name,
      nullif(common.get_translation_t(ps.description_translations, ${locale}, 'en-US'), '') as description,
      coalesce(ps.value, sd.value, 0)::float8 as price,
      upper(coalesce(nullif(ps.currency, ''), nullif(sd.currency, ''), 'USD')) as currency,
      coalesce(nullif(ps.duration_minutes, 0), sd.duration_minutes, 0)::int as "durationMinutes",
      ps.recovery,
      coalesce(ps.rating, 0)::float8 as rating,
      coalesce(ps.review_count, 0)::int as reviews,
      coalesce(ps.is_popular, false) as popular,
      coalesce(ps_media.file_url, nullif(ps.image_url, ''), primary_gallery.url) as image,
      coalesce(primary_gallery.images, array_remove(array[coalesce(ps_media.file_url, nullif(ps.image_url, ''))], null), array[]::text[]) as images,
      coalesce(attrs.attributes, '[]'::jsonb) as attributes,
      coalesce(sd.booking_ui_mode, 'default_slot') as "bookingUiMode"
    from category.provider_services ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    left join media.media_library ps_media
      on ps_media.id = case when ps.image_url ~* ${UUID_PATTERN} then ps.image_url::uuid else null end
    left join lateral (
      select
        min(resolved_url) as url,
        array_agg(resolved_url order by is_primary desc, display_order asc, create_date asc) as images
      from (
        select
          coalesce(ml.file_url, nullif(psgi.url, '')) as resolved_url,
          psgi.is_primary,
          psgi.display_order,
          psgi.create_date
        from category.provider_service_gallery_items psgi
        left join media.media_library ml
          on ml.id = case when psgi.url ~* ${UUID_PATTERN} then psgi.url::uuid else null end
        where psgi.provider_service_id = ps.id
      ) media_items
      where resolved_url is not null
    ) primary_gallery on true
    left join lateral (
      select jsonb_agg(
        jsonb_build_object(
          'name', common.get_translation_t(sad.name_translations, ${locale}, 'en-US'),
          'value', common.get_translation_t(sav.value_translations, ${locale}, 'en-US')
        ) order by sad.display_order, common.get_translation_t(sad.name_translations, ${locale}, 'en-US')
      ) as attributes
      from category.service_attribute_values sav
      join category.service_attribute_definitions sad on sad.id = sav.attribute_definition_id
      where sav.provider_service_id = ps.id
        and nullif(common.get_translation_t(sav.value_translations, ${locale}, 'en-US'), '') is not null
    ) attrs on true
    where ps.service_provider_id = ${providerId}::uuid
      and ps.is_active = true
      and sd.is_active = true
    order by ps.is_popular desc nulls last, ps.trending_score desc nulls last, name asc
  `;
}

async function getSpecialistRows(locale: string, providerId: string) {
  return sql<any[]>`
    select
      s.id::text,
      common.get_translation_t(s.name_translations, ${locale}, 'en-US') as name,
      coalesce(
        nullif(common.get_translation_t(coalesce(s.specialty_translations, '{}'::jsonb), ${locale}, 'en-US'), ''),
        nullif(s.specialty, ''),
        nullif(common.get_translation_t(s.title_translations, ${locale}, 'en-US'), '')
      ) as specialty,
      s.experience,
      s.experience_years as "experienceYears",
      s.patients,
      coalesce(s.rating, 0)::float8 as rating,
      coalesce(staff_media.file_url, nullif(s.profile_image_url, ''), staff_gallery.url) as image,
      coalesce(psf.is_active, false) as verified
    from category.provider_staffs psf
    join category.staff s on s.id = psf.staff_id
    left join media.media_library staff_media
      on staff_media.id = case when s.profile_image_url ~* ${UUID_PATTERN} then s.profile_image_url::uuid else null end
    left join lateral (
      select coalesce(ml.file_url, nullif(sgi.url, '')) as url
      from category.staff_gallery_items sgi
      left join media.media_library ml
        on ml.id = case when sgi.url ~* ${UUID_PATTERN} then sgi.url::uuid else null end
      where sgi.staff_id = s.id
      order by sgi.is_primary desc, sgi.display_order asc, sgi.create_date asc
      limit 1
    ) staff_gallery on true
    where psf.service_provider_id = ${providerId}::uuid
      and psf.is_active = true
      and s.is_active = true
    order by coalesce(s.rating, 0) desc, name asc
  `;
}

async function getProviderAttributes(locale: string, providerId: string): Promise<ProviderAttribute[]> {
  const rows = await sql<ProviderAttribute[]>`
    select
      pa.id::text,
      common.get_translation_t(pad.name_translations, ${locale}, 'en-US') as name,
      common.get_translation_t(pa.value_translations, ${locale}, 'en-US') as value,
      nullif(common.get_translation_t(pad.description_translations, ${locale}, 'en-US'), '') as description
    from category.provider_attributes pa
    join category.provider_attribute_definitions pad on pad.id = pa.attribute_definition_id
    where pa.service_provider_id = ${providerId}::uuid
      and nullif(common.get_translation_t(pa.value_translations, ${locale}, 'en-US'), '') is not null
    order by name asc
  `;

  return rows.filter((item) => item.name && item.value);
}

async function getProviderPolicies(locale: string, providerId: string): Promise<ProviderPolicy[]> {
  const rows = await sql<ProviderPolicy[]>`
    select
      pp.id::text,
      coalesce(
        nullif(common.get_translation_t(coalesce(ppt.name_translations, '{}'::jsonb), ${locale}, 'en-US'), ''),
        nullif(common.get_translation_t(pp.type_translations, ${locale}, 'en-US'), ''),
        ppt.code,
        'Policy'
      ) as type,
      common.get_translation_t(pp.description_translations, ${locale}, 'en-US') as description
    from category.provider_policies pp
    left join category.provider_policy_types ppt on ppt.id = pp.provider_policy_type_id
    where pp.service_provider_id = ${providerId}::uuid
      and nullif(common.get_translation_t(pp.description_translations, ${locale}, 'en-US'), '') is not null
    order by coalesce(ppt.display_order, 0), type asc
  `;

  return rows.filter((item) => item.description);
}

function mapReviewRow(review: any): Review {
  return {
    id: review.id,
    name: review.name || "LSevin customer",
    country: review.country || "",
    date: relativeDateLabel(review.createDate),
    rating: Math.max(0, Math.min(5, toNumber(review.rating))),
    treatment: review.treatment || "Provider experience",
    review: review.review,
    verified: Boolean(review.verified),
    helpful: toNumber(review.helpful),
    images: toStringArray(review.images),
  };
}

async function getProviderReviewsPage(input: { providerId: string; offset?: number; limit?: number }): Promise<ReviewsPage> {
  const offset = Math.max(0, Number(input.offset || 0));
  const limit = Math.min(30, Math.max(1, Number(input.limit || DEFAULT_REVIEW_LIMIT)));

  const [rows, countRows] = await Promise.all([
    sql<any[]>`
      select
        c.id::text,
        c.customer_name as name,
        c.country,
        c.create_date::text as "createDate",
        coalesce(c.rating, 0)::int as rating,
        c.treatment,
        c.comment_text as review,
        coalesce(c.is_verified, false) as verified,
        coalesce(c.helpful_count, 0)::int as helpful,
        coalesce((
          select array_agg(coalesce(ml.file_url, nullif(ri.image_url, '')) order by ri.id)
          from category.review_images ri
          left join media.media_library ml
            on ml.id = case when ri.image_url ~* ${UUID_PATTERN} then ri.image_url::uuid else null end
          where ri.review_id = c.id
            and coalesce(ml.file_url, nullif(ri.image_url, '')) is not null
        ), array[]::text[]) as images
      from category.service_provider_comments c
      where c.service_provider_id = ${input.providerId}::uuid
        and c.is_public = true
      order by c.create_date desc
      limit ${limit} offset ${offset}
    `,
    sql<{ total: number | string }[]>`
      select count(*)::int as total
      from category.service_provider_comments c
      where c.service_provider_id = ${input.providerId}::uuid
        and c.is_public = true
    `,
  ]);

  const reviews = rows.map(mapReviewRow);
  const total = toNumber(countRows[0]?.total);
  const nextOffset = offset + reviews.length;

  return { reviews, total, nextOffset, hasMore: nextOffset < total };
}

export async function getProviderReviewsPageFromDb(input: { providerId: string; offset?: number; limit?: number }): Promise<ApiReturnType<ReviewsPage>> {
  const providerId = String(input.providerId || "").trim();
  if (!isUuid(providerId)) return fail("A valid provider id is required.", 400);

  try {
    return ok(await getProviderReviewsPage({ providerId, offset: input.offset, limit: input.limit }));
  } catch (error) {
    return fail("Could not load provider reviews.", 500, error instanceof Error ? error.message : undefined);
  }
}

async function getRecommendationRows(locale: string, providerId: string, providerCountry: string | null, sameCountry: boolean): Promise<RecommendationRow[]> {
  const country = String(providerCountry || "").trim();
  return sql<RecommendationRow[]>`
    select
      sp.id::text,
      coalesce(sp_media.file_url, nullif(sp.image_url, ''), gallery.url) as image,
      common.get_translation_t(sp.name_translations, ${locale}, 'en-US') as title,
      coalesce(sp.rating, 0)::float8 as rating,
      coalesce(sp.review_count, 0)::int as "reviewCount",
      sp.city,
      sp.country,
      coalesce(sp.accredited, false) as verified,
      concat('/n/app/mobile/provider/', sp.id::text) as link,
      min_service.price::float8 as "priceFrom",
      min_service.currency
    from category.service_providers sp
    left join category.provider_recommendations pr
      on pr.source_provider_id = ${providerId}::uuid and pr.target_provider_id = sp.id
    left join media.media_library sp_media
      on sp_media.id = case when sp.image_url ~* ${UUID_PATTERN} then sp.image_url::uuid else null end
    left join lateral (
      select coalesce(ml.file_url, nullif(pgi.url, '')) as url
      from category.provider_gallery_items pgi
      left join media.media_library ml
        on ml.id = case when pgi.url ~* ${UUID_PATTERN} then pgi.url::uuid else null end
      where pgi.service_provider_id = sp.id
        and coalesce(ml.file_url, nullif(pgi.url, '')) is not null
      order by pgi.display_order asc, pgi.create_date asc
      limit 1
    ) gallery on true
    left join lateral (
      select ps.value as price, ps.currency
      from category.provider_services ps
      where ps.service_provider_id = sp.id and ps.is_active = true
      order by ps.value asc nulls last
      limit 1
    ) min_service on true
    where sp.id <> ${providerId}::uuid
      and sp.is_active = true
      and (
        (${sameCountry} = true and ${country} <> '' and lower(sp.country) = lower(${country}))
        or (${sameCountry} = false and (${country} = '' or lower(sp.country) <> lower(${country})))
      )
    order by (pr.id is not null) desc, coalesce(sp.featured_score, 0) desc, coalesce(sp.rating, 0) desc, coalesce(sp.review_count, 0) desc
    limit 6
  `;
}

async function mapRecommendations(rows: RecommendationRow[], displayCurrencyCode: string, marginProfile?: string | null): Promise<Recommendation[]> {
  return Promise.all(rows.map(async (row) => {
    const sourcePrice = row.priceFrom === null || row.priceFrom === undefined ? null : toNumber(row.priceFrom);
    const sourceCurrency = (row.currency || "USD").trim().toUpperCase();
    const converted = sourcePrice === null ? null : await safeConvert({
      amount: sourcePrice,
      sourceCurrencyCode: sourceCurrency,
      targetCurrencyCode: displayCurrencyCode,
      marginProfile,
    });

    return {
      id: row.id,
      image: row.image || "",
      title: row.title,
      rating: toNumber(row.rating),
      reviewCount: toNumber(row.reviewCount),
      city: row.city || "",
      country: row.country || "",
      verified: Boolean(row.verified),
      link: row.link,
      priceFrom: converted?.targetAmount ?? null,
      currency: converted?.targetCurrencyCode ?? null,
      sourcePrice,
      sourceCurrency,
    };
  }));
}

export async function setProviderFavoriteInDb(input: {
  providerId: string;
  userId?: string | null;
  isFavorite: boolean;
}): Promise<ApiReturnType<{ isFavorite: boolean }>> {
  const providerId = String(input.providerId || "").trim();
  if (!isUuid(providerId)) return fail("A valid provider id is required.", 400);

  try {
    const customer = await resolveCustomerIdentity(input.userId);
    if (!customer) return fail("Please sign in and complete your customer profile before saving favorites.", 401);

    if (input.isFavorite) {
      await sql`
        insert into customer.favorites (customer_id, favorite_type, entity_id)
        values (${customer.id}::uuid, 'provider'::customer.favorite_type, ${providerId}::uuid)
        on conflict (customer_id, favorite_type, entity_id) do nothing
      `;
      return ok({ isFavorite: true });
    }

    await sql`
      delete from customer.favorites
      where customer_id = ${customer.id}::uuid
        and favorite_type = 'provider'::customer.favorite_type
        and entity_id = ${providerId}::uuid
    `;

    return ok({ isFavorite: false });
  } catch (error) {
    return fail("Could not update favorite status.", 500, error instanceof Error ? error.message : undefined);
  }
}

export async function createProviderReviewInDb(input: ProviderReviewInput): Promise<ApiReturnType<{ review: Review }>> {
  const providerId = String(input.providerId || "").trim();
  if (!isUuid(providerId)) return fail("A valid provider id is required.", 400);

  const rating = Math.max(1, Math.min(5, Math.round(Number(input.rating || 0))));
  const comment = String(input.comment || "").trim();
  if (!rating) return fail("Please select a rating.", 400);
  if (comment.length < 10) return fail("Review must be at least 10 characters.", 400);

  try {
    const customer = await resolveCustomerIdentity(input.userId);
    if (!customer) return fail("Please sign in and complete your customer profile before writing a review.", 401);

    const treatment = String(input.treatment || input.title || "Provider experience").trim().slice(0, 100) || "Provider experience";
    const imageUrls = toStringArray(input.imageUrls).slice(0, 4);

    const inserted = await sql<{ id: string }[]>`
      insert into category.service_provider_comments (
        id,
        service_provider_id,
        customer_id,
        customer_name,
        comment_text,
        rating,
        is_public,
        create_date,
        last_modified_date,
        country,
        treatment,
        is_verified,
        helpful_count
      ) values (
        public.uuid_generate_v4(),
        ${providerId}::uuid,
        ${customer.id}::uuid,
        ${customer.name},
        ${comment},
        ${rating},
        true,
        now(),
        now(),
        ${customer.country},
        ${treatment},
        true,
        0
      )
      returning id::text
    `;

    const reviewId = inserted[0]?.id;
    if (reviewId && imageUrls.length) {
      await sql`
        insert into category.review_images (id, review_id, image_url)
        select public.uuid_generate_v4(), ${reviewId}::uuid, x.url
        from unnest(${imageUrls}::text[]) as x(url)
        where nullif(x.url, '') is not null
      `;
    }

    await sql`
      update category.service_providers sp
      set
        rating = stats.avg_rating::numeric(3,2),
        review_count = stats.total,
        last_modified_date = now()
      from (
        select round(coalesce(avg(c.rating), 0)::numeric, 2) as avg_rating, count(*)::int as total
        from category.service_provider_comments c
        where c.service_provider_id = ${providerId}::uuid
          and c.is_public = true
      ) stats
      where sp.id = ${providerId}::uuid
    `;

    const page = await getProviderReviewsPage({ providerId, offset: 0, limit: 1 });
    const review = page.reviews[0];
    if (!review) return fail("Review was saved but could not be reloaded.", 500);

    return ok({ review });
  } catch (error) {
    return fail("Could not submit review.", 500, error instanceof Error ? error.message : undefined);
  }
}

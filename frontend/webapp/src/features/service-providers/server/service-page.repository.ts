import 'server-only';

import sql from '@/config/database/db';
import { convertMoney, resolvePreferredCurrencyCode } from '@/features/finance/lib/server/currency-queries';
import { getCurrencySymbol, normalizeCurrencyCode } from '@/features/finance/lib/money';
import type { ConvertedMoney } from '@/features/finance/types';
import { getIsFavorite } from '@/features/favorites/server/favorites.repository';

import type {
  GetServicePageByIdResponse,
  OtherCurrency,
  Process,
  ProviderAttribute,
  ProviderPolicy,
  Service,
  ServiceAddon,
  ServiceAttribute,
  ServiceDomainRequirement,
  ServiceGalleryItem,
  ServiceOffer,
  ServiceProviderOffering,
  ServiceSpecialist,
  ServiceUploadRequirement,
  StaffCertification,
  StaffEducation,
  TopReview,
} from '../types/service-page.types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{12}$/i;
const DEFAULT_FALLBACK_LOCALE = 'en-US';
const DEFAULT_DISPLAY_CURRENCIES = ['USD', 'EUR', 'GBP', 'AED', 'TRY', 'IRT', 'IRR', 'OMR', 'IQD', 'KWD', 'QAR', 'SAR', 'RUB', 'CNY'];

function isUuid(value: string | null | undefined): value is string {
  return typeof value === 'string' && UUID_RE.test(value);
}

function normalizeLocale(locale?: string | null) {
  const normalized = String(locale || DEFAULT_FALLBACK_LOCALE).trim().replace('_', '-');
  return normalized || DEFAULT_FALLBACK_LOCALE;
}

function asNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback;
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function asString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value.filter(Boolean) as T[]) : [];
}

function normalizeJsonArray<T>(value: unknown): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean) as T[];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed.filter(Boolean) as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value || '').trim()).filter(Boolean)));
}

function uniqueCurrencyCodes(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => normalizeCurrencyCode(value)).filter(Boolean)));
}

function convertedMoneyToOtherCurrency(value: ConvertedMoney): OtherCurrency {
  return {
    code: value.targetCurrencyCode,
    amount: value.targetAmount,
    symbol: getCurrencySymbol(value.targetCurrencyCode),
  };
}

async function safeResolvePreferredCurrencyCode(input: {
  userId?: string | null;
  explicitCurrencyCode?: string | null;
  selectedCountryCode?: string | null;
  browserCountryCode?: string | null;
  fallbackCurrencyCode: string;
}) {
  try {
    return await resolvePreferredCurrencyCode(input);
  } catch {
    return normalizeCurrencyCode(input.explicitCurrencyCode || input.fallbackCurrencyCode);
  }
}

async function safeConvertMoney(input: {
  amount: number;
  sourceCurrencyCode: string;
  targetCurrencyCode: string;
  marginProfile?: string;
}): Promise<ConvertedMoney> {
  const sourceCurrencyCode = normalizeCurrencyCode(input.sourceCurrencyCode);
  const targetCurrencyCode = normalizeCurrencyCode(input.targetCurrencyCode);

  try {
    return await convertMoney({
      amount: input.amount,
      sourceCurrencyCode,
      targetCurrencyCode,
      marginProfile: input.marginProfile,
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

async function safeGetConvertedPriceOptions(input: {
  amount: number;
  sourceCurrencyCode: string;
  targetCurrencyCodes: string[];
  marginProfile?: string;
}): Promise<ConvertedMoney[]> {
  const sourceCurrencyCode = normalizeCurrencyCode(input.sourceCurrencyCode);
  const targets = uniqueCurrencyCodes([sourceCurrencyCode, ...input.targetCurrencyCodes]);
  const results: ConvertedMoney[] = [];

  for (const targetCurrencyCode of targets) {
    const converted = await safeConvertMoney({
      amount: input.amount,
      sourceCurrencyCode,
      targetCurrencyCode,
      marginProfile: input.marginProfile,
    });

    if (!results.some((item) => item.targetCurrencyCode === converted.targetCurrencyCode)) {
      results.push(converted);
    }
  }

  if (!results.length) {
    results.push(await safeConvertMoney({ amount: input.amount, sourceCurrencyCode, targetCurrencyCode: sourceCurrencyCode }));
  }

  return results;
}

function pickConvertedPrice(prices: ConvertedMoney[], preferredCurrencyCode: string): OtherCurrency {
  const preferred = prices.find((item) => item.targetCurrencyCode === preferredCurrencyCode);
  return convertedMoneyToOtherCurrency(preferred || prices[0]);
}

type PrimaryServiceRow = {
  provider_service_id: string;
  service_definition_id: string;
  category_id: string | null;
  category_name: string | null;
  provider_id: string;
  provider_type_id: string;
  provider_type_name: string | null;
  provider_grade_name: string | null;
  provider_name: string;
  provider_description: string | null;
  provider_image_url: string | null;
  provider_city: string | null;
  provider_country: string | null;
  provider_street: string | null;
  provider_detail: string | null;
  provider_zip_code: string | null;
  provider_email: string | null;
  provider_phone: string | null;
  provider_latitude: number | string | null;
  provider_longitude: number | string | null;
  provider_timezone_id: string | null;
  provider_rating: number | string | null;
  provider_review_count: number | string | null;
  provider_accredited: boolean | null;
  provider_response_time: string | null;
  provider_established_year: number | string | null;
  provider_total_patients: string | null;
  provider_success_rate: string | null;
  provider_languages: string[] | null;
  provider_specialties: string[] | null;
  provider_is_sponsored: boolean | null;
  provider_sponsored_tag: string | null;
  service_name: string;
  service_description: string;
  service_definition_name: string;
  service_definition_description: string;
  currency: string;
  value: number | string;
  duration_minutes: number | string | null;
  rating: number | string | null;
  review_count: number | string | null;
  recovery: string | null;
  image_url: string | null;
  is_popular: boolean | null;
  anesthesia: string | null;
  stay_required: string | null;
  success_rate: string | null;
  satisfaction: string | null;
  booking_ui_mode: string | null;
  requires_specialist: boolean | null;
  tags: string[] | null;
  slot_interval_minutes: number | string | null;
};

type GalleryRow = {
  id: string;
  title: string | null;
  description: string | null;
  url: string;
  media_type: string;
  display_order: number | string | null;
  is_primary: boolean | null;
  source: ServiceGalleryItem['source'];
};

type ProviderOfferingRow = {
  provider_service_id: string;
  service_definition_id: string;
  provider_id: string;
  provider_type_name: string | null;
  service_name: string;
  provider_name: string;
  provider_description: string | null;
  provider_image_url: string | null;
  service_image_url: string | null;
  city: string | null;
  country: string | null;
  response_time: string | null;
  price: number | string;
  currency: string;
  rating: number | string | null;
  review_count: number | string | null;
  provider_rating: number | string | null;
  provider_review_count: number | string | null;
  verified: boolean | null;
  popular: boolean | null;
  sponsored: boolean | null;
  duration_minutes: number | string | null;
};

type ReviewRow = {
  id: string;
  customer_name: string;
  country: string | null;
  treatment: string | null;
  rating: number | string | null;
  comment_text: string;
  is_verified: boolean | null;
  helpful_count: number | string | null;
  create_date: string | Date;
  images: string[] | null;
};

type ServiceAttributeRow = {
  id: string;
  name: string | null;
  description: string | null;
  value: string | null;
  is_required: boolean | null;
  affects_pricing: boolean | null;
  display_order: number | string | null;
  attribute_type: string | null;
  available_options: unknown;
};

type ProviderAttributeRow = {
  id: string;
  name: string | null;
  description: string | null;
  value: string | null;
  is_required: boolean | null;
  attribute_type: string | null;
};

type UploadRequirementRow = {
  id: string;
  title: string | null;
  description: string | null;
  is_required: boolean | null;
  max_file_size_bytes: number | string | null;
  allowed_extensions: string[] | null;
  allowed_mime_types: string[] | null;
  max_files: number | string | null;
  example_file_url: string | null;
};

type DomainRequirementRow = {
  id: number | string;
  description: string | null;
  is_mandatory: boolean | null;
};

type AddonRow = {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  source_type: string | null;
  addon_kind: string | null;
  popular: boolean | null;
  is_required: boolean | null;
  price: number | string | null;
  currency_code: string | null;
  details: string[] | null;
};

type OfferRow = {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  discount_percent: number | string;
  valid_until: string | Date;
  code: string | null;
  is_featured: boolean | null;
  usage_limit: number | string | null;
  used_count: number | string | null;
};

type PolicyRow = {
  id: string;
  code: string | null;
  type: string | null;
  description: string | null;
  display_order: number | string | null;
};

type SpecialistRow = {
  id: string;
  staff_id: string;
  name: string;
  title: string | null;
  biography: string | null;
  image: string | null;
  rating: number | string | null;
  review_count: number | string | null;
  specialty: string | null;
  experience: string | null;
  experience_years: number | string | null;
  patients: string | null;
  success_rate: string | null;
  consultation_fee: number | string | null;
  next_available_label: string | null;
  languages: string[] | null;
  specializations: string[] | null;
  certifications: unknown;
  credentials: string[] | null;
  education: unknown;
  gallery_items: unknown;
  can_provide_this_service: boolean | null;
};

async function mapOffering(row: ProviderOfferingRow, options: { preferredCurrencyCode: string; customerId?: string | null }): Promise<ServiceProviderOffering> {
  const rating = asNumber(row.rating ?? row.provider_rating, 0);
  const reviewCount = asNumber(row.review_count ?? row.provider_review_count, 0);
  const image = asString(row.service_image_url || row.provider_image_url, '');
  const price = asNumber(row.price, 0);
  const currency = normalizeCurrencyCode(row.currency);
  const priceOptions = await safeGetConvertedPriceOptions({
    amount: price,
    sourceCurrencyCode: currency,
    targetCurrencyCodes: [options.preferredCurrencyCode, currency],
  });
  const displayPrice = pickConvertedPrice(priceOptions, options.preferredCurrencyCode);
  const isFavorite = await getIsFavorite({
    customerId: options.customerId,
    favoriteType: 'service',
    entityId: row.provider_service_id,
  });

  return {
    id: row.provider_id,
    providerServiceId: row.provider_service_id,
    serviceDefinitionId: row.service_definition_id,
    providerTypeName: asString(row.provider_type_name),
    image,
    title: row.service_name,
    provider: row.provider_name,
    description: asString(row.provider_description),
    rating,
    reviewCount,
    city: asString(row.city),
    country: asString(row.country),
    responseTime: asString(row.response_time),
    price,
    currency,
    currencySymbol: getCurrencySymbol(currency),
    displayPrice,
    priceOptions,
    verified: Boolean(row.verified),
    popular: Boolean(row.popular),
    sponsored: Boolean(row.sponsored),
    durationMinutes: asNumber(row.duration_minutes, 0),
    isFavorite,
    link: `/service/${row.provider_service_id}`,
  };
}

function splitRecommendations(providers: ServiceProviderOffering[], currentProviderServiceId: string, currentCountry: string) {
  const otherProviders = providers.filter((item) => item.providerServiceId !== currentProviderServiceId);
  const normalizedCurrentCountry = currentCountry.trim().toLowerCase();
  const localRecommendations = otherProviders
    .filter((item) => item.country.trim().toLowerCase() === normalizedCurrentCountry)
    .slice(0, 3);
  const keyDestinationCountries = new Set(['iran', 'turkey', 'uae', 'united arab emirates']);
  const internationalRecommendations = otherProviders
    .filter((item) => {
      const country = item.country.trim().toLowerCase();
      return country !== normalizedCurrentCountry && (keyDestinationCountries.has(country) || localRecommendations.length < 3);
    })
    .slice(0, 4);

  return {
    localRecommendations: localRecommendations.map((item) => ({
      id: item.providerServiceId,
      image: item.image,
      title: item.title,
      provider: item.provider,
      rating: item.rating,
      reviewCount: item.reviewCount,
      city: item.city,
      country: item.country,
      price: item.displayPrice.amount,
      currency: item.displayPrice.symbol || item.displayPrice.code,
      verified: item.verified,
      link: `/service/${item.providerServiceId}`,
    })),
    internationalRecommendations: internationalRecommendations.map((item) => ({
      id: item.providerServiceId,
      image: item.image,
      title: item.title,
      provider: item.provider,
      rating: item.rating,
      reviewCount: item.reviewCount,
      city: item.city,
      country: item.country,
      price: item.displayPrice.amount,
      currency: item.displayPrice.symbol || item.displayPrice.code,
      verified: item.verified,
      link: `/service/${item.providerServiceId}`,
    })),
  };
}

async function getPrimaryServiceRow(serviceId: string, locale: string) {
  const rows = await sql<PrimaryServiceRow[]>`
    with requested as (
      select ps.id as provider_service_id, ps.service_definition_id
      from category.provider_services ps
      join category.service_definitions sd on sd.id = ps.service_definition_id
      where ps.id = ${serviceId}::uuid and ps.is_active = true and sd.is_active = true
      union all
      select null::uuid as provider_service_id, sd.id as service_definition_id
      from category.service_definitions sd
      where sd.id = ${serviceId}::uuid and sd.is_active = true
      limit 1
    ), primary_provider_service as (
      select ps.*
      from requested r
      join category.provider_services ps on ps.service_definition_id = r.service_definition_id
      join category.service_providers sp on sp.id = ps.service_provider_id
      where ps.is_active = true and sp.is_active = true
      order by
        case when r.provider_service_id is not null and ps.id = r.provider_service_id then 0 else 1 end,
        coalesce(ps.is_popular, false) desc,
        coalesce(sp.is_sponsored, false) desc,
        coalesce(ps.rating, sp.rating, 0) desc,
        ps.value asc,
        ps.create_date desc
      limit 1
    )
    select
      ps.id::text as provider_service_id,
      sd.id::text as service_definition_id,
      c.id::text as category_id,
      common.get_translation_t(c.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as category_name,
      sp.id::text as provider_id,
      sp.provider_type_id::text as provider_type_id,
      common.get_translation_t(pt.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as provider_type_name,
      spg.name as provider_grade_name,
      common.get_translation_t(sp.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as provider_name,
      common.get_translation_t(sp.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as provider_description,
      coalesce(sp_media.file_url, sp.image_url) as provider_image_url,
      sp.city as provider_city,
      sp.country as provider_country,
      common.get_translation_t(sp.street_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as provider_street,
      common.get_translation_t(sp.detail_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as provider_detail,
      sp.zip_code as provider_zip_code,
      sp.email as provider_email,
      concat_ws('', nullif(sp.phone_number_country_code, ''), nullif(sp.phone_number, '')) as provider_phone,
      sp.latitude as provider_latitude,
      sp.longitude as provider_longitude,
      sp.timezone_id as provider_timezone_id,
      sp.rating as provider_rating,
      sp.review_count as provider_review_count,
      sp.accredited as provider_accredited,
      sp.response_time as provider_response_time,
      sp.established_year as provider_established_year,
      sp.total_patients as provider_total_patients,
      sp.success_rate as provider_success_rate,
      coalesce(sp.languages, array[]::text[]) as provider_languages,
      coalesce(sp.specialties, array[]::text[]) as provider_specialties,
      sp.is_sponsored as provider_is_sponsored,
      sp.sponsored_tag as provider_sponsored_tag,
      coalesce(nullif(common.get_translation_t(ps.display_name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}), ''), common.get_translation_t(sd.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE})) as service_name,
      coalesce(nullif(common.get_translation_t(ps.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}), ''), common.get_translation_t(sd.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE})) as service_description,
      common.get_translation_t(sd.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as service_definition_name,
      common.get_translation_t(sd.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as service_definition_description,
      ps.currency,
      ps.value,
      coalesce(nullif(ps.duration_minutes, 0), sd.duration_minutes) as duration_minutes,
      coalesce(ps.rating, sp.rating, 0) as rating,
      coalesce(ps.review_count, sp.review_count, 0) as review_count,
      ps.recovery,
      coalesce(ps_media.file_url, ps.image_url) as image_url,
      ps.is_popular,
      ps.anesthesia,
      ps.stay_required,
      coalesce(ps.success_rate, sp.success_rate) as success_rate,
      ps.satisfaction,
      sd.booking_ui_mode,
      sd.requires_specialist,
      coalesce(ps.tags, array[]::text[]) as tags,
      ps.slot_interval_minutes
    from primary_provider_service ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    left join category.categories c on c.id = sd.category_id
    join category.service_providers sp on sp.id = ps.service_provider_id
    left join category.provider_types pt on pt.id = sp.provider_type_id
    left join category.service_provider_grades spg on spg.id = sp.grade_id
    left join media.media_library ps_media on ps_media.id::text = nullif(ps.image_url, '')
    left join media.media_library sp_media on sp_media.id::text = nullif(sp.image_url, '')
    limit 1
  `;

  return rows[0] ?? null;
}

async function getIncludedItems(serviceDefinitionId: string, providerServiceId: string) {
  const rows = await sql<{ item: string }[]>`
    select distinct si.item
    from category.service_included si
    where si.service_id = ${serviceDefinitionId}::uuid or si.service_id = ${providerServiceId}::uuid
    order by si.item
  `;
  return rows.map((row) => row.item).filter(Boolean);
}

async function getProcessItems(serviceDefinitionId: string, providerServiceId: string): Promise<Process[]> {
  const rows = await sql<Process[]>`
    select sp.step::int as step, coalesce(sp.title, '') as title, coalesce(sp.description, '') as description, coalesce(sp.duration, '') as duration
    from category.service_process sp
    where sp.service_id = ${serviceDefinitionId}::uuid or sp.service_id = ${providerServiceId}::uuid
    order by sp.step asc
  `;
  return rows.map((row, index) => ({
    step: asNumber(row.step, index + 1),
    title: asString(row.title, `Step ${index + 1}`),
    description: asString(row.description),
    duration: asString(row.duration),
  }));
}

async function getFaqs(serviceDefinitionId: string, providerServiceId: string) {
  const rows = await sql<{ q: string | null; a: string | null }[]>`
    select sf.question as q, sf.answer as a
    from category.service_faqs sf
    where sf.service_id = ${serviceDefinitionId}::uuid or sf.service_id = ${providerServiceId}::uuid
    order by sf.id asc
  `;
  return rows.map((row) => ({ q: asString(row.q), a: asString(row.a) })).filter((row) => row.q || row.a);
}

function mapGalleryRow(row: GalleryRow): ServiceGalleryItem {
  return {
    id: row.id,
    title: asString(row.title),
    description: asString(row.description),
    url: row.url,
    mediaType: asString(row.media_type, 'image'),
    displayOrder: asNumber(row.display_order, 0),
    isPrimary: Boolean(row.is_primary),
    source: row.source,
  };
}

async function getGalleryItems(providerServiceId: string, providerId: string, locale: string, fallbackImages: string[]): Promise<ServiceGalleryItem[]> {
  const serviceGallery = await sql<GalleryRow[]>`
    select
      psgi.id::text as id,
      common.get_translation_t(psgi.title_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as title,
      common.get_translation_t(psgi.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as description,
      coalesce(m.file_url, psgi.url) as url,
      coalesce(m.media_type, psgi.media_type, 'image') as media_type,
      psgi.display_order,
      psgi.is_primary,
      'provider_service_gallery'::text as source
    from category.provider_service_gallery_items psgi
    left join media.media_library m on m.id::text = nullif(psgi.url, '')
    where psgi.provider_service_id = ${providerServiceId}::uuid
    order by psgi.is_primary desc, psgi.display_order asc, psgi.create_date desc
  `;

  const providerGallery = serviceGallery.length
    ? []
    : await sql<GalleryRow[]>`
        select
          pgi.id::text as id,
          common.get_translation_t(pgi.title_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as title,
          common.get_translation_t(pgi.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as description,
          coalesce(m.file_url, pgi.url) as url,
          coalesce(m.media_type, pgi.media_type, 'image') as media_type,
          pgi.display_order,
          false as is_primary,
          'provider_gallery'::text as source
        from category.provider_gallery_items pgi
        left join media.media_library m on m.id::text = nullif(pgi.url, '')
        where pgi.service_provider_id = ${providerId}::uuid
        order by pgi.display_order asc, pgi.create_date desc
        limit 12
      `;

  const dbGallery = [...serviceGallery, ...providerGallery].map(mapGalleryRow);
  const existingUrls = new Set(dbGallery.map((item) => item.url));
  const fallbackGallery = fallbackImages
    .filter((url) => !existingUrls.has(url))
    .map((url, index): ServiceGalleryItem => ({
      id: `fallback-${index}`,
      title: '',
      description: '',
      url,
      mediaType: 'image',
      displayOrder: dbGallery.length + index,
      isPrimary: dbGallery.length === 0 && index === 0,
      source: 'fallback',
    }));
  return [...dbGallery, ...fallbackGallery];
}

async function getProviderGalleryItems(providerId: string, locale: string): Promise<ServiceGalleryItem[]> {
  const rows = await sql<GalleryRow[]>`
    select
      pgi.id::text as id,
      common.get_translation_t(pgi.title_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as title,
      common.get_translation_t(pgi.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as description,
      coalesce(m.file_url, pgi.url) as url,
      coalesce(m.media_type, pgi.media_type, 'image') as media_type,
      pgi.display_order,
      false as is_primary,
      'provider_gallery'::text as source
    from category.provider_gallery_items pgi
    left join media.media_library m on m.id::text = nullif(pgi.url, '')
    where pgi.service_provider_id = ${providerId}::uuid
    order by pgi.display_order asc, pgi.create_date desc
    limit 12
  `;
  return rows.map(mapGalleryRow);
}

async function getProvidersForService(serviceDefinitionId: string, locale: string, options: { preferredCurrencyCode: string; customerId?: string | null }) {
  const rows = await sql<ProviderOfferingRow[]>`
    select
      ps.id::text as provider_service_id,
      ps.service_definition_id::text as service_definition_id,
      sp.id::text as provider_id,
      common.get_translation_t(pt.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as provider_type_name,
      coalesce(nullif(common.get_translation_t(ps.display_name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}), ''), common.get_translation_t(sd.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE})) as service_name,
      common.get_translation_t(sp.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as provider_name,
      common.get_translation_t(sp.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as provider_description,
      coalesce(sp_media.file_url, sp.image_url) as provider_image_url,
      coalesce(ps_media.file_url, ps.image_url) as service_image_url,
      sp.city,
      sp.country,
      sp.response_time,
      ps.value as price,
      ps.currency,
      ps.rating,
      ps.review_count,
      sp.rating as provider_rating,
      sp.review_count as provider_review_count,
      sp.accredited as verified,
      ps.is_popular as popular,
      sp.is_sponsored as sponsored,
      ps.duration_minutes
    from category.provider_services ps
    join category.service_providers sp on sp.id = ps.service_provider_id
    join category.service_definitions sd on sd.id = ps.service_definition_id
    left join category.provider_types pt on pt.id = sp.provider_type_id
    left join media.media_library ps_media on ps_media.id::text = nullif(ps.image_url, '')
    left join media.media_library sp_media on sp_media.id::text = nullif(sp.image_url, '')
    where ps.service_definition_id = ${serviceDefinitionId}::uuid
      and ps.is_active = true
      and sp.is_active = true
    order by coalesce(ps.is_popular, false) desc, coalesce(sp.is_sponsored, false) desc, coalesce(ps.rating, sp.rating, 0) desc, ps.value asc, ps.create_date desc
    limit 24
  `;
  return Promise.all(rows.map((row) => mapOffering(row, options)));
}

async function getTopReviews(providerId: string): Promise<TopReview[]> {
  const rows = await sql<ReviewRow[]>`
    select
      spc.id::text as id,
      spc.customer_name,
      spc.country,
      spc.treatment,
      spc.rating,
      spc.comment_text,
      spc.is_verified,
      spc.helpful_count,
      spc.create_date,
      coalesce(array_remove(array_agg(coalesce(m.file_url, ri.image_url) order by ri.id) filter (where ri.image_url is not null), null), array[]::varchar[]) as images
    from category.service_provider_comments spc
    left join category.review_images ri on ri.review_id = spc.id
    left join media.media_library m on m.id::text = nullif(ri.image_url, '')
    where spc.service_provider_id = ${providerId}::uuid and spc.is_public = true
    group by spc.id
    order by spc.rating desc nulls last, spc.helpful_count desc, spc.create_date desc
    limit 6
  `;
  return rows.map((row) => ({
    id: row.id,
    name: row.customer_name,
    country: asString(row.country),
    treatment: asString(row.treatment),
    date: row.create_date instanceof Date ? row.create_date.toISOString() : String(row.create_date),
    rating: asNumber(row.rating, 0),
    review: row.comment_text,
    verified: Boolean(row.is_verified),
    helpful: asNumber(row.helpful_count, 0),
    images: normalizeArray<string>(row.images),
  }));
}

async function getServiceAttributes(providerServiceId: string, serviceDefinitionId: string, locale: string): Promise<ServiceAttribute[]> {
  const rows = await sql<ServiceAttributeRow[]>`
    select
      sad.id::text as id,
      common.get_translation_t(sad.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as name,
      common.get_translation_t(sad.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as description,
      common.get_translation_t(sav.value_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as value,
      sad.is_required,
      sad.affects_pricing,
      sad.display_order,
      at.name as attribute_type,
      coalesce(
        jsonb_agg(
          jsonb_build_object(
            'id', sado.id,
            'name', common.get_translation_t(sado.display_name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}),
            'value', common.get_translation_t(sado.value_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}),
            'additionalPrice', coalesce(sado.additional_price, 0)
          ) order by sado.id
        ) filter (where sado.id is not null),
        '[]'::jsonb
      ) as available_options
    from category.service_attribute_definitions sad
    left join category.attribute_types at on at.id = sad.attribute_type_id
    left join category.service_attribute_values sav on sav.attribute_definition_id = sad.id and sav.provider_service_id = ${providerServiceId}::uuid
    left join category.service_attribute_definition_options sado on sado.service_attribute_definition_id = sad.id
    where sad.service_definition_id = ${serviceDefinitionId}::uuid
    group by sad.id, sav.id, at.name
    order by sad.display_order asc, name asc
  `;

  return rows.map((row) => ({
    id: row.id,
    name: asString(row.name),
    description: asString(row.description),
    value: asString(row.value),
    isRequired: Boolean(row.is_required),
    affectsPricing: Boolean(row.affects_pricing),
    displayOrder: asNumber(row.display_order, 0),
    attributeType: asString(row.attribute_type),
    availableOptions: normalizeJsonArray<any>(row.available_options).map((option) => ({
      id: asNumber(option.id, 0),
      name: asString(option.name),
      value: asString(option.value),
      additionalPrice: asNumber(option.additionalPrice, 0),
    })),
  }));
}

async function getProviderAttributes(providerId: string, locale: string): Promise<ProviderAttribute[]> {
  const rows = await sql<ProviderAttributeRow[]>`
    select
      pa.id::text as id,
      common.get_translation_t(pad.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as name,
      common.get_translation_t(pad.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as description,
      common.get_translation_t(pa.value_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as value,
      pad.is_required,
      at.name as attribute_type
    from category.provider_attributes pa
    join category.provider_attribute_definitions pad on pad.id = pa.attribute_definition_id
    left join category.attribute_types at on at.id = pad.attribute_type_id
    where pa.service_provider_id = ${providerId}::uuid
    order by name asc
  `;
  return rows.map((row) => ({
    id: row.id,
    name: asString(row.name),
    description: asString(row.description),
    value: asString(row.value),
    isRequired: Boolean(row.is_required),
    attributeType: asString(row.attribute_type),
  }));
}

async function getUploadRequirements(serviceDefinitionId: string, locale: string): Promise<ServiceUploadRequirement[]> {
  const rows = await sql<UploadRequirementRow[]>`
    select
      r.id::text as id,
      common.get_translation_t(r.title_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as title,
      common.get_translation_t(r.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as description,
      r.is_required,
      r.max_file_size_bytes,
      r.allowed_extensions,
      r.allowed_mime_types,
      r.max_files,
      coalesce(m.file_url, r.example_file_url) as example_file_url
    from category.service_upload_file_requirements r
    left join media.media_library m on m.id::text = nullif(r.example_file_url, '')
    where r.service_definition_id = ${serviceDefinitionId}::uuid
    order by r.display_order asc, r.create_date asc
  `;
  return rows.map((row) => ({
    id: row.id,
    title: asString(row.title),
    description: asString(row.description),
    isRequired: Boolean(row.is_required),
    maxFileSizeBytes: asNumber(row.max_file_size_bytes, 0),
    allowedExtensions: normalizeArray<string>(row.allowed_extensions),
    allowedMimeTypes: normalizeArray<string>(row.allowed_mime_types),
    maxFiles: asNumber(row.max_files, 1),
    exampleFileUrl: asString(row.example_file_url),
  }));
}

async function getDomainRequirements(serviceDefinitionId: string, locale: string): Promise<ServiceDomainRequirement[]> {
  const rows = await sql<DomainRequirementRow[]>`
    select
      r.id,
      common.get_translation_t(r.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as description,
      r.is_mandatory
    from category.service_definition_domain_requirements r
    where r.service_definition_id = ${serviceDefinitionId}::uuid
    order by r.id asc
  `;
  return rows.map((row) => ({
    id: asNumber(row.id, 0),
    description: asString(row.description),
    isMandatory: Boolean(row.is_mandatory),
  }));
}

async function getAddons(providerServiceId: string, serviceDefinitionId: string, providerTypeId: string, locale: string, preferredCurrencyCode: string): Promise<ServiceAddon[]> {
  const rows = await sql<AddonRow[]>`
    select
      a.id,
      a.name,
      a.description,
      a.icon,
      a.source_type,
      a.addon_kind,
      a.popular,
      coalesce(sdapt.is_required, false) as is_required,
      coalesce(psas.custom_price, a.price, 0) as price,
      a.currency_code,
      coalesce(array_remove(array_agg(ad.detail order by ad.display_order asc) filter (where ad.detail is not null), null), array[]::text[]) as details
    from category.provider_service_addons psa
    join category.addons a on a.id = psa.addon_id
    left join provider_portal.provider_service_addon_settings psas on psas.provider_service_id = psa.provider_service_id and psas.addon_id = psa.addon_id
    left join category.addon_details ad on ad.addon_id = a.id
    left join category.service_definition_addon_provider_types sdapt on sdapt.service_definition_id = ${serviceDefinitionId}::uuid and sdapt.provider_type_id = ${providerTypeId}::uuid
    where psa.provider_service_id = ${providerServiceId}::uuid
      and a.is_active = true
      and coalesce(psas.is_enabled, true) = true
    group by a.id, psas.custom_price, sdapt.is_required
    order by coalesce(a.popular, false) desc, a.name asc
  `;

  const mapped = await Promise.all(rows.map(async (row) => {
    const price = asNumber(row.price, 0);
    const currency = normalizeCurrencyCode(row.currency_code || 'USD');
    const priceOptions = await safeGetConvertedPriceOptions({
      amount: price,
      sourceCurrencyCode: currency,
      targetCurrencyCodes: [preferredCurrencyCode, currency],
    });
    return {
      id: row.id,
      name: row.name,
      description: asString(row.description),
      icon: asString(row.icon),
      sourceType: asString(row.source_type, 'lsevin'),
      addonKind: asString(row.addon_kind, 'simple'),
      popular: Boolean(row.popular),
      isRequired: Boolean(row.is_required),
      price,
      currency,
      currencySymbol: getCurrencySymbol(currency),
      displayPrice: pickConvertedPrice(priceOptions, preferredCurrencyCode),
      priceOptions,
      details: normalizeArray<string>(row.details),
    } satisfies ServiceAddon;
  }));

  return mapped;
}

async function getOffers(providerServiceId: string, locale: string): Promise<ServiceOffer[]> {
  const rows = await sql<OfferRow[]>`
    select
      o.id::text as id,
      o.title,
      o.subtitle,
      common.get_translation_t(o.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as description,
      o.discount_percent,
      o.valid_until,
      o.code,
      o.is_featured,
      o.usage_limit,
      o.used_count
    from marketing.offers o
    where o.provider_service_id = ${providerServiceId}::uuid
      and coalesce(o.is_active, true) = true
      and o.valid_until > now()
    order by coalesce(o.is_featured, false) desc, o.valid_until asc
    limit 8
  `;
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    subtitle: asString(row.subtitle),
    description: asString(row.description),
    discountPercent: asNumber(row.discount_percent, 0),
    validUntil: row.valid_until instanceof Date ? row.valid_until.toISOString() : String(row.valid_until),
    code: asString(row.code),
    isFeatured: Boolean(row.is_featured),
    usageLimit: asNullableNumber(row.usage_limit),
    usedCount: asNumber(row.used_count, 0),
  }));
}

async function getPolicies(providerId: string, locale: string): Promise<ProviderPolicy[]> {
  const rows = await sql<PolicyRow[]>`
    select
      pp.id::text as id,
      ppt.code,
      coalesce(nullif(common.get_translation_t(ppt.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}), ''), common.get_translation_t(pp.type_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE})) as type,
      coalesce(nullif(common.get_translation_t(pp.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}), ''), common.get_translation_t(ppt.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE})) as description,
      coalesce(ppt.display_order, 0) as display_order
    from category.provider_policies pp
    left join category.provider_policy_types ppt on ppt.id = pp.provider_policy_type_id
    where pp.service_provider_id = ${providerId}::uuid
    order by coalesce(ppt.display_order, 0) asc, type asc
  `;
  return rows.map((row) => ({
    id: row.id,
    code: asString(row.code),
    type: asString(row.type, 'Policy'),
    description: asString(row.description),
    displayOrder: asNumber(row.display_order, 0),
  }));
}

async function getSpecialists(providerId: string, serviceDefinitionId: string, locale: string, preferredCurrencyCode: string, serviceCurrencyCode: string): Promise<ServiceSpecialist[]> {
  const rows = await sql<SpecialistRow[]>`
    select
      ps.id::text as id,
      s.id::text as staff_id,
      common.get_translation_t(s.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as name,
      common.get_translation_t(s.title_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as title,
      common.get_translation_t(s.biography_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as biography,
      coalesce(profile_media.file_url, s.profile_image_url) as image,
      s.rating,
      s.review_count,
      coalesce(nullif(common.get_translation_t(s.specialty_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}), ''), s.specialty) as specialty,
      s.experience,
      s.experience_years,
      s.patients,
      s.success_rate,
      s.consultation_fee,
      s.next_available_label,
      coalesce(array_remove(array_agg(distinct sl.language) filter (where sl.language is not null), null), array[]::text[]) as languages,
      coalesce(array_remove(array_agg(distinct sspec.specialty) filter (where sspec.specialty is not null), null), array[]::text[]) as specializations,
      coalesce(
        jsonb_agg(distinct jsonb_build_object('id', sc.id::text, 'name', sc.name, 'issuer', sc.issuer, 'isVerified', sc.is_verified)) filter (where sc.id is not null),
        '[]'::jsonb
      ) as certifications,
      coalesce(array_remove(array_agg(distinct scred.credential) filter (where scred.credential is not null), null), array[]::text[]) as credentials,
      coalesce(
        jsonb_agg(distinct jsonb_build_object('id', se.id::text, 'degree', se.degree, 'institution', se.institution, 'year', se.year)) filter (where se.id is not null),
        '[]'::jsonb
      ) as education,
      coalesce(
        jsonb_agg(distinct jsonb_build_object(
          'id', sgi.id::text,
          'title', common.get_translation_t(sgi.title_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}),
          'description', common.get_translation_t(sgi.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}),
          'url', coalesce(gallery_media.file_url, sgi.url),
          'mediaType', coalesce(gallery_media.media_type, sgi.media_type, 'image'),
          'displayOrder', sgi.display_order,
          'isPrimary', sgi.is_primary
        )) filter (where sgi.id is not null),
        '[]'::jsonb
      ) as gallery_items,
      exists (
        select 1 from category.staff_services ss
        where ss.staff_id = s.id
          and ss.service_definition_id = ${serviceDefinitionId}::uuid
          and ss.is_active = true
      ) as can_provide_this_service
    from category.provider_staffs ps
    join category.staff s on s.id = ps.staff_id
    left join media.media_library profile_media on profile_media.id::text = nullif(s.profile_image_url, '')
    left join category.staff_languages sl on sl.staff_id = s.id
    left join category.staff_specializations sspec on sspec.staff_id = s.id
    left join category.staff_certifications sc on sc.staff_id = s.id
    left join category.staff_credentials scred on scred.staff_id = s.id
    left join category.staff_education se on se.staff_id = s.id
    left join category.staff_gallery_items sgi on sgi.staff_id = s.id
    left join media.media_library gallery_media on gallery_media.id::text = nullif(sgi.url, '')
    where ps.service_provider_id = ${providerId}::uuid
      and ps.is_active = true
      and s.is_active = true
      and (
        exists (select 1 from category.staff_services ss where ss.staff_id = s.id and ss.service_definition_id = ${serviceDefinitionId}::uuid and ss.is_active = true)
        or not exists (select 1 from category.staff_services ss where ss.staff_id = s.id and ss.is_active = true)
      )
    group by ps.id, s.id, profile_media.file_url
    order by can_provide_this_service desc, coalesce(s.rating, 0) desc, common.get_translation_t(s.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) asc
    limit 12
  `;

  return Promise.all(rows.map(async (row) => {
    const consultationFee = asNumber(row.consultation_fee, 0);
    const consultationCurrency = normalizeCurrencyCode(serviceCurrencyCode || 'USD');
    const priceOptions = await safeGetConvertedPriceOptions({
      amount: consultationFee,
      sourceCurrencyCode: consultationCurrency,
      targetCurrencyCodes: [preferredCurrencyCode, consultationCurrency],
    });
    const galleryItems = normalizeJsonArray<any>(row.gallery_items).map((item): ServiceGalleryItem => ({
      id: asString(item.id),
      title: asString(item.title),
      description: asString(item.description),
      url: asString(item.url),
      mediaType: asString(item.mediaType, 'image'),
      displayOrder: asNumber(item.displayOrder, 0),
      isPrimary: Boolean(item.isPrimary),
      source: 'staff_gallery',
    })).filter((item) => item.id && item.url);

    return {
      id: row.id,
      staffId: row.staff_id,
      name: row.name,
      title: asString(row.title),
      biography: asString(row.biography),
      image: asString(row.image),
      rating: asNumber(row.rating, 0),
      reviewCount: asNumber(row.review_count, 0),
      specialty: asString(row.specialty),
      experience: asString(row.experience),
      experienceYears: asNullableNumber(row.experience_years),
      patients: asString(row.patients),
      successRate: asString(row.success_rate),
      consultationFee,
      consultationCurrency,
      consultationDisplayPrice: pickConvertedPrice(priceOptions, preferredCurrencyCode),
      nextAvailableLabel: asString(row.next_available_label),
      languages: normalizeArray<string>(row.languages),
      specializations: normalizeArray<string>(row.specializations),
      certifications: normalizeJsonArray<any>(row.certifications).map((item): StaffCertification => ({
        id: asString(item.id),
        name: asString(item.name),
        issuer: asString(item.issuer),
        isVerified: Boolean(item.isVerified),
      })).filter((item) => item.id && item.name),
      credentials: normalizeArray<string>(row.credentials),
      education: normalizeJsonArray<any>(row.education).map((item): StaffEducation => ({
        id: asString(item.id),
        degree: asString(item.degree),
        institution: asString(item.institution),
        year: asNullableNumber(item.year),
      })).filter((item) => item.id && item.degree),
      galleryItems,
      canProvideThisService: Boolean(row.can_provide_this_service),
    } satisfies ServiceSpecialist;
  }));
}

export async function getServicePageByIdFromDb({
  serviceId,
  locale,
  userId,
  preferredCurrencyCode,
  selectedCountryCode,
  browserCountryCode,
}: {
  serviceId: string;
  locale?: string | null;
  userId?: string | null;
  preferredCurrencyCode?: string | null;
  selectedCountryCode?: string | null;
  browserCountryCode?: string | null;
}): Promise<GetServicePageByIdResponse | null> {
  // if (!isUuid(serviceId)) return null;

  const normalizedLocale = normalizeLocale(locale);
  const row = await getPrimaryServiceRow(serviceId, normalizedLocale);
  if (!row) return null;

  const sourceCurrencyCode = normalizeCurrencyCode(row.currency);
  const resolvedDisplayCurrencyCode = await safeResolvePreferredCurrencyCode({
    userId,
    explicitCurrencyCode: preferredCurrencyCode,
    selectedCountryCode,
    browserCountryCode,
    fallbackCurrencyCode: sourceCurrencyCode,
  });

  const fallbackImages = uniqueNonEmpty([row.image_url, row.provider_image_url]);

  const [
    included,
    process,
    faqs,
    providers,
    topReviews,
    galleryItems,
    providerGalleryItems,
    isFavorite,
    serviceAttributes,
    providerAttributes,
    uploadRequirements,
    domainRequirements,
    addOns,
    offers,
    policies,
    specialists,
  ] = await Promise.all([
    getIncludedItems(row.service_definition_id, row.provider_service_id),
    getProcessItems(row.service_definition_id, row.provider_service_id),
    getFaqs(row.service_definition_id, row.provider_service_id),
    getProvidersForService(row.service_definition_id, normalizedLocale, { preferredCurrencyCode: resolvedDisplayCurrencyCode, customerId: userId }),
    getTopReviews(row.provider_id),
    getGalleryItems(row.provider_service_id, row.provider_id, normalizedLocale, fallbackImages),
    getProviderGalleryItems(row.provider_id, normalizedLocale),
    getIsFavorite({ customerId: userId, favoriteType: 'service', entityId: row.provider_service_id }),
    getServiceAttributes(row.provider_service_id, row.service_definition_id, normalizedLocale),
    getProviderAttributes(row.provider_id, normalizedLocale),
    getUploadRequirements(row.service_definition_id, normalizedLocale),
    getDomainRequirements(row.service_definition_id, normalizedLocale),
    getAddons(row.provider_service_id, row.service_definition_id, row.provider_type_id, normalizedLocale, resolvedDisplayCurrencyCode),
    getOffers(row.provider_service_id, normalizedLocale),
    getPolicies(row.provider_id, normalizedLocale),
    getSpecialists(row.provider_id, row.service_definition_id, normalizedLocale, resolvedDisplayCurrencyCode, sourceCurrencyCode),
  ]);

  const images = uniqueNonEmpty(galleryItems.map((item) => item.url));
  const price = asNumber(row.value, 0);
  const rating = asNumber(row.rating ?? row.provider_rating, 0);
  const reviewCount = asNumber(row.review_count ?? row.provider_review_count, 0);
  const durationMinutes = asNumber(row.duration_minutes, 0);
  const duration = durationMinutes > 0 ? `${durationMinutes} min` : 'On request';
  const allowedDisplayCurrencies = uniqueCurrencyCodes([sourceCurrencyCode, resolvedDisplayCurrencyCode, ...DEFAULT_DISPLAY_CURRENCIES]);

  const [priceOptions, originalPriceOptions] = await Promise.all([
    safeGetConvertedPriceOptions({ amount: price, sourceCurrencyCode, targetCurrencyCodes: allowedDisplayCurrencies }),
    safeGetConvertedPriceOptions({ amount: price, sourceCurrencyCode, targetCurrencyCodes: allowedDisplayCurrencies }),
  ]);

  const displayPrice = pickConvertedPrice(priceOptions, resolvedDisplayCurrencyCode);
  const displayOriginalPrice = pickConvertedPrice(originalPriceOptions, resolvedDisplayCurrencyCode);
  const otherCurrencies = priceOptions.map(convertedMoneyToOtherCurrency).filter((item) => item.code !== sourceCurrencyCode);

  const providerProfile = {
    id: row.provider_id,
    name: row.provider_name,
    description: asString(row.provider_description),
    image: asString(row.provider_image_url),
    providerTypeName: asString(row.provider_type_name),
    gradeName: asString(row.provider_grade_name),
    email: asString(row.provider_email),
    phone: asString(row.provider_phone),
    city: asString(row.provider_city),
    country: asString(row.provider_country),
    street: asString(row.provider_street),
    detail: asString(row.provider_detail),
    zipCode: asString(row.provider_zip_code),
    latitude: asNullableNumber(row.provider_latitude),
    longitude: asNullableNumber(row.provider_longitude),
    timezoneId: asString(row.provider_timezone_id, 'UTC'),
    rating: asNumber(row.provider_rating, 0),
    reviewCount: asNumber(row.provider_review_count, 0),
    accredited: Boolean(row.provider_accredited),
    responseTime: asString(row.provider_response_time),
    establishedYear: asNullableNumber(row.provider_established_year),
    totalPatients: asString(row.provider_total_patients),
    successRate: asString(row.provider_success_rate),
    languages: normalizeArray<string>(row.provider_languages),
    specialties: normalizeArray<string>(row.provider_specialties),
    isSponsored: Boolean(row.provider_is_sponsored),
    sponsoredTag: asString(row.provider_sponsored_tag),
  };

  const service: Service = {
    id: row.provider_service_id,
    providerServiceId: row.provider_service_id,
    serviceDefinitionId: row.service_definition_id,
    categoryId: row.category_id,
    categoryName: asString(row.category_name),
    name: asString(row.service_name, row.service_definition_name),
    subtitle: asString(row.service_description, row.service_definition_description),
    definitionName: asString(row.service_definition_name),
    definitionDescription: asString(row.service_definition_description),
    clinic: row.provider_name,
    clinicId: row.provider_id,
    providerDescription: asString(row.provider_description),
    providerProfile,
    location: [row.provider_city, row.provider_country].filter(Boolean).join(', '),
    city: asString(row.provider_city),
    country: asString(row.provider_country),
    price,
    originalPrice: price,
    currency: sourceCurrencyCode,
    currencySymbol: getCurrencySymbol(sourceCurrencyCode),
    displayCurrencyCode: resolvedDisplayCurrencyCode,
    displayPrice,
    displayOriginalPrice,
    priceOptions,
    originalPriceOptions,
    otherCurrencies,
    rating,
    reviews: reviewCount,
    images,
    galleryItems,
    duration,
    durationMinutes,
    recovery: asString(row.recovery, 'On request'),
    anesthesia: asString(row.anesthesia, 'On request'),
    stayRequired: asString(row.stay_required, 'On request'),
    verified: Boolean(row.provider_accredited),
    popular: Boolean(row.is_popular || row.provider_is_sponsored),
    successRate: asString(row.success_rate || row.provider_success_rate, 'On request'),
    satisfaction: asString(row.satisfaction, 'On request'),
    bookingUiMode: asString(row.booking_ui_mode, 'default_slot'),
    requiresSpecialist: Boolean(row.requires_specialist),
    providerCount: providers.length,
    isFavorite,
    tags: normalizeArray<string>(row.tags),
    slotIntervalMinutes: asNumber(row.slot_interval_minutes, 15),
  };

  const { localRecommendations, internationalRecommendations } = splitRecommendations(providers, row.provider_service_id, service.country);

  return {
    service,
    included,
    process,
    faqs,
    topReviews,
    providers,
    localRecommendations,
    internationalRecommendations,
    serviceAttributes,
    providerAttributes,
    uploadRequirements,
    domainRequirements,
    addOns,
    offers,
    specialists,
    policies,
    providerGalleryItems,
  };
}

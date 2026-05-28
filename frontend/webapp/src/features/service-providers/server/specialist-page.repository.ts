import "server-only";

import sql from "@/config/database/db";
import { convertMoney, resolvePreferredCurrencyCode } from "@/features/finance/lib/server/currency-queries";

import type {
  SpecialistAchievement,
  SpecialistAvailability,
  SpecialistBeforeAfter,
  SpecialistCertification,
  SpecialistCredential,
  SpecialistEducation,
  SpecialistGalleryItem,
  SpecialistMoney,
  SpecialistPageResponse,
  SpecialistProvider,
  SpecialistReview,
  SpecialistService,
} from "../types/specialist-page-types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEFAULT_FALLBACK_LOCALE = "en-US";
const DEFAULT_CONSULTATION_CURRENCY = "USD";

function isUuid(value: string | null | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value);
}

function normalizeLocale(locale?: string | null) {
  const normalized = String(locale || DEFAULT_FALLBACK_LOCALE).trim().replace("_", "-");
  return normalized || DEFAULT_FALLBACK_LOCALE;
}

function asNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const next = Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const next = Number(value);
  return Number.isFinite(next) ? next : null;
}

function asString(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim().length > 0 ? value : fallback;
}

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value.filter(Boolean) as T[]) : [];
}

function normalizeJsonArray<T>(value: unknown): T[] {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean) as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed.filter(Boolean) as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

function normalizeReviewReplies(value: unknown) {
  return normalizeJsonArray<Record<string, unknown>>(value)
    .map((row) => ({
      id: String(row.id || ""),
      name: asString(row.name, "LSevin"),
      role: row.role === "admin" ? "admin" as const : "customer" as const,
      reply: asString(row.reply),
      date: asString(row.date),
      verified: Boolean(row.verified),
      createdByAdmin: Boolean(row.createdByAdmin),
    }))
    .filter((item) => item.id && item.reply);
}

function uniqueNonEmpty(values: Array<string | null | undefined>) {
  return Array.from(new Set(values.map((value) => String(value || "").trim()).filter(Boolean)));
}

function buildLocation(city?: string | null, country?: string | null) {
  return [city, country].map((value) => String(value || "").trim()).filter(Boolean).join(", ");
}

function fallbackMoney(amount: number, currencyCode: string): SpecialistMoney {
  const normalizedCurrencyCode = String(currencyCode || "USD").toUpperCase();

  return {
    sourceAmount: amount,
    sourceCurrencyCode: normalizedCurrencyCode,
    displayAmount: amount,
    displayCurrencyCode: normalizedCurrencyCode,
    baseRate: 1,
    appliedRate: 1,
    marginPercent: 0,
    exchangeRateIds: [],
    ratePath: [normalizedCurrencyCode, normalizedCurrencyCode],
    asOf: new Date().toISOString(),
    expiresAt: null,
    converted: false,
  };
}

async function safeConvertMoney(input: {
  amount: number;
  sourceCurrencyCode: string;
  targetCurrencyCode: string;
  marginProfile?: string;
}): Promise<SpecialistMoney> {
  const sourceCurrencyCode = String(input.sourceCurrencyCode || "USD").toUpperCase();
  const targetCurrencyCode = String(input.targetCurrencyCode || sourceCurrencyCode).toUpperCase();

  if (sourceCurrencyCode === targetCurrencyCode) {
    return fallbackMoney(input.amount, sourceCurrencyCode);
  }

  try {
    const converted = await convertMoney({
      amount: input.amount,
      sourceCurrencyCode,
      targetCurrencyCode,
      marginProfile: input.marginProfile || "standard",
    });

    return {
      sourceAmount: converted.sourceAmount,
      sourceCurrencyCode: converted.sourceCurrencyCode,
      displayAmount: converted.targetAmount,
      displayCurrencyCode: converted.targetCurrencyCode,
      baseRate: converted.baseRate,
      appliedRate: converted.appliedRate,
      marginPercent: converted.marginPercent,
      exchangeRateIds: converted.exchangeRateIds,
      ratePath: converted.ratePath,
      asOf: converted.asOf,
      expiresAt: converted.expiresAt,
      converted: converted.sourceCurrencyCode !== converted.targetCurrencyCode,
    };
  } catch (error) {
    console.warn("Failed to convert specialist price. Falling back to source currency.", {
      sourceCurrencyCode,
      targetCurrencyCode,
      amount: input.amount,
      error,
    });

    return fallbackMoney(input.amount, sourceCurrencyCode);
  }
}

type SpecialistRow = {
  id: string;
  name: string;
  biography: string | null;
  title: string | null;
  profileImageUrl: string | null;
  experience: string | null;
  patients: string | null;
  rating: number | string | null;
  specialty: string | null;
  consultationFee: number | string | null;
  nextAvailableLabel: string | null;
  reviewCount: number | string | null;
  experienceYears: number | string | null;
  successRate: string | null;
  languages: string[] | null;
  specializations: string[] | null;
  verified: boolean | null;
};

type ProviderRow = {
  id: string;
  providerStaffId: string;
  name: string;
  description: string | null;
  image: string | null;
  providerTypeName: string | null;
  city: string | null;
  country: string | null;
  rating: number | string | null;
  reviewCount: number | string | null;
  accredited: boolean | null;
  responseTime: string | null;
  notes: string | null;
};

type ServiceRow = {
  providerServiceId: string;
  serviceDefinitionId: string;
  providerId: string;
  providerName: string;
  name: string;
  description: string | null;
  image: string | null;
  city: string | null;
  country: string | null;
  value: number | string | null;
  currency: string;
  durationMinutes: number | string | null;
  rating: number | string | null;
  reviewCount: number | string | null;
  isPopular: boolean | null;
  recovery: string | null;
  anesthesia: string | null;
  stayRequired: string | null;
  successRate: string | null;
  satisfaction: string | null;
  bookingUiMode: string | null;
  requiresSpecialist: boolean | null;
  tags: string[] | null;
};

type ReviewRow = {
  id: string;
  providerId: string;
  providerName: string;
  customerName: string;
  country: string | null;
  rating: number | string | null;
  commentText: string;
  treatment: string | null;
  isVerified: boolean | null;
  helpfulCount: number | string | null;
  notHelpfulCount: number | string | null;
  pros: string[] | null;
  cons: string[] | null;
  createdByAdmin: boolean | null;
  createDate: string | Date;
  images: string[] | null;
  replies: unknown;
};

async function getSpecialistRow(specialistId: string, locale: string) {
  const rows = await sql<SpecialistRow[]>`
    select
      s.id::text as id,
      common.get_translation_t(s.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as name,
      common.get_translation_t(s.biography_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as biography,
      common.get_translation_t(s.title_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as title,
      coalesce(profile_media.file_url, s.profile_image_url) as "profileImageUrl",
      s.experience,
      s.patients,
      s.rating,
      coalesce(
        nullif(common.get_translation_t(s.specialty_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}), ''),
        nullif(s.specialty, ''),
        ''
      ) as specialty,
      s.consultation_fee as "consultationFee",
      s.next_available_label as "nextAvailableLabel",
      s.review_count as "reviewCount",
      s.experience_years as "experienceYears",
      s.success_rate as "successRate",
      coalesce(
        array_remove(array_agg(distinct sl.language) filter (where sl.language is not null), null),
        array[]::text[]
      ) as languages,
      coalesce(
        array_remove(array_agg(distinct ss.specialty) filter (where ss.specialty is not null), null),
        array[]::text[]
      ) as specializations,
      exists (
        select 1
        from category.staff_certifications sc
        where sc.staff_id = s.id
          and sc.is_verified = true
      ) as verified
    from category.staff s
    left join media.media_library profile_media on profile_media.id::text = nullif(s.profile_image_url, '')
    left join category.staff_languages sl on sl.staff_id = s.id
    left join category.staff_specializations ss on ss.staff_id = s.id
    where s.id = ${specialistId}::uuid
      and s.is_active = true
    group by s.id, profile_media.file_url
    limit 1
  `;

  return rows[0] ?? null;
}

async function getSpecialistProviders(specialistId: string, locale: string): Promise<SpecialistProvider[]> {
  const rows = await sql<ProviderRow[]>`
    select
      sp.id::text as id,
      ps.id::text as "providerStaffId",
      common.get_translation_t(sp.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as name,
      common.get_translation_t(sp.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as description,
      coalesce(nullif(sp.image_url, ''), provider_gallery.url) as image,
      common.get_translation_t(pt.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as "providerTypeName",
      sp.city,
      sp.country,
      sp.rating,
      sp.review_count as "reviewCount",
      sp.accredited,
      sp.response_time as "responseTime",
      common.get_translation_t(ps.notes_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as notes
    from category.provider_staffs ps
    join category.service_providers sp on sp.id = ps.service_provider_id
    left join category.provider_types pt on pt.id = sp.provider_type_id
    left join lateral (
      select pgi.url
      from category.provider_gallery_items pgi
      where pgi.service_provider_id = sp.id
        and nullif(pgi.url, '') is not null
      order by pgi.display_order asc, pgi.create_date asc
      limit 1
    ) provider_gallery on true
    where ps.staff_id = ${specialistId}::uuid
      and ps.is_active = true
      and sp.is_active = true
    order by
      coalesce(sp.is_sponsored, false) desc,
      coalesce(sp.rating, 0) desc,
      sp.create_date desc
  `;

  return rows.map((row) => ({
    id: row.id,
    providerStaffId: row.providerStaffId,
    name: asString(row.name, "Provider"),
    description: asString(row.description),
    image: row.image,
    providerTypeName: asString(row.providerTypeName),
    city: asString(row.city),
    country: asString(row.country),
    location: buildLocation(row.city, row.country),
    rating: asNumber(row.rating, 0),
    reviewCount: asNumber(row.reviewCount, 0),
    accredited: Boolean(row.accredited),
    responseTime: asString(row.responseTime, "On request"),
    notes: asString(row.notes),
  }));
}

async function getSpecialistServiceRows(specialistId: string, locale: string): Promise<ServiceRow[]> {
  return sql<ServiceRow[]>`
    with linked_providers as (
      select distinct ps.service_provider_id
      from category.provider_staffs ps
      join category.service_providers sp on sp.id = ps.service_provider_id
      where ps.staff_id = ${specialistId}::uuid
        and ps.is_active = true
        and sp.is_active = true
    ), specialist_service_defs as (
      select distinct ss.service_definition_id
      from category.staff_services ss
      join category.service_definitions sd on sd.id = ss.service_definition_id
      where ss.staff_id = ${specialistId}::uuid
        and ss.is_active = true
        and sd.is_active = true
    )
    select
      ps.id::text as "providerServiceId",
      ps.service_definition_id::text as "serviceDefinitionId",
      sp.id::text as "providerId",
      common.get_translation_t(sp.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as "providerName",
      coalesce(
        nullif(common.get_translation_t(ps.display_name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}), ''),
        common.get_translation_t(sd.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE})
      ) as name,
      coalesce(
        nullif(common.get_translation_t(ps.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}), ''),
        common.get_translation_t(sd.description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE})
      ) as description,
      coalesce(nullif(ps.image_url, ''), service_gallery.url, nullif(sp.image_url, ''), provider_gallery.url) as image,
      sp.city,
      sp.country,
      ps.value,
      ps.currency,
      coalesce(nullif(ps.duration_minutes, 0), sd.duration_minutes) as "durationMinutes",
      coalesce(ps.rating, sp.rating, 0) as rating,
      coalesce(ps.review_count, sp.review_count, 0) as "reviewCount",
      ps.is_popular as "isPopular",
      ps.recovery,
      ps.anesthesia,
      ps.stay_required as "stayRequired",
      coalesce(ps.success_rate, sp.success_rate) as "successRate",
      ps.satisfaction,
      sd.booking_ui_mode as "bookingUiMode",
      sd.requires_specialist as "requiresSpecialist",
      ps.tags
    from category.provider_services ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    join category.service_providers sp on sp.id = ps.service_provider_id
    left join lateral (
      select psgi.url
      from category.provider_service_gallery_items psgi
      where psgi.provider_service_id = ps.id
        and nullif(psgi.url, '') is not null
      order by psgi.is_primary desc, psgi.display_order asc, psgi.create_date asc
      limit 1
    ) service_gallery on true
    left join lateral (
      select pgi.url
      from category.provider_gallery_items pgi
      where pgi.service_provider_id = sp.id
        and nullif(pgi.url, '') is not null
      order by pgi.display_order asc, pgi.create_date asc
      limit 1
    ) provider_gallery on true
    where ps.service_provider_id in (select service_provider_id from linked_providers)
      and ps.is_active = true
      and sd.is_active = true
      and sp.is_active = true
      and (
        exists (select 1 from specialist_service_defs ssd where ssd.service_definition_id = ps.service_definition_id)
        or not exists (select 1 from specialist_service_defs)
      )
    order by
      coalesce(ps.is_popular, false) desc,
      coalesce(ps.rating, sp.rating, 0) desc,
      ps.value asc,
      ps.create_date desc
    limit 40
  `;
}

async function mapServices(rows: ServiceRow[], targetCurrencyCode: string): Promise<SpecialistService[]> {
  return Promise.all(
    rows.map(async (row) => {
      const amount = asNumber(row.value, 0);
      const price = await safeConvertMoney({
        amount,
        sourceCurrencyCode: row.currency,
        targetCurrencyCode,
        marginProfile: "standard",
      });

      return {
        id: row.providerServiceId,
        providerServiceId: row.providerServiceId,
        serviceDefinitionId: row.serviceDefinitionId,
        providerId: row.providerId,
        providerName: asString(row.providerName, "Provider"),
        name: asString(row.name, "Service"),
        description: asString(row.description),
        image: row.image,
        city: asString(row.city),
        country: asString(row.country),
        durationMinutes: asNumber(row.durationMinutes, 0),
        rating: asNumber(row.rating, 0),
        reviewCount: asNumber(row.reviewCount, 0),
        isPopular: Boolean(row.isPopular),
        recovery: asString(row.recovery, "On request"),
        anesthesia: asString(row.anesthesia, "On request"),
        stayRequired: asString(row.stayRequired, "On request"),
        successRate: asString(row.successRate, "On request"),
        satisfaction: asString(row.satisfaction, "On request"),
        bookingUiMode: asString(row.bookingUiMode, "default_slot"),
        requiresSpecialist: Boolean(row.requiresSpecialist),
        tags: normalizeArray<string>(row.tags),
        price,
      };
    })
  );
}

async function getEducation(specialistId: string): Promise<SpecialistEducation[]> {
  const rows = await sql<SpecialistEducation[]>`
    select
      id::text as id,
      degree,
      institution,
      year,
      image_url as "imageUrl"
    from category.staff_education
    where staff_id = ${specialistId}::uuid
    order by year desc nulls last, create_date desc
  `;

  return rows.map((row) => ({
    id: row.id,
    degree: asString(row.degree),
    institution: asString(row.institution),
    year: asNullableNumber(row.year),
    imageUrl: asString(row.imageUrl),
  }));
}

async function getCertifications(specialistId: string): Promise<SpecialistCertification[]> {
  const rows = await sql<SpecialistCertification[]>`
    select
      id::text as id,
      name,
      issuer,
      is_verified as verified,
      image_url as "imageUrl"
    from category.staff_certifications
    where staff_id = ${specialistId}::uuid
    order by is_verified desc, create_date desc
  `;

  return rows.map((row) => ({
    id: row.id,
    name: asString(row.name),
    issuer: asString(row.issuer),
    verified: Boolean(row.verified),
    imageUrl: asString(row.imageUrl),
  }));
}

async function getCredentials(specialistId: string): Promise<SpecialistCredential[]> {
  const rows = await sql<SpecialistCredential[]>`
    select
      id::text as id,
      credential,
      is_verified as verified,
      image_url as "imageUrl"
    from category.staff_credentials
    where staff_id = ${specialistId}::uuid
    order by is_verified desc, credential asc
  `;

  return rows.map((row) => ({
    id: row.id,
    credential: asString(row.credential),
    verified: Boolean(row.verified),
    imageUrl: asString(row.imageUrl),
  }));
}

async function getAchievements(specialistId: string): Promise<SpecialistAchievement[]> {
  const rows = await sql<SpecialistAchievement[]>`
    select
      id::text as id,
      icon,
      title,
      organization,
      display_order as "displayOrder"
    from category.staff_achievements
    where staff_id = ${specialistId}::uuid
    order by display_order asc, create_date desc
  `;

  return rows.map((row, index) => ({
    id: row.id,
    icon: row.icon,
    title: asString(row.title),
    organization: asString(row.organization),
    displayOrder: asNumber(row.displayOrder, index),
  }));
}

async function getGallery(specialistId: string, locale: string): Promise<SpecialistGalleryItem[]> {
  const rows = await sql<SpecialistGalleryItem[]>`
    select
      id::text as id,
      common.get_translation_t(title_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as title,
      common.get_translation_t(description_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as description,
      url,
      media_type as "mediaType",
      display_order as "displayOrder",
      is_primary as "isPrimary"
    from category.staff_gallery_items
    where staff_id = ${specialistId}::uuid
    order by is_primary desc, display_order asc, create_date desc
  `;

  return rows.map((row, index) => ({
    id: row.id,
    title: asString(row.title),
    description: asString(row.description),
    url: row.url,
    mediaType: asString(row.mediaType, "image"),
    displayOrder: asNumber(row.displayOrder, index),
    isPrimary: Boolean(row.isPrimary),
  }));
}

async function getBeforeAfter(specialistId: string): Promise<SpecialistBeforeAfter[]> {
  const rows = await sql<SpecialistBeforeAfter[]>`
    select
      id::text as id,
      before_image as before,
      after_image as after,
      procedure,
      months,
      display_order as "displayOrder"
    from category.staff_before_after
    where staff_id = ${specialistId}::uuid
    order by display_order asc, create_date desc
  `;

  return rows.map((row, index) => ({
    id: row.id,
    before: row.before,
    after: row.after,
    procedure: asString(row.procedure),
    months: asNullableNumber(row.months),
    displayOrder: asNumber(row.displayOrder, index),
  }));
}

async function getAvailability(specialistId: string): Promise<SpecialistAvailability[]> {
  const rows = await sql<SpecialistAvailability[]>`
    select
      sa.id::text as id,
      sa.day_of_week as "dayOfWeek",
      coalesce(sas.name, 'Available') as status,
      sa.is_recurring as "isRecurring",
      sa.specific_date::text as "specificDate",
      sa.start_time::text as "startTime",
      sa.end_time::text as "endTime"
    from category.staff_availabilities sa
    left join category.staff_availability_statuses sas on sas.id = sa.availability_status_id
    where sa.staff_id = ${specialistId}::uuid
    order by sa.day_of_week asc, sa.start_time asc, sa.specific_date asc nulls last
  `;

  return rows.map((row) => ({
    id: row.id,
    dayOfWeek: asNumber(row.dayOfWeek, 0),
    status: asString(row.status, "Available"),
    isRecurring: Boolean(row.isRecurring),
    specificDate: row.specificDate,
    startTime: asString(row.startTime),
    endTime: asString(row.endTime),
  }));
}

async function getReviews(specialistId: string, locale: string): Promise<SpecialistReview[]> {
  const rows = await sql<ReviewRow[]>`
    with linked_providers as (
      select distinct ps.service_provider_id
      from category.provider_staffs ps
      join category.service_providers sp on sp.id = ps.service_provider_id
      where ps.staff_id = ${specialistId}::uuid
        and ps.is_active = true
        and sp.is_active = true
    )
    select
      spc.id::text as id,
      sp.id::text as "providerId",
      common.get_translation_t(sp.name_translations, ${locale}, ${DEFAULT_FALLBACK_LOCALE}) as "providerName",
      spc.customer_name as "customerName",
      spc.country,
      spc.rating,
      spc.comment_text as "commentText",
      spc.treatment,
      spc.is_verified as "isVerified",
      spc.helpful_count as "helpfulCount",
      coalesce(spc.not_helpful_count, 0) as "notHelpfulCount",
      coalesce(spc.pros, array[]::text[]) as pros,
      coalesce(spc.cons, array[]::text[]) as cons,
      coalesce(spc.created_by_admin, false) as "createdByAdmin",
      spc.create_date as "createDate",
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', r.id::text,
            'name', r.author_name,
            'role', r.author_role,
            'reply', r.reply_text,
            'date', r.create_date::text,
            'verified', coalesce(r.is_verified, false),
            'createdByAdmin', coalesce(r.created_by_admin, false)
          )
          order by coalesce(r.created_by_admin, false) desc, r.create_date asc
        )
        from category.service_provider_comment_replies r
        where r.review_id = spc.id
          and r.is_public = true
          and coalesce(r.moderation_status, case when r.is_public then 'approved' else 'pending' end) = 'approved'
      ), '[]'::jsonb) as replies,
      coalesce(
        array_remove(array_agg(ri.image_url order by ri.id) filter (where ri.image_url is not null), null),
        array[]::varchar[]
      ) as images
    from category.service_provider_comments spc
    join category.service_providers sp on sp.id = spc.service_provider_id
    left join category.review_images ri on ri.review_id = spc.id
    where spc.service_provider_id in (select service_provider_id from linked_providers)
      and spc.is_public = true
      and coalesce(spc.moderation_status, case when spc.is_public then 'approved' else 'pending' end) = 'approved'
      and (
        spc.staff_id = ${specialistId}::uuid
        or (spc.staff_id is null and spc.provider_service_id is null)
      )
    group by spc.id, sp.id, sp.name_translations
    order by
      case when spc.staff_id = ${specialistId}::uuid then 0 else 1 end,
      spc.rating desc nulls last,
      spc.helpful_count desc,
      spc.create_date desc
    limit 20
  `;

  return rows.map((row) => ({
    id: row.id,
    providerId: row.providerId,
    providerName: asString(row.providerName, "Provider"),
    name: asString(row.customerName, "Guest"),
    country: asString(row.country),
    date: row.createDate instanceof Date ? row.createDate.toISOString() : String(row.createDate),
    rating: asNumber(row.rating, 0),
    treatment: asString(row.treatment),
    review: row.commentText,
    verified: Boolean(row.isVerified),
    helpful: asNumber(row.helpfulCount, 0),
    notHelpful: asNumber(row.notHelpfulCount, 0),
    pros: normalizeArray<string>(row.pros),
    cons: normalizeArray<string>(row.cons),
    images: normalizeArray<string>(row.images),
    createdByAdmin: Boolean(row.createdByAdmin),
    replies: normalizeReviewReplies(row.replies),
  }));
}

export async function getSpecialistPageFromDb({
  specialistId,
  locale,
  userId,
  explicitCurrencyCode,
  selectedCountryCode,
  browserCountryCode,
}: {
  specialistId: string;
  locale?: string | null;
  userId?: string | null;
  explicitCurrencyCode?: string | null;
  selectedCountryCode?: string | null;
  browserCountryCode?: string | null;
}): Promise<SpecialistPageResponse | null> {
  if (!isUuid(specialistId)) return null;

  const normalizedLocale = normalizeLocale(locale);
  const specialistRow = await getSpecialistRow(specialistId, normalizedLocale);
  if (!specialistRow) return null;

  const serviceRows = await getSpecialistServiceRows(specialistId, normalizedLocale);
  const firstServiceCurrency = serviceRows[0]?.currency || DEFAULT_CONSULTATION_CURRENCY;

  const displayCurrencyCode = await resolvePreferredCurrencyCode({
    userId,
    explicitCurrencyCode,
    selectedCountryCode,
    browserCountryCode,
    fallbackCurrencyCode: firstServiceCurrency,
  });

  const [
    providers,
    services,
    education,
    certifications,
    credentials,
    achievements,
    gallery,
    recentReviews,
    beforeAfter,
    availability,
  ] = await Promise.all([
    getSpecialistProviders(specialistId, normalizedLocale),
    mapServices(serviceRows, displayCurrencyCode),
    getEducation(specialistId),
    getCertifications(specialistId),
    getCredentials(specialistId),
    getAchievements(specialistId),
    getGallery(specialistId, normalizedLocale),
    getReviews(specialistId, normalizedLocale),
    getBeforeAfter(specialistId),
    getAvailability(specialistId),
  ]);

  const consultationAmount = asNumber(specialistRow.consultationFee, 0);
  const consultationPrice = await safeConvertMoney({
    amount: consultationAmount,
    sourceCurrencyCode: DEFAULT_CONSULTATION_CURRENCY,
    targetCurrencyCode: displayCurrencyCode,
    marginProfile: "standard",
  });

  const specializations = uniqueNonEmpty([
    specialistRow.specialty,
    ...normalizeArray<string>(specialistRow.specializations),
  ]);

  return {
    specialist: {
      id: specialistRow.id,
      name: asString(specialistRow.name, "Specialist"),
      title: asString(specialistRow.title),
      specialty: asString(specialistRow.specialty),
      biography: asString(specialistRow.biography),
      image: asString(specialistRow.profileImageUrl),
      rating: asNumber(specialistRow.rating, 0),
      reviews: asNumber(specialistRow.reviewCount, recentReviews.length),
      experience: asString(
        specialistRow.experience,
        specialistRow.experienceYears ? `${specialistRow.experienceYears} years` : "On request"
      ),
      experienceYears: asNullableNumber(specialistRow.experienceYears),
      patients: asString(specialistRow.patients, "On request"),
      successRate: asString(specialistRow.successRate, "On request"),
      verified: Boolean(specialistRow.verified || certifications.some((item) => item.verified)),
      languages: normalizeArray<string>(specialistRow.languages),
      specializations,
      nextAvailableLabel: asString(specialistRow.nextAvailableLabel, "Available on request"),
      consultationPrice,
    },
    providers,
    services,
    education,
    certifications,
    credentials,
    specializations,
    achievements,
    gallery,
    recentReviews,
    beforeAfter,
    availability,
    priceContext: {
      displayCurrencyCode,
      selectedCountryCode: selectedCountryCode || null,
      browserCountryCode: browserCountryCode || null,
    },
  };
}

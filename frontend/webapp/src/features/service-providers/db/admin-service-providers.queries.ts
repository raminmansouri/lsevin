import "server-only";

import { revalidateTag } from "next/cache";

import sql from "@/config/database/db";
import { countryOfLocation } from "@/features/locations/server";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  FilterParams,
} from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getServiceProviderGlobalTag, getServiceProviderIdTag } from "./cache";

export type JsonTranslations = Record<string, string>;

export type AdminLookupOption = {
  id: string | number;
  label: string;
  code?: string;
  parentId?: string | null;
};

export type AdminLookupType =
  | "providerTypes"
  | "grades"
  | "countries"
  | "cities"
  | "categories"
  | "serviceDefinitions"
  | "staff"
  | "providers"
  | "attributeDefinitions"
  | "requestStatuses"
  | "policyTypes"
  | "currencies"
  | "addons";

export type AdminLookupSearchResult = {
  items: AdminLookupOption[];
  hasMore: boolean;
  page: number;
  pageSize: number;
};

export type SearchAdminLookupOptionsParams = {
  type: AdminLookupType;
  locale: string;
  query?: string;
  page?: number;
  pageSize?: number;
  parentId?: string | null;
  providerTypeId?: string | null;
  categoryId?: string | null;
  excludeProviderId?: string | null;
};

export type AdminProviderLookupData = {
  providerTypes: AdminLookupOption[];
  grades: AdminLookupOption[];
  countries: AdminLookupOption[];
  cities: AdminLookupOption[];
  categories: AdminLookupOption[];
  serviceDefinitions: AdminLookupOption[];
  staff: AdminLookupOption[];
  providers: AdminLookupOption[];
  attributeDefinitions: (AdminLookupOption & {
    providerTypeId: string;
    attributeTypeId: number;
    isRequired: boolean;
    validationRules: string;
  })[];
  requestStatuses: AdminLookupOption[];
  policyTypes: AdminLookupOption[];
  currencies: AdminLookupOption[];
  addons: AdminLookupOption[];
};

export type AdminServiceProviderListItem = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  contactEmail: string;
  phoneNumberCountryCode: string | null;
  phoneNumber: string | null;
  address: string;
  isActive: boolean;
  isSponsored: boolean;
  sponsoredTag: string | null;
  accredited: boolean;
  providerTypeId: string;
  providerTypeName: string;
  gradeId: number | null;
  grade: string | null;
  rating: number;
  reviewCount: number;
  country: string;
  city: string;
  serviceCount: number;
  staffCount: number;
  galleryItemCount: number;
  policyCount: number;
  certificationCount: number;
  commentCount: number;
  requestCount: number;
  bookingCount: number;
  featuredScore: number;
  createDate: string;
  lastModifiedDate: string | null;
};

export type AdminProviderAttribute = {
  id: string;
  attributeDefinitionId: string;
  attributeName: string;
  attributeTypeId: number;
  isRequired: boolean;
  validationRules: string;
  value: JsonTranslations;
};

export type AdminProviderGalleryItem = {
  id: string;
  title: JsonTranslations;
  description: JsonTranslations;
  url: string;
  mediaType: string;
  displayOrder: number;
};

export type AdminProviderPolicy = {
  id: string;
  policyTypeId: string | null;
  policyTypeCode: string | null;
  type: JsonTranslations;
  description: JsonTranslations;
  createDate: string;
  lastModifiedDate: string | null;
};

export type AdminProviderCertification = {
  id: string;
  name: string;
  isVerified: boolean;
  imageUrl: string | null;
  secondaryImageUrl: string | null;
};

export type AdminProviderService = {
  id: string;
  serviceDefinitionId: string;
  serviceDefinitionName: string;
  categoryId: string | null;
  categoryName: string | null;
  displayName: JsonTranslations;
  description: JsonTranslations;
  isActive: boolean;
  currency: string;
  value: number;
  durationMinutes: number;
  rating: number;
  reviewCount: number;
  recovery: string | null;
  imageUrl: string | null;
  isPopular: boolean;
  anesthesia: string | null;
  stayRequired: string | null;
  successRate: string | null;
  satisfaction: string | null;
  trendingScore: number;
  growth: string | null;
  tags: string[];
  slotIntervalMinutes: number;
  addonIds: string[];
  galleryItems: AdminProviderGalleryItem[];
};

export type AdminProviderStaff = {
  id: string;
  staffId: string;
  staffName: string;
  staffTitle: string | null;
  profileImageUrl: string | null;
  notes: JsonTranslations;
  isActive: boolean;
};

export type AdminProviderCommentReply = {
  id: string;
  reviewId: string;
  authorName: string;
  authorRole: "admin" | "customer";
  replyText: string;
  isPublic: boolean;
  isVerified: boolean;
  moderationStatus: "pending" | "approved" | "rejected";
  createdByAdmin: boolean;
  createDate: string;
  lastModifiedDate: string | null;
};

export type AdminProviderComment = {
  id: string;
  customerId: string;
  customerName: string;
  commentText: string;
  rating: number | null;
  isPublic: boolean;
  isVerified: boolean;
  helpfulCount: number;
  notHelpfulCount: number;
  pros: string[];
  cons: string[];
  country: string | null;
  treatment: string | null;
  images: string[];
  createDate: string;
  lastModifiedDate: string | null;
  providerServiceId: string | null;
  providerServiceName: string | null;
  staffId: string | null;
  staffName: string | null;
  reviewTarget: "provider" | "service" | "specialist";
  moderationStatus: "pending" | "approved" | "rejected";
  createdByAdmin: boolean;
  replies: AdminProviderCommentReply[];
};

export type AdminProviderRequest = {
  id: string;
  customerId: string;
  customerEmail: string;
  customerFullName: string;
  message: string;
  requestStatusId: number;
  status: string;
  createDate: string;
  lastModifiedDate: string | null;
};

export type AdminProviderBooking = {
  id: string;
  serviceId: string;
  serviceName: string;
  specialistId: string;
  specialistName: string;
  userId: string | null;
  selectedDate: string;
  selectedTimeFrom: string;
  selectedTimeTo: string;
  bookingStatus: string;
  paymentStatus: string | null;
  currencyCode: string | null;
  totalAmount: number | null;
  paidAmount: number;
  confirmationCode: string | null;
  createDate: string;
};

export type AdminProviderDraft = {
  id: string;
  userId: string | null;
  serviceId: string | null;
  serviceName: string | null;
  specialistId: string | null;
  specialistName: string | null;
  selectedDate: string | null;
  currentStep: number;
  status: string;
  currency: string;
  totalAmount: number;
  updatedAt: string;
};

export type AdminProviderRecommendation = {
  id: string;
  sourceProviderId: string;
  targetProviderId: string;
  targetProviderName: string;
  type: string;
  createDate: string | null;
};

export type AdminServiceProviderDetails = {
  id: string;
  name: JsonTranslations;
  description: JsonTranslations;
  detail: JsonTranslations | null;
  street: JsonTranslations | null;
  isActive: boolean;
  providerTypeId: string;
  providerTypeName: string;
  city: string;
  country: string;
  zipCode: string | null;
  email: string;
  phoneNumberCountryCode: string;
  phoneNumber: string;
  gradeId: number | null;
  latitude: number | null;
  longitude: number | null;
  coordinates: { latitude: number; longitude: number } | null;
  rating: number;
  reviewCount: number;
  accredited: boolean;
  responseTime: string | null;
  establishedYear: number | null;
  totalPatients: string | null;
  successRate: string | null;
  languages: string[];
  isSponsored: boolean;
  sponsoredTag: string | null;
  specialties: string[];
  featuredScore: number;
  internationalPriceMultiplier: number | null;
  imageUrl: string | null;
  timezoneId: string;
  createDate: string;
  lastModifiedDate: string | null;
  attributes: AdminProviderAttribute[];
  galleryItems: AdminProviderGalleryItem[];
  policies: AdminProviderPolicy[];
  certifications: AdminProviderCertification[];
  services: AdminProviderService[];
  staff: AdminProviderStaff[];
  comments: AdminProviderComment[];
  requests: AdminProviderRequest[];
  bookings: AdminProviderBooking[];
  bookingDrafts: AdminProviderDraft[];
  recommendations: AdminProviderRecommendation[];
};

export type AdminServiceProviderFilterParams = FilterParams & {
  providerTypeIds?: string[];
  isActive?: boolean;
  isSponsored?: boolean;
  accredited?: boolean;
  country?: string;
  city?: string;
};

type CountRow = { total_count: number | string };

const EMPTY_TRANSLATIONS_SQL = sql`'{}'::jsonb`;

function safeJsonObject(columnSql: any) {
  return sql`case when jsonb_typeof(${columnSql}) = 'object' then ${columnSql} else ${EMPTY_TRANSLATIONS_SQL} end`;
}

function normalizeLocaleCode(locale?: string | null) {
  const normalized = String(locale || "fa-IR")
    .trim()
    .replace("_", "-");
  return normalized || "fa-IR";
}

function translated(columnSql: any, locale: string) {
  const source = safeJsonObject(columnSql);
  const preferred = normalizeLocaleCode(locale);
  const preferredNorm = preferred.toLowerCase();
  const preferredBase = preferredNorm.split("-")[0] || preferredNorm;
  const fallback = "en-US";
  const fallbackNorm = fallback.toLowerCase();
  const fallbackBase = "en";

  return sql`coalesce(
    nullif(btrim(${source} ->> ${preferred}), ''),
    (
      select nullif(btrim(e.value), '')
      from jsonb_each_text(${source}) e
      where lower(replace(e.key, '_', '-')) = ${preferredNorm}
      limit 1
    ),
    (
      select nullif(btrim(e.value), '')
      from jsonb_each_text(${source}) e
      where split_part(lower(replace(e.key, '_', '-')), '-', 1) = ${preferredBase}
      order by case when lower(replace(e.key, '_', '-')) = ${preferredBase} then 0 else 1 end, e.key
      limit 1
    ),
    nullif(btrim(${source} ->> ${fallback}), ''),
    (
      select nullif(btrim(e.value), '')
      from jsonb_each_text(${source}) e
      where lower(replace(e.key, '_', '-')) = ${fallbackNorm}
      limit 1
    ),
    (
      select nullif(btrim(e.value), '')
      from jsonb_each_text(${source}) e
      where split_part(lower(replace(e.key, '_', '-')), '-', 1) = ${fallbackBase}
      order by case when lower(replace(e.key, '_', '-')) = ${fallbackBase} then 0 else 1 end, e.key
      limit 1
    ),
    (
      select nullif(btrim(e.value), '')
      from jsonb_each_text(${source}) e
      where nullif(btrim(e.value), '') is not null
      order by e.key
      limit 1
    ),
    ''
  )`;
}

function asNumber(value: unknown, fallback = 0): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function asNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function asDateString(value: unknown): string {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString();
  return String(value);
}

function normalizeTranslations(value: unknown): JsonTranslations {
  if (!value) return {};

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed.startsWith("{")) return {};
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as JsonTranslations;
      }
    } catch {
      return {};
    }
  }

  if (typeof value !== "object" || Array.isArray(value)) return {};
  return value as JsonTranslations;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is string =>
      typeof item === "string" && item.trim().length > 0,
  );
}

function ok<T>(data: T): ApiReturnType<T> {
  return { data, error: undefined } as ApiReturnType<T>;
}

function fail<T>(
  title: string,
  status = 500,
  detail?: string,
): ApiReturnType<T> {
  return {
    data: undefined,
    error: { title, status, detail },
  } as ApiReturnType<T>;
}

function resolveSearchText(
  params: AdminServiceProviderFilterParams | undefined,
) {
  const value =
    params?.filters ||
    (params as any)?.filter ||
    (params as any)?.search ||
    (params as any)?.q ||
    (params as any)?.query ||
    (params as any)?.globalFilter;

  return typeof value === "string" ? value.trim() : "";
}

function buildWhere(
  params: AdminServiceProviderFilterParams | undefined,
  locale: string,
) {
  const parts: any[] = [];
  const search = resolveSearchText(params);

  if (search) {
    const like = `%${search}%`;
    parts.push(sql`(
      ${translated(sql`sp.name_translations`, locale)} ilike ${like}
      or ${translated(sql`sp.description_translations`, locale)} ilike ${like}
      or ${translated(sql`sp.detail_translations`, locale)} ilike ${like}
      or ${translated(sql`sp.street_translations`, locale)} ilike ${like}
      or sp.email ilike ${like}
      or sp.phone_number ilike ${like}
      or sp.phone_number_country_code ilike ${like}
      or coalesce(sp.country, '') ilike ${like}
      or coalesce(sp.city, '') ilike ${like}
      or coalesce(sp.zip_code, '') ilike ${like}
      or coalesce(sp.sponsored_tag, '') ilike ${like}
      or coalesce(sp.response_time, '') ilike ${like}
      or coalesce(sp.total_patients, '') ilike ${like}
      or coalesce(sp.success_rate, '') ilike ${like}
      or ${translated(sql`pt.name_translations`, locale)} ilike ${like}
      or coalesce(g.name, '') ilike ${like}
      or exists (
        select 1 from unnest(coalesce(sp.specialties, array[]::text[])) s
        where s ilike ${like}
      )
      or exists (
        select 1 from unnest(coalesce(sp.languages, array[]::text[])) l
        where l ilike ${like}
      )
      or exists (
        select 1
        from category.provider_services ps
        join category.service_definitions sd on sd.id = ps.service_definition_id
        left join category.categories c on c.id = sd.category_id
        where ps.service_provider_id = sp.id
          and (
            ${translated(sql`ps.display_name_translations`, locale)} ilike ${like}
            or ${translated(sql`ps.description_translations`, locale)} ilike ${like}
            or ${translated(sql`sd.name_translations`, locale)} ilike ${like}
            or ${translated(sql`sd.description_translations`, locale)} ilike ${like}
            or ${translated(sql`c.name_translations`, locale)} ilike ${like}
            or coalesce(ps.currency, '') ilike ${like}
            or coalesce(ps.recovery, '') ilike ${like}
            or coalesce(ps.anesthesia, '') ilike ${like}
            or coalesce(ps.stay_required, '') ilike ${like}
            or coalesce(ps.success_rate, '') ilike ${like}
            or coalesce(ps.satisfaction, '') ilike ${like}
            or exists (
              select 1 from unnest(coalesce(ps.tags, array[]::text[])) tag
              where tag ilike ${like}
            )
          )
      )
      or exists (
        select 1
        from category.provider_staffs psf
        join category.staff stf on stf.id = psf.staff_id
        where psf.service_provider_id = sp.id
          and (
            ${translated(sql`stf.name_translations`, locale)} ilike ${like}
            or ${translated(sql`stf.title_translations`, locale)} ilike ${like}
            or coalesce(stf.specialty, '') ilike ${like}
          )
      )
    )`);
  }

  if (params?.providerTypeIds?.length) {
    parts.push(sql`sp.provider_type_id::text = any(${params.providerTypeIds})`);
  }
  if (typeof params?.isActive === "boolean") {
    parts.push(sql`sp.is_active = ${params.isActive}`);
  }
  if (typeof params?.isSponsored === "boolean") {
    parts.push(sql`coalesce(sp.is_sponsored, false) = ${params.isSponsored}`);
  }
  if (typeof params?.accredited === "boolean") {
    parts.push(sql`coalesce(sp.accredited, false) = ${params.accredited}`);
  }
  if (params?.country) {
    parts.push(sql`sp.country = ${params.country}`);
  }
  if (params?.city) {
    parts.push(sql`sp.city = ${params.city}`);
  }

  if (!parts.length) return sql``;
  const combined = parts.reduce((acc, part, index) =>
    index === 0 ? part : sql`${acc} and ${part}`,
  );
  return sql`where ${combined}`;
}

function buildOrder(sortOrder?: string, locale = "fa-IR") {
  switch (sortOrder) {
    case "name-asc":
      return sql`${translated(sql`sp.name_translations`, locale)} asc nulls last`;
    case "name-desc":
      return sql`${translated(sql`sp.name_translations`, locale)} desc nulls last`;
    case "rating-desc":
      return sql`sp.rating desc nulls last, sp.review_count desc nulls last`;
    case "featured-desc":
      return sql`sp.featured_score desc nulls last, sp.rating desc nulls last`;
    case "created-asc":
      return sql`sp.create_date asc`;
    case "created-desc":
    default:
      return sql`sp.create_date desc`;
  }
}

export async function getAdminServiceProviders(
  locale: string,
  params?: AdminServiceProviderFilterParams,
): Promise<ApiReturnType<PaginatedResult<AdminServiceProviderListItem>>> {
  try {
    const pageNumber = Math.max(
      1,
      Number(params?.pageNumber || DEFAULT_PAGE_NUMBER),
    );
    const pageSize = Math.min(
      100,
      Math.max(1, Number(params?.pageSize || DEFAULT_PAGE_SIZE)),
    );
    const offset = (pageNumber - 1) * pageSize;
    const whereSql = buildWhere(params, locale);
    const orderSql = buildOrder(params?.sortOrder, locale);

    const rows = await sql<(AdminServiceProviderListItem & CountRow)[]>`
      select
        sp.id::text,
        ${translated(sql`sp.name_translations`, locale)} as name,
        ${translated(sql`sp.description_translations`, locale)} as description,
        sp.image_url as "imageUrl",
        sp.email as "contactEmail",
        sp.phone_number_country_code as "phoneNumberCountryCode",
        sp.phone_number as "phoneNumber",
        concat_ws(', ', nullif(sp.city, ''), nullif(sp.country, ''), nullif(sp.zip_code, '')) as address,
        sp.is_active as "isActive",
        coalesce(sp.is_sponsored, false) as "isSponsored",
        sp.sponsored_tag as "sponsoredTag",
        coalesce(sp.accredited, false) as accredited,
        sp.provider_type_id::text as "providerTypeId",
        ${translated(sql`pt.name_translations`, locale)} as "providerTypeName",
        sp.grade_id as "gradeId",
        g.name as grade,
        coalesce(sp.rating, 0)::float8 as rating,
        coalesce(sp.review_count, 0)::int as "reviewCount",
        sp.country,
        sp.city,
        coalesce(svc.service_count, 0)::int as "serviceCount",
        coalesce(st.staff_count, 0)::int as "staffCount",
        coalesce(gi.gallery_item_count, 0)::int as "galleryItemCount",
        coalesce(pol.policy_count, 0)::int as "policyCount",
        coalesce(cert.certification_count, 0)::int as "certificationCount",
        coalesce(com.comment_count, 0)::int as "commentCount",
        coalesce(req.request_count, 0)::int as "requestCount",
        coalesce(bk.booking_count, 0)::int as "bookingCount",
        coalesce(sp.featured_score, 0)::float8 as "featuredScore",
        sp.create_date::text as "createDate",
        sp.last_modified_date::text as "lastModifiedDate",
        count(*) over() as total_count
      from category.service_providers sp
      join category.provider_types pt on pt.id = sp.provider_type_id
      left join category.service_provider_grades g on g.id = sp.grade_id
      left join lateral (
        select count(*)::int service_count
        from category.provider_services ps
        where ps.service_provider_id = sp.id
      ) svc on true
      left join lateral (
        select count(*)::int staff_count
        from category.provider_staffs psf
        where psf.service_provider_id = sp.id
      ) st on true
      left join lateral (
        select count(*)::int gallery_item_count
        from category.provider_gallery_items pgi
        where pgi.service_provider_id = sp.id
      ) gi on true
      left join lateral (
        select count(*)::int policy_count
        from category.provider_policies pp
        where pp.service_provider_id = sp.id
      ) pol on true
      left join lateral (
        select count(*)::int certification_count
        from category.provider_certifications pc
        where pc.service_provider_id = sp.id
      ) cert on true
      left join lateral (
        select count(*)::int comment_count
        from category.service_provider_comments c
        where c.service_provider_id = sp.id
      ) com on true
      left join lateral (
        select count(*)::int request_count
        from category.service_provider_requests r
        where r.service_provider_id = sp.id
      ) req on true
      left join lateral (
        select count(*)::int booking_count
        from booking.bookings b
        where b.provider_id = sp.id
      ) bk on true
      ${whereSql}
      order by ${orderSql}
      limit ${pageSize} offset ${offset}
    `;

    const totalCount = rows[0] ? asNumber(rows[0].total_count) : 0;
    const items = rows.map(({ total_count: _totalCount, ...row }) => row);

    return ok({
      items,
      pageNumber,
      pageSize,
      totalCount,
      totalPages: Math.ceil(totalCount / pageSize),
      hasPreviousPage: pageNumber > 1,
      hasNextPage: pageNumber * pageSize < totalCount,
    } as PaginatedResult<AdminServiceProviderListItem>);
  } catch (error) {
    console.error("getAdminServiceProviders failed", error);
    return fail("Could not load service providers.");
  }
}

type ProviderRow = {
  id: string;
  name: unknown;
  description: unknown;
  detail: unknown;
  street: unknown;
  isActive: boolean;
  providerTypeId: string;
  providerTypeName: string;
  city: string;
  country: string;
  zipCode: string | null;
  email: string;
  phoneNumberCountryCode: string;
  phoneNumber: string;
  gradeId: number | null;
  latitude: number | string | null;
  longitude: number | string | null;
  rating: number | string | null;
  reviewCount: number | null;
  accredited: boolean | null;
  responseTime: string | null;
  establishedYear: number | null;
  totalPatients: string | null;
  successRate: string | null;
  languages: string[] | null;
  isSponsored: boolean | null;
  sponsoredTag: string | null;
  specialties: string[] | null;
  featuredScore: number | string | null;
  internationalPriceMultiplier: number | string | null;
  imageUrl: string | null;
  timezoneId: string;
  createDate: string;
  lastModifiedDate: string | null;
};

export async function getAdminServiceProviderById(
  locale: string,
  id: string,
): Promise<ApiReturnType<AdminServiceProviderDetails>> {
  try {
    const rows = await sql<ProviderRow[]>`
      select
        sp.id::text,
        ${safeJsonObject(sql`sp.name_translations`)} as name,
        ${safeJsonObject(sql`sp.description_translations`)} as description,
        case when sp.detail_translations is not null then ${safeJsonObject(sql`sp.detail_translations`)} else null end as detail,
        case when sp.street_translations is not null then ${safeJsonObject(sql`sp.street_translations`)} else null end as street,
        sp.is_active as "isActive",
        sp.provider_type_id::text as "providerTypeId",
        ${translated(sql`pt.name_translations`, locale)} as "providerTypeName",
        sp.city,
        sp.country,
        sp.zip_code as "zipCode",
        sp.email,
        sp.phone_number_country_code as "phoneNumberCountryCode",
        sp.phone_number as "phoneNumber",
        sp.grade_id as "gradeId",
        sp.latitude,
        sp.longitude,
        coalesce(sp.rating, 0)::float8 as rating,
        coalesce(sp.review_count, 0)::int as "reviewCount",
        coalesce(sp.accredited, false) as accredited,
        sp.response_time as "responseTime",
        sp.established_year as "establishedYear",
        sp.total_patients as "totalPatients",
        sp.success_rate as "successRate",
        coalesce((select array_agg(pl.language order by pl.language) from category.provider_languages pl where pl.service_provider_id = sp.id), sp.languages, array[]::text[]) as languages,
        coalesce(sp.is_sponsored, false) as "isSponsored",
        sp.sponsored_tag as "sponsoredTag",
        coalesce(sp.specialties, array[]::text[]) as specialties,
        coalesce(sp.featured_score, 0)::float8 as "featuredScore",
        sp.international_price_multiplier::float8 as "internationalPriceMultiplier",
        sp.image_url as "imageUrl",
        sp.timezone_id as "timezoneId",
        sp.create_date::text as "createDate",
        sp.last_modified_date::text as "lastModifiedDate"
      from category.service_providers sp
      join category.provider_types pt on pt.id = sp.provider_type_id
      where sp.id = ${id}
      limit 1
    `;

    const provider = rows[0];
    if (!provider) return fail("Service provider not found.", 404);

    const [
      attributes,
      galleryItems,
      policies,
      certifications,
      services,
      staff,
      comments,
      requests,
      bookings,
      bookingDrafts,
      recommendations,
    ] = await Promise.all([
      getProviderAttributes(locale, id),
      getProviderGalleryItems(id),
      getProviderPolicies(id),
      getProviderCertifications(id),
      getProviderServices(locale, id),
      getProviderStaff(locale, id),
      getProviderComments(locale, id),
      getProviderRequests(id),
      getProviderBookings(locale, id),
      getProviderBookingDrafts(locale, id),
      getProviderRecommendations(locale, id),
    ]);

    const latitude = asNullableNumber(provider.latitude);
    const longitude = asNullableNumber(provider.longitude);

    return ok({
      ...provider,
      name: normalizeTranslations(provider.name),
      description: normalizeTranslations(provider.description),
      detail: provider.detail ? normalizeTranslations(provider.detail) : null,
      street: provider.street ? normalizeTranslations(provider.street) : null,
      latitude,
      longitude,
      coordinates:
        latitude !== null && longitude !== null
          ? { latitude, longitude }
          : null,
      rating: asNumber(provider.rating),
      featuredScore: asNumber(provider.featuredScore),
      internationalPriceMultiplier: asNullableNumber(provider.internationalPriceMultiplier),
      languages: normalizeStringArray(provider.languages),
      specialties: normalizeStringArray(provider.specialties),
      attributes,
      galleryItems,
      policies,
      certifications,
      services,
      staff,
      comments,
      requests,
      bookings,
      bookingDrafts,
      recommendations,
    });
  } catch (error) {
    console.error("getAdminServiceProviderById failed", error);
    return fail("Could not load service provider details.");
  }
}

async function getProviderAttributes(
  locale: string,
  serviceProviderId: string,
): Promise<AdminProviderAttribute[]> {
  const rows = await sql<AdminProviderAttribute[]>`
    select
      pa.id::text,
      pa.attribute_definition_id::text as "attributeDefinitionId",
      ${translated(sql`pad.name_translations`, locale)} as "attributeName",
      pad.attribute_type_id as "attributeTypeId",
      pad.is_required as "isRequired",
      pad.validation_rules as "validationRules",
      ${safeJsonObject(sql`pa.value_translations`)} as value
    from category.provider_attributes pa
    join category.provider_attribute_definitions pad on pad.id = pa.attribute_definition_id
    where pa.service_provider_id = ${serviceProviderId}
    order by "attributeName"
  `;
  return rows.map((row) => ({
    ...row,
    value: normalizeTranslations(row.value),
  }));
}

async function getProviderGalleryItems(
  serviceProviderId: string,
): Promise<AdminProviderGalleryItem[]> {
  const rows = await sql<AdminProviderGalleryItem[]>`
    select
      id::text,
      ${safeJsonObject(sql`title_translations`)} as title,
      ${safeJsonObject(sql`description_translations`)} as description,
      url,
      media_type as "mediaType",
      display_order as "displayOrder"
    from category.provider_gallery_items
    where service_provider_id = ${serviceProviderId}
    order by display_order, create_date
  `;
  return rows.map((row) => ({
    ...row,
    title: normalizeTranslations(row.title),
    description: normalizeTranslations(row.description),
  }));
}

async function getProviderPolicies(
  serviceProviderId: string,
): Promise<AdminProviderPolicy[]> {
  const rows = await sql<AdminProviderPolicy[]>`
    select
      pp.id::text,
      pp.provider_policy_type_id::text as "policyTypeId",
      ppt.code as "policyTypeCode",
      ${safeJsonObject(sql`pp.type_translations`)} as type,
      ${safeJsonObject(sql`pp.description_translations`)} as description,
      pp.create_date::text as "createDate",
      pp.last_modified_date::text as "lastModifiedDate"
    from category.provider_policies pp
    left join category.provider_policy_types ppt on ppt.id = pp.provider_policy_type_id
    where pp.service_provider_id = ${serviceProviderId}
    order by pp.create_date desc
  `;
  return rows.map((row) => ({
    ...row,
    type: normalizeTranslations(row.type),
    description: normalizeTranslations(row.description),
  }));
}

async function getProviderCertifications(
  serviceProviderId: string,
): Promise<AdminProviderCertification[]> {
  return sql<AdminProviderCertification[]>`
    select
      pc.id::text,
      pc.name,
      coalesce(pc.is_verified, false) as "isVerified",
      nullif(pc.image_url, '') as "imageUrl",
      nullif(pc.secondary_image_url, '') as "secondaryImageUrl"
    from category.provider_certifications pc
    where pc.service_provider_id = ${serviceProviderId}
    order by pc.name
  `;
}

async function getProviderServices(
  locale: string,
  serviceProviderId: string,
): Promise<AdminProviderService[]> {
  const rows = await sql<
    (Omit<
      AdminProviderService,
      "addonIds" | "galleryItems" | "displayName" | "description" | "tags"
    > & {
      displayName: unknown;
      description: unknown;
      tags: string[] | null;
      addonIds: string[] | null;
      galleryItems: unknown;
    })[]
  >`
    select
      ps.id::text,
      ps.service_definition_id::text as "serviceDefinitionId",
      ${translated(sql`sd.name_translations`, locale)} as "serviceDefinitionName",
      sd.category_id::text as "categoryId",
      ${translated(sql`c.name_translations`, locale)} as "categoryName",
      ${safeJsonObject(sql`ps.display_name_translations`)} as "displayName",
      ${safeJsonObject(sql`ps.description_translations`)} as description,
      ps.is_active as "isActive",
      ps.currency,
      ps.value::float8,
      ps.duration_minutes as "durationMinutes",
      coalesce(ps.rating, 0)::float8 as rating,
      coalesce(ps.review_count, 0)::int as "reviewCount",
      ps.recovery,
      ps.image_url as "imageUrl",
      coalesce(ps.is_popular, false) as "isPopular",
      ps.anesthesia,
      ps.stay_required as "stayRequired",
      ps.success_rate as "successRate",
      ps.satisfaction,
      coalesce(ps.trending_score, 0)::float8 as "trendingScore",
      ps.growth,
      coalesce(ps.tags, array[]::text[]) as tags,
      ps.slot_interval_minutes as "slotIntervalMinutes",
      coalesce((select array_agg(psa.addon_id order by psa.addon_id) from category.provider_service_addons psa where psa.provider_service_id = ps.id), array[]::text[]) as "addonIds",
      coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', psgi.id::text,
          'title', case when jsonb_typeof(psgi.title_translations) = 'object' then psgi.title_translations else '{}'::jsonb end,
          'description', case when jsonb_typeof(psgi.description_translations) = 'object' then psgi.description_translations else '{}'::jsonb end,
          'url', psgi.url,
          'mediaType', psgi.media_type,
          'displayOrder', psgi.display_order
        ) order by psgi.display_order, psgi.create_date)
        from category.provider_service_gallery_items psgi
        where psgi.provider_service_id = ps.id
      ), '[]'::jsonb) as "galleryItems"
    from category.provider_services ps
    join category.service_definitions sd on sd.id = ps.service_definition_id
    left join category.categories c on c.id = sd.category_id
    where ps.service_provider_id = ${serviceProviderId}
    order by ps.is_active desc, ${translated(sql`ps.display_name_translations`, locale)}
  `;

  return rows.map((row) => ({
    ...row,
    displayName: normalizeTranslations(row.displayName),
    description: normalizeTranslations(row.description),
    tags: normalizeStringArray(row.tags),
    addonIds: normalizeStringArray(row.addonIds),
    galleryItems: Array.isArray(row.galleryItems)
      ? row.galleryItems.map((item: any) => ({
          ...item,
          title: normalizeTranslations(item.title),
          description: normalizeTranslations(item.description),
        }))
      : [],
  }));
}

async function getProviderStaff(
  locale: string,
  serviceProviderId: string,
): Promise<AdminProviderStaff[]> {
  const rows = await sql<(AdminProviderStaff & { notes: unknown })[]>`
    select
      psf.id::text,
      psf.staff_id::text as "staffId",
      ${translated(sql`s.name_translations`, locale)} as "staffName",
      nullif(${translated(sql`s.title_translations`, locale)}, '') as "staffTitle",
      s.profile_image_url as "profileImageUrl",
      ${safeJsonObject(sql`psf.notes_translations`)} as notes,
      psf.is_active as "isActive"
    from category.provider_staffs psf
    join category.staff s on s.id = psf.staff_id
    where psf.service_provider_id = ${serviceProviderId}
    order by psf.is_active desc, "staffName"
  `;
  return rows.map((row) => ({
    ...row,
    notes: normalizeTranslations(row.notes),
  }));
}


function normalizeAdminCommentReplies(value: unknown): AdminProviderCommentReply[] {
  if (!value) return [];
  let source: unknown = value;
  if (typeof value === "string") {
    try {
      source = JSON.parse(value);
    } catch {
      source = [];
    }
  }
  if (!Array.isArray(source)) return [];
  return source
    .map((item) => {
      const row = item as Record<string, unknown>;
      return {
        id: String(row.id || ""),
        reviewId: String(row.reviewId || ""),
        authorName: String(row.authorName || "LSevin"),
        authorRole: row.authorRole === "admin" ? "admin" : "customer",
        replyText: String(row.replyText || ""),
        isPublic: Boolean(row.isPublic),
        isVerified: Boolean(row.isVerified),
        moderationStatus: row.moderationStatus === "approved" || row.moderationStatus === "rejected" ? row.moderationStatus : "pending",
        createdByAdmin: Boolean(row.createdByAdmin),
        createDate: String(row.createDate || ""),
        lastModifiedDate: row.lastModifiedDate ? String(row.lastModifiedDate) : null,
      } satisfies AdminProviderCommentReply;
    })
    .filter((item) => item.id && item.replyText);
}

async function getProviderComments(
  locale: string,
  serviceProviderId: string,
): Promise<AdminProviderComment[]> {
  const rows = await sql<(Omit<AdminProviderComment, "replies"> & { replies: unknown })[]>`
    select
      c.id::text,
      c.customer_id::text as "customerId",
      c.customer_name as "customerName",
      c.comment_text as "commentText",
      c.rating,
      c.is_public as "isPublic",
      coalesce(c.is_verified, false) as "isVerified",
      coalesce(c.helpful_count, 0)::int as "helpfulCount",
      coalesce(c.not_helpful_count, 0)::int as "notHelpfulCount",
      coalesce(c.pros, array[]::text[]) as pros,
      coalesce(c.cons, array[]::text[]) as cons,
      c.country,
      c.treatment,
      coalesce((select array_agg(ri.image_url order by ri.id) from category.review_images ri where ri.review_id = c.id), array[]::varchar[])::text[] as images,
      c.create_date::text as "createDate",
      c.last_modified_date::text as "lastModifiedDate",
      c.provider_service_id::text as "providerServiceId",
      ${translated(sql`ps.display_name_translations`, locale)} as "providerServiceName",
      c.staff_id::text as "staffId",
      ${translated(sql`s.name_translations`, locale)} as "staffName",
      coalesce(c.review_target, case when c.staff_id is not null then 'specialist' when c.provider_service_id is not null then 'service' else 'provider' end)::text as "reviewTarget",
      coalesce(c.moderation_status, case when c.is_public then 'approved' else 'pending' end)::text as "moderationStatus",
      coalesce(c.created_by_admin, false) as "createdByAdmin",
      coalesce((
        select jsonb_agg(
          jsonb_build_object(
            'id', r.id::text,
            'reviewId', r.review_id::text,
            'authorName', r.author_name,
            'authorRole', r.author_role,
            'replyText', r.reply_text,
            'isPublic', r.is_public,
            'isVerified', coalesce(r.is_verified, false),
            'moderationStatus', coalesce(r.moderation_status, case when r.is_public then 'approved' else 'pending' end),
            'createdByAdmin', coalesce(r.created_by_admin, false),
            'createDate', r.create_date::text,
            'lastModifiedDate', r.last_modified_date::text
          )
          order by case coalesce(r.moderation_status, case when r.is_public then 'approved' else 'pending' end) when 'pending' then 0 when 'approved' then 1 else 2 end, r.create_date asc
        )
        from category.service_provider_comment_replies r
        where r.review_id = c.id
      ), '[]'::jsonb) as replies
    from category.service_provider_comments c
    left join category.provider_services ps on ps.id = c.provider_service_id
    left join category.staff s on s.id = c.staff_id
    where c.service_provider_id = ${serviceProviderId}
    order by case coalesce(c.moderation_status, case when c.is_public then 'approved' else 'pending' end) when 'pending' then 0 when 'approved' then 1 else 2 end, c.create_date desc
  `;

  return rows.map((row) => ({
    ...row,
    replies: normalizeAdminCommentReplies(row.replies),
  }));
}

async function getProviderRequests(
  serviceProviderId: string,
): Promise<AdminProviderRequest[]> {
  return sql<AdminProviderRequest[]>`
    select
      r.id::text,
      r.customer_id::text as "customerId",
      r.customer_email as "customerEmail",
      r.customer_full_name as "customerFullName",
      r.message,
      r.request_status_id as "requestStatusId",
      rs.name as status,
      r.create_date::text as "createDate",
      r.last_modified_date::text as "lastModifiedDate"
    from category.service_provider_requests r
    join category.service_provider_request_statuses rs on rs.id = r.request_status_id
    where r.service_provider_id = ${serviceProviderId}
    order by r.create_date desc
  `;
}

async function getProviderBookings(
  locale: string,
  serviceProviderId: string,
): Promise<AdminProviderBooking[]> {
  return sql<AdminProviderBooking[]>`
    select
      b.id::text,
      b.service_id::text as "serviceId",
      ${translated(sql`ps.display_name_translations`, locale)} as "serviceName",
      b.specialist_id::text as "specialistId",
      ${translated(sql`s.name_translations`, locale)} as "specialistName",
      b.user_id::text as "userId",
      b.selected_date::text as "selectedDate",
      b.selected_time_from::text as "selectedTimeFrom",
      b.selected_time_to::text as "selectedTimeTo",
      b.booking_status as "bookingStatus",
      b.payment_status as "paymentStatus",
      b.currency_code as "currencyCode",
      b.total_amount::float8 as "totalAmount",
      coalesce(b.paid_amount, 0)::float8 as "paidAmount",
      b.confirmation_code as "confirmationCode",
      b.create_date::text as "createDate"
    from booking.bookings b
    join category.provider_services ps on ps.id = b.service_id
    join category.staff s on s.id = b.specialist_id
    where b.provider_id = ${serviceProviderId}
    order by b.create_date desc
    limit 100
  `;
}

async function getProviderBookingDrafts(
  locale: string,
  serviceProviderId: string,
): Promise<AdminProviderDraft[]> {
  return sql<AdminProviderDraft[]>`
    select
      d.id::text,
      d.user_id::text as "userId",
      d.service_id::text as "serviceId",
      case when d.service_id is null then null else ${translated(sql`ps.display_name_translations`, locale)} end as "serviceName",
      d.specialist_id::text as "specialistId",
      case when d.specialist_id is null then null else ${translated(sql`s.name_translations`, locale)} end as "specialistName",
      d.selected_date::text as "selectedDate",
      d.current_step as "currentStep",
      d.status,
      d.currency,
      coalesce(d.total_amount, 0)::float8 as "totalAmount",
      d.updated_at::text as "updatedAt"
    from booking.booking_drafts d
    left join category.provider_services ps on ps.id = d.service_id
    left join category.staff s on s.id = d.specialist_id
    where d.provider_id = ${serviceProviderId}
    order by d.updated_at desc
    limit 100
  `;
}

async function getProviderRecommendations(
  locale: string,
  serviceProviderId: string,
): Promise<AdminProviderRecommendation[]> {
  return sql<AdminProviderRecommendation[]>`
    select
      pr.id::text,
      pr.source_provider_id::text as "sourceProviderId",
      pr.target_provider_id::text as "targetProviderId",
      ${translated(sql`tsp.name_translations`, locale)} as "targetProviderName",
      pr.type,
      pr.create_date::text as "createDate"
    from category.provider_recommendations pr
    join category.service_providers tsp on tsp.id = pr.target_provider_id
    where pr.source_provider_id = ${serviceProviderId}
    order by pr.create_date desc
  `;
}

function normalizeLookupPage(page?: number, pageSize?: number) {
  const normalizedPage =
    Number.isInteger(page) && Number(page) > 0 ? Number(page) : 1;
  const normalizedPageSize = Math.min(
    Math.max(
      Number.isInteger(pageSize) && Number(pageSize) > 0
        ? Number(pageSize)
        : 30,
      1,
    ),
    100,
  );

  return {
    page: normalizedPage,
    pageSize: normalizedPageSize,
    limit: normalizedPageSize + 1,
    offset: (normalizedPage - 1) * normalizedPageSize,
  };
}

function lookupPage<T extends AdminLookupOption>(
  rows: T[],
  page: number,
  pageSize: number,
): AdminLookupSearchResult {
  return {
    items: rows.slice(0, pageSize),
    hasMore: rows.length > pageSize,
    page,
    pageSize,
  };
}

export async function searchAdminProviderLookupOptions(
  params: SearchAdminLookupOptionsParams,
): Promise<ApiReturnType<AdminLookupSearchResult>> {
  const locale = params.locale || "fa-IR";
  const query = params.query?.trim() || "";
  const like = `%${query}%`;
  const hasQuery = query.length > 0;
  const { page, pageSize, limit, offset } = normalizeLookupPage(
    params.page,
    params.pageSize,
  );

  try {
    let rows: AdminLookupOption[] = [];

    if (params.type === "providerTypes") {
      const label = translated(sql`name_translations`, locale);
      rows = await sql<AdminLookupOption[]>`
        select id::text, ${label} as label
        from category.provider_types
        where is_active = true
          and ${hasQuery ? sql`${label} ilike ${like}` : sql`true`}
        order by label
        limit ${limit} offset ${offset}
      `;
    } else if (params.type === "grades") {
      rows = await sql<AdminLookupOption[]>`
        select id, name as label
        from category.service_provider_grades
        where ${hasQuery ? sql`name ilike ${like}` : sql`true`}
        order by id
        limit ${limit} offset ${offset}
      `;
    } else if (params.type === "countries") {
      const label = translated(sql`l.value_translations`, locale);
      rows = await sql<AdminLookupOption[]>`
        select l.id::text, l.code, ${label} as label, l.parent_id::text as "parentId"
        from category.locations l
        where l.location_type_id = 1
          and ${hasQuery ? sql`(${label} ilike ${like} or l.code ilike ${like})` : sql`true`}
        order by l.display_order nulls last, label
        limit ${limit} offset ${offset}
      `;
    } else if (params.type === "cities") {
      const label = translated(sql`l.value_translations`, locale);
      const countryLabel = translated(sql`matched_country.value_translations`, locale);
      const parentId = params.parentId?.trim();
      // The admin form thinks in country → city, so report the city's COUNTRY as its
      // parentId even when a province sits between them; l.parent_id would hand the UI
      // a province id it has no country selector for. The filter accepts either hop for
      // the same reason.
      rows = await sql<AdminLookupOption[]>`
        select l.id::text, l.code, ${label} as label, l_country.id::text as "parentId"
        from category.locations l
        ${countryOfLocation("l")} l_country on true
        where l.location_type_id = 2
          and ${
            parentId
              ? sql`l_country.id in (
              select matched_country.id
              from category.locations matched_country
              where matched_country.location_type_id = 1
                and (
                  matched_country.id::text = ${parentId}
                  or lower(matched_country.code) = lower(${parentId})
                  or lower(${countryLabel}) = lower(${parentId})
                )
            )`
              : sql`true`
          }
          and ${hasQuery ? sql`(${label} ilike ${like} or l.code ilike ${like})` : sql`true`}
        order by l.display_order nulls last, label
        limit ${limit} offset ${offset}
      `;
    } else if (params.type === "categories") {
      const label = translated(sql`c.name_translations`, locale);
      rows = await sql<AdminLookupOption[]>`
        select c.id::text, ${label} as label, c.parent_id::text as "parentId"
        from category.categories c
        where coalesce(c.is_active, true) = true
          and ${hasQuery ? sql`(${label} ilike ${like})` : sql`true`}
        order by c.display_order nulls last, label
        limit ${limit} offset ${offset}
      `;
    } else if (params.type === "serviceDefinitions") {
      const serviceLabel = translated(sql`sd.name_translations`, locale);
      const categoryLabel = translated(sql`c.name_translations`, locale);
      const categoryId = params.categoryId?.trim();
      rows = await sql<AdminLookupOption[]>`
        select
          sd.id::text,
          concat(${serviceLabel}, ' · ', coalesce(${categoryLabel}, '')) as label,
          sd.category_id::text as "parentId"
        from category.service_definitions sd
        left join category.categories c on c.id = sd.category_id
        where sd.is_active = true
          and ${categoryId ? sql`sd.category_id::text = ${categoryId}` : sql`true`}
          and ${hasQuery ? sql`(${serviceLabel} ilike ${like} or ${categoryLabel} ilike ${like})` : sql`true`}
        order by label
        limit ${limit} offset ${offset}
      `;
    } else if (params.type === "staff") {
      const staffLabel = translated(sql`s.name_translations`, locale);
      const staffTitle = translated(sql`s.title_translations`, locale);
      rows = await sql<AdminLookupOption[]>`
        select s.id::text, concat(${staffLabel}, case when nullif(${staffTitle}, '') is not null then concat(' · ', ${staffTitle}) else '' end) as label
        from category.staff s
        where s.is_active = true
          and ${hasQuery ? sql`(${staffLabel} ilike ${like} or ${staffTitle} ilike ${like} or coalesce(s.specialty, '') ilike ${like})` : sql`true`}
        order by label
        limit ${limit} offset ${offset}
      `;
    } else if (params.type === "providers") {
      const providerLabel = translated(sql`sp.name_translations`, locale);
      const excludeProviderId = params.excludeProviderId?.trim();
      rows = await sql<AdminLookupOption[]>`
        select sp.id::text, concat(${providerLabel}, ' · ', coalesce(sp.city, ''), case when coalesce(sp.country, '') <> '' then concat(', ', sp.country) else '' end) as label
        from category.service_providers sp
        where ${excludeProviderId ? sql`sp.id::text <> ${excludeProviderId}` : sql`true`}
          and ${hasQuery ? sql`(${providerLabel} ilike ${like} or coalesce(sp.email, '') ilike ${like} or coalesce(sp.city, '') ilike ${like} or coalesce(sp.country, '') ilike ${like})` : sql`true`}
        order by label
        limit ${limit} offset ${offset}
      `;
    } else if (params.type === "attributeDefinitions") {
      const label = translated(sql`pad.name_translations`, locale);
      const providerTypeId = params.providerTypeId?.trim();
      rows = await sql<
        AdminProviderLookupData["attributeDefinitions"][number][]
      >`
        select
          pad.id::text,
          ${label} as label,
          pad.provider_type_id::text as "providerTypeId",
          pad.attribute_type_id as "attributeTypeId",
          pad.is_required as "isRequired",
          pad.validation_rules as "validationRules"
        from category.provider_attribute_definitions pad
        where ${providerTypeId ? sql`pad.provider_type_id::text = ${providerTypeId}` : sql`true`}
          and ${hasQuery ? sql`${label} ilike ${like}` : sql`true`}
        order by label
        limit ${limit} offset ${offset}
      `;
    } else if (params.type === "requestStatuses") {
      rows = await sql<AdminLookupOption[]>`
        select id, name as label
        from category.service_provider_request_statuses
        where ${hasQuery ? sql`name ilike ${like}` : sql`true`}
        order by id
        limit ${limit} offset ${offset}
      `;
    } else if (params.type === "policyTypes") {
      const label = translated(sql`name_translations`, locale);
      rows = await sql<AdminLookupOption[]>`
        select id::text, code, ${label} as label
        from category.provider_policy_types
        where is_active = true
          and ${hasQuery ? sql`(${label} ilike ${like} or code ilike ${like})` : sql`true`}
        order by display_order, label
        limit ${limit} offset ${offset}
      `;
    } else if (params.type === "currencies") {
      rows = await sql<AdminLookupOption[]>`
        select symbol as id, symbol as code, concat(symbol, case when nullif(name, '') is not null then concat(' · ', name) else '' end) as label
        from category.currencies
        where ${hasQuery ? sql`(symbol ilike ${like} or name ilike ${like})` : sql`true`}
        order by symbol
        limit ${limit} offset ${offset}
      `;
    } else if (params.type === "addons") {
      rows = await sql<AdminLookupOption[]>`
        select id, concat(name, ' · ', source_type) as label
        from category.addons
        where is_active = true
          and ${hasQuery ? sql`(name ilike ${like} or description ilike ${like} or source_type ilike ${like} or addon_kind ilike ${like})` : sql`true`}
        order by source_type, name
        limit ${limit} offset ${offset}
      `;
    }

    return ok(lookupPage(rows, page, pageSize));
  } catch (error) {
    console.error("searchAdminProviderLookupOptions failed", error);
    return fail("Could not load lookup options.");
  }
}

export async function getAdminProviderLookupData(
  locale: string,
): Promise<ApiReturnType<AdminProviderLookupData>> {
  try {
    const [
      providerTypes,
      grades,
      countries,
      cities,
      categories,
      serviceDefinitions,
      staff,
      providers,
      attributeDefinitions,
      requestStatuses,
      policyTypes,
      currencies,
      addons,
    ] = await Promise.all([
      sql<AdminLookupOption[]>`
        select id::text, ${translated(sql`name_translations`, locale)} as label
        from category.provider_types
        where is_active = true
        order by label
      `,
      sql<AdminLookupOption[]>`
        select id, name as label
        from category.service_provider_grades
        order by id
      `,
      sql<AdminLookupOption[]>`
        select id::text, code, ${translated(sql`value_translations`, locale)} as label, parent_id::text as "parentId"
        from category.locations
        where location_type_id = 1
        order by display_order nulls last, label
        limit 75
      `,
      sql<AdminLookupOption[]>`
        select l.id::text, l.code, ${translated(sql`l.value_translations`, locale)} as label, l_country.id::text as "parentId"
        from category.locations l
        ${countryOfLocation("l")} l_country on true
        where l.location_type_id = 2
        order by l.display_order nulls last, label
        limit 50
      `,
      sql<AdminLookupOption[]>`
        select c.id::text, ${translated(sql`c.name_translations`, locale)} as label, c.parent_id::text as "parentId"
        from category.categories c
        where coalesce(c.is_active, true) = true
        order by c.display_order nulls last, label
        limit 100
      `,
      sql<AdminLookupOption[]>`
        select
          sd.id::text,
          concat(${translated(sql`sd.name_translations`, locale)}, ' · ', coalesce(${translated(sql`c.name_translations`, locale)}, '')) as label,
          sd.category_id::text as "parentId"
        from category.service_definitions sd
        left join category.categories c on c.id = sd.category_id
        where sd.is_active = true
        order by label
        limit 30
      `,
      sql<AdminLookupOption[]>`
        select id::text, ${translated(sql`name_translations`, locale)} as label
        from category.staff
        where is_active = true
        order by label
        limit 30
      `,
      sql<AdminLookupOption[]>`
        select id::text, ${translated(sql`name_translations`, locale)} as label
        from category.service_providers
        order by label
        limit 30
      `,
      sql<AdminProviderLookupData["attributeDefinitions"][number][]>`
        select
          pad.id::text,
          ${translated(sql`pad.name_translations`, locale)} as label,
          pad.provider_type_id::text as "providerTypeId",
          pad.attribute_type_id as "attributeTypeId",
          pad.is_required as "isRequired",
          pad.validation_rules as "validationRules"
        from category.provider_attribute_definitions pad
        order by label
        limit 50
      `,
      sql<AdminLookupOption[]>`
        select id, name as label
        from category.service_provider_request_statuses
        order by id
      `,
      sql<AdminLookupOption[]>`
        select id::text, code, ${translated(sql`name_translations`, locale)} as label
        from category.provider_policy_types
        where is_active = true
        order by display_order, label
        limit 50
      `,
      sql<AdminLookupOption[]>`
        select symbol as id, symbol as code, concat(symbol, case when nullif(name, '') is not null then concat(' · ', name) else '' end) as label
        from category.currencies
        order by symbol
        limit 50
      `,
      sql<AdminLookupOption[]>`
        select id, name as label
        from category.addons
        where is_active = true
        order by source_type, name
        limit 50
      `,
    ]);

    return ok({
      providerTypes,
      grades,
      countries,
      cities,
      categories,
      serviceDefinitions,
      staff,
      providers,
      attributeDefinitions,
      requestStatuses,
      policyTypes,
      currencies,
      addons,
    });
  } catch (error) {
    console.error("getAdminProviderLookupData failed", error);
    return fail("Could not load service provider lookup data.");
  }
}

export function revalidateAdminServiceProvider(serviceProviderId?: string) {
  revalidateTag(getServiceProviderGlobalTag());
  revalidateTag("admin-service-provider-lookups");
  if (serviceProviderId)
    revalidateTag(getServiceProviderIdTag(serviceProviderId));
}

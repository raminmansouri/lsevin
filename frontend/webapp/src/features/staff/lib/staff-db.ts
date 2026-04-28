import "server-only";

import sql from "@/config/database/db";
import type { BaseRequest } from "@/types/common";
import type { FilterParams } from "@/types/filter";
import type { ApiReturnType, PaginatedResult } from "@/types/network";

import { DAY_OF_WEEK_NAME_BY_NUMBER, DAY_OF_WEEK_NUMBER_BY_NAME } from "../types/constants";
import type {
  AvailabilityStatusOption,
  DayOfWeek,
  ServiceDefinitionOption,
  ServiceProviderOption,
  Staff,
  StaffDetails,
  StaffFormOptions,
  StaffMutationInput,
} from "../types";

type AnyRecord = Record<string, unknown>;

type QueryLike = typeof sql;

const FALLBACK_LOCALE = "en-US";

function success<T>(data: T): ApiReturnType<T> {
  return { data, error: undefined } as ApiReturnType<T>;
}

function failure<T>(error: unknown): ApiReturnType<T> {
  const detail = error instanceof Error ? error.message : "Unexpected database error.";
  return {
    data: undefined,
    error: {
      title: "Database error",
      detail,
      status: 500,
    },
  } as ApiReturnType<T>;
}

function normalizeLocale(request?: Partial<BaseRequest> | string): string {
  if (!request) return FALLBACK_LOCALE;
  if (typeof request === "string") return request || FALLBACK_LOCALE;
  return String((request as AnyRecord).locale || FALLBACK_LOCALE);
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function readFilter(params: FilterParams | undefined, keys: string[], fallback?: unknown) {
  const source = (params || {}) as AnyRecord;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") return source[key];
  }
  const nestedCandidates = [source.filter, source.filters, source.query] as AnyRecord[];
  for (const nested of nestedCandidates) {
    if (!nested || typeof nested !== "object") continue;
    for (const key of keys) {
      if (nested[key] !== undefined && nested[key] !== null && nested[key] !== "") return nested[key];
    }
  }
  return fallback;
}

function normalizeSearch(params?: FilterParams): string {
  return String(readFilter(params, ["search", "searchTerm", "q", "keyword", "term"], "") || "").trim();
}

function normalizePage(params?: FilterParams) {
  const rawPage = readFilter(params, ["page", "pageNumber", "pageIndex"], 1);
  const rawPageSize = readFilter(params, ["pageSize", "size", "take", "limit"], 20);
  const pageSize = Math.max(1, Math.min(100, asNumber(rawPageSize, 20)));
  const pageNumber = Math.max(1, asNumber(rawPage, 1));
  return { pageNumber, pageSize, offset: (pageNumber - 1) * pageSize };
}

function jsonOrEmpty(value: unknown) {
  return localizedJsonOrEmpty(value);
}

const STAFF_TRANSLATION_LOCALES = [
  "ar-SA",
  "de-DE",
  "en-US",
  "es-ES",
  "fa-IR",
  "fr-FR",
  "ku-KU",
  "tr-TR",
] as const;

const LOCALE_ALIASES: Record<string, string> = {
  ar: "ar-SA",
  "ar-sa": "ar-SA",
  de: "de-DE",
  "de-de": "de-DE",
  en: "en-US",
  "en-us": "en-US",
  es: "es-ES",
  "es-es": "es-ES",
  fa: "fa-IR",
  "fa-ir": "fa-IR",
  fr: "fr-FR",
  "fr-fr": "fr-FR",
  ku: "ku-KU",
  "ku-ku": "ku-KU",
  tr: "tr-TR",
  "tr-tr": "tr-TR",
};

function emptyLocalized() {
  return Object.fromEntries(STAFF_TRANSLATION_LOCALES.map((locale) => [locale, ""])) as Record<string, string>;
}

function normalizeLocaleKey(key: string): string {
  const normalized = key.trim().replace(/_/g, "-").toLowerCase();
  return LOCALE_ALIASES[normalized] || key.trim();
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function localizedJsonOrEmpty(value: unknown): Record<string, string> {
  const normalized: Record<string, string> = { ...emptyLocalized() };

  if (!isPlainObject(value)) return normalized;

  for (const [rawKey, item] of Object.entries(value)) {
    const key = normalizeLocaleKey(rawKey);
    if (!key) continue;
    normalized[key] = typeof item === "string" ? item : item == null ? "" : String(item);
  }

  return normalized;
}

function tr(columnExpression: string, locale: string) {
  const column = sql.unsafe(columnExpression);
  return sql`common.get_translation_t(
    case
      when jsonb_typeof(${column}) = 'object' then ${column}
      else '{}'::jsonb
    end,
    ${locale},
    ${FALLBACK_LOCALE}
  )`;
}

function uniqueText(values: string[] | undefined): string[] {
  return [...new Set((values || []).map((v) => String(v || "").trim()).filter(Boolean))];
}

function splitCsv(value?: string): string[] {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function dayNameToNumber(day: DayOfWeek): number {
  return DAY_OF_WEEK_NUMBER_BY_NAME[day as keyof typeof DAY_OF_WEEK_NUMBER_BY_NAME] ?? 1;
}

function dayNumberToName(value: number): DayOfWeek {
  return (DAY_OF_WEEK_NAME_BY_NUMBER[value as keyof typeof DAY_OF_WEEK_NAME_BY_NUMBER] || "Monday") as DayOfWeek;
}

function normalizePrimaryGallery(items: StaffMutationInput["galleryItems"]) {
  let primarySeen = false;
  return (items || []).map((item, index) => {
    const isPrimary = item.isPrimary && !primarySeen;
    if (isPrimary) primarySeen = true;
    return {
      ...item,
      isPrimary,
      displayOrder: item.displayOrder ?? index,
      mediaType: item.mediaType || "image",
    };
  });
}

export async function getStaffFormOptions(localeOrRequest?: Partial<BaseRequest> | string): Promise<StaffFormOptions> {
  const locale = normalizeLocale(localeOrRequest);

  const [serviceDefinitions, serviceProviders, availabilityStatuses] = await Promise.all([
    sql<ServiceDefinitionOption[]>`
      select
        sd.id::text as id,
        ${tr("sd.name_translations", locale)} as name,
        ${tr("c.name_translations", locale)} as "categoryName",
        sd.currency::text as currency,
        sd.value::float8 as value,
        sd.duration_minutes as "durationMinutes",
        sd.is_active as "isActive"
      from category.service_definitions sd
      join category.categories c on c.id = sd.category_id
      order by sd.is_active desc, name asc
      limit 500
    `,
    sql<ServiceProviderOption[]>`
      select
        sp.id::text as id,
        ${tr("sp.name_translations", locale)} as name,
        ${tr("pt.name_translations", locale)} as "providerTypeName",
        sp.country,
        sp.city,
        sp.is_active as "isActive"
      from category.service_providers sp
      left join category.provider_types pt on pt.id = sp.provider_type_id
      order by sp.is_active desc, name asc
      limit 500
    `,
    sql<AvailabilityStatusOption[]>`
      select id, name
      from category.staff_availability_statuses
      order by id asc
    `,
  ]);

  return { serviceDefinitions, serviceProviders, availabilityStatuses };
}

export async function getStaffRows(
  request: Partial<BaseRequest>,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<Staff>>> {
  try {
    const locale = normalizeLocale(request);
    const search = normalizeSearch(params);
    const like = `%${search}%`;
    const { pageNumber, pageSize, offset } = normalizePage(params);

    const rows = await sql<Staff[]>`
      select
        s.id::text as id,
        ${tr("s.name_translations", locale)} as name,
        ${tr("s.biography_translations", locale)} as biography,
        ${tr("s.title_translations", locale)} as title,
        s.profile_image_url as "profileImageUrl",
        s.is_active as "isActive",
        s.create_date::text as "createDate",
        s.last_modified_date::text as "lastModifiedDate",
        s.experience,
        s.patients,
        coalesce(s.rating, 0)::float8 as rating,
        s.specialty,
        coalesce(s.consultation_fee, 0)::float8 as "consultationFee",
        s.next_available_label as "nextAvailableLabel",
        coalesce(s.review_count, 0)::int as "reviewCount",
        s.experience_years as "experienceYears",
        s.success_rate as "successRate",
        coalesce(service_counts.service_count, 0)::int as "serviceCount",
        coalesce(provider_counts.provider_count, 0)::int as "providerCount",
        coalesce(booking_counts.booking_count, 0)::int as "bookingCount"
      from category.staff s
      left join lateral (
        select count(*) as service_count
        from category.staff_services ss
        where ss.staff_id = s.id
      ) service_counts on true
      left join lateral (
        select count(*) as provider_count
        from category.provider_staffs ps
        where ps.staff_id = s.id
      ) provider_counts on true
      left join lateral (
        select count(*) as booking_count
        from booking.bookings b
        where b.specialist_id = s.id
      ) booking_counts on true
      where
        ${search} = ''
        or ${tr("s.name_translations", locale)} ilike ${like}
        or ${tr("s.title_translations", locale)} ilike ${like}
        or coalesce(s.specialty, '') ilike ${like}
      order by s.create_date desc
      limit ${pageSize}
      offset ${offset}
    `;

    const countRows = await sql<{ count: number }[]>`
      select count(*)::int as count
      from category.staff s
      where
        ${search} = ''
        or ${tr("s.name_translations", locale)} ilike ${like}
        or ${tr("s.title_translations", locale)} ilike ${like}
        or coalesce(s.specialty, '') ilike ${like}
    `;

    const totalCount = Number(countRows[0]?.count || 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const result = {
      items: rows,
      totalCount,
      totalItems: totalCount,
      pageNumber,
      pageIndex: pageNumber,
      pageSize,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1,
    } as unknown as PaginatedResult<Staff>;

    return success(result);
  } catch (error) {
    return failure(error);
  }
}

export async function getStaffDetailsById(
  staffId: string,
  request?: Partial<BaseRequest>
): Promise<ApiReturnType<StaffDetails>> {
  try {
    const locale = normalizeLocale(request);

    const rows = await sql<any[]>`
      select
        s.id::text as id,
        s.name_translations as name,
        s.biography_translations as biography,
        s.title_translations as title,
        s.profile_image_url as "profileImageUrl",
        s.is_active as "isActive",
        s.create_date::text as "createDate",
        s.last_modified_date::text as "lastModifiedDate",
        s.experience,
        s.patients,
        coalesce(s.rating, 0)::float8 as rating,
        s.specialty,
        coalesce(s.consultation_fee, 0)::float8 as "consultationFee",
        s.next_available_label as "nextAvailableLabel",
        coalesce(s.review_count, 0)::int as "reviewCount",
        s.specialty_translations as "specialtyTranslations",
        s.experience_years as "experienceYears",
        s.success_rate as "successRate"
      from category.staff s
      where s.id = ${staffId}
      limit 1
    `;

    const staff = rows[0];
    if (!staff) {
      return {
        data: undefined,
        error: { title: "Not found", detail: "Staff member was not found.", status: 404 },
      } as ApiReturnType<StaffDetails>;
    }

    const [services, availabilities, providers, languages, specializations, education, certifications, credentials, achievements, galleryItems, beforeAfterItems, statsRows] = await Promise.all([
      sql<any[]>`
        select
          ss.id::text as id,
          ss.service_definition_id::text as "serviceDefinitionId",
          ${tr("sd.name_translations", locale)} as "serviceName",
          ${tr("sd.description_translations", locale)} as "serviceDescription",
          sd.value::float8 as price,
          sd.currency,
          sd.duration_minutes as "durationInMinutes",
          ss.is_active as "isActive",
          ss.notes_translations as notes,
          ss.create_date::text as "createDate",
          ss.last_modified_date::text as "lastModifiedDate"
        from category.staff_services ss
        join category.service_definitions sd on sd.id = ss.service_definition_id
        where ss.staff_id = ${staffId}
        order by ss.create_date desc
      `,
      sql<any[]>`
        select
          sa.id::text as id,
          sa.id::text as "availabilityId",
          sa.day_of_week as "dayOfWeekNumber",
          to_char(time '00:00' + sa.start_time, 'HH24:MI:SS') as "startTime",
          to_char(time '00:00' + sa.end_time, 'HH24:MI:SS') as "endTime",
          sa.is_recurring as "isRecurring",
          sa.specific_date::text as "specificDate",
          sa.availability_status_id as "availabilityStatusId",
          sas.name as "availabilityStatusName",
          sa.create_date::text as "createDate",
          sa.last_modified_date::text as "lastModifiedDate"
        from category.staff_availabilities sa
        join category.staff_availability_statuses sas on sas.id = sa.availability_status_id
        where sa.staff_id = ${staffId}
        order by sa.day_of_week asc, sa.start_time asc
      `,
      sql<any[]>`
        select
          ps.id::text as id,
          ps.service_provider_id::text as "serviceProviderId",
          ${tr("sp.name_translations", locale)} as "serviceProviderName",
          ${tr("pt.name_translations", locale)} as "providerTypeName",
          ps.notes_translations as notes,
          ps.is_active as "isActive",
          ps.create_date::text as "createDate",
          ps.last_modified_date::text as "lastModifiedDate"
        from category.provider_staffs ps
        join category.service_providers sp on sp.id = ps.service_provider_id
        left join category.provider_types pt on pt.id = sp.provider_type_id
        where ps.staff_id = ${staffId}
        order by ps.is_active desc, "serviceProviderName" asc
      `,
      sql<{ language: string }[]>`select language from category.staff_languages where staff_id = ${staffId} order by language asc`,
      sql<{ specialty: string }[]>`select specialty from category.staff_specializations where staff_id = ${staffId} order by specialty asc`,
      sql<any[]>`
        select id::text, degree, institution, year, image_url as "imageUrl", create_date::text as "createDate", last_modified_date::text as "lastModifiedDate"
        from category.staff_education
        where staff_id = ${staffId}
        order by year desc nulls last, create_date desc
      `,
      sql<any[]>`
        select id::text, name, issuer, is_verified as "isVerified", image_url as "imageUrl", create_date::text as "createDate", last_modified_date::text as "lastModifiedDate"
        from category.staff_certifications
        where staff_id = ${staffId}
        order by is_verified desc, name asc
      `,
      sql<any[]>`
        select id::text, credential, is_verified as "isVerified", image_url as "imageUrl"
        from category.staff_credentials
        where staff_id = ${staffId}
        order by is_verified desc, credential asc
      `,
      sql<any[]>`
        select id::text, icon, title, organization, display_order as "displayOrder", create_date::text as "createDate", last_modified_date::text as "lastModifiedDate"
        from category.staff_achievements
        where staff_id = ${staffId}
        order by display_order asc, create_date desc
      `,
      sql<any[]>`
        select
          id::text,
          title_translations as title,
          description_translations as description,
          url,
          media_type as "mediaType",
          display_order as "displayOrder",
          is_primary as "isPrimary",
          create_date::text as "createDate",
          last_modified_date::text as "lastModifiedDate"
        from category.staff_gallery_items
        where staff_id = ${staffId}
        order by display_order asc, create_date desc
      `,
      sql<any[]>`
        select
          id::text,
          before_image as "beforeImage",
          after_image as "afterImage",
          procedure,
          months,
          display_order as "displayOrder",
          create_date::text as "createDate",
          last_modified_date::text as "lastModifiedDate"
        from category.staff_before_after
        where staff_id = ${staffId}
        order by display_order asc, create_date desc
      `,
      sql<any[]>`
        select
          (select count(*)::int from booking.bookings where specialist_id = ${staffId}) as "bookingCount",
          (select count(*)::int from booking.booking_drafts where specialist_id = ${staffId}) as "draftBookingCount",
          (select count(*)::int from category.provider_staffs where staff_id = ${staffId}) as "providerCount",
          (select count(*)::int from category.provider_staffs where staff_id = ${staffId} and is_active) as "activeProviderCount",
          (select count(*)::int from category.staff_services where staff_id = ${staffId}) as "serviceCount",
          (select count(*)::int from category.staff_services where staff_id = ${staffId} and is_active) as "activeServiceCount",
          (select count(*)::int from category.staff_gallery_items where staff_id = ${staffId}) as "galleryCount",
          (select count(*)::int from category.staff_before_after where staff_id = ${staffId}) as "beforeAfterCount"
      `,
    ]);

    const data: StaffDetails = {
      ...staff,
      name: jsonOrEmpty(staff.name),
      biography: jsonOrEmpty(staff.biography),
      title: jsonOrEmpty(staff.title),
      specialtyTranslations: staff.specialtyTranslations || null,
      services: services.map((item) => ({ ...item, notes: jsonOrEmpty(item.notes) })),
      availabilities: availabilities.map((item) => ({
        ...item,
        dayOfWeek: dayNumberToName(Number(item.dayOfWeekNumber)),
      })),
      providerAssignments: providers.map((item) => ({ ...item, notes: jsonOrEmpty(item.notes) })),
      languages: languages.map((item) => item.language),
      specializations: specializations.map((item) => item.specialty),
      education,
      certifications,
      credentials,
      achievements,
      galleryItems: galleryItems.map((item) => ({
        ...item,
        title: jsonOrEmpty(item.title),
        description: jsonOrEmpty(item.description),
      })),
      beforeAfterItems,
      stats: statsRows[0] || {
        bookingCount: 0,
        draftBookingCount: 0,
        providerCount: 0,
        activeProviderCount: 0,
        serviceCount: 0,
        activeServiceCount: 0,
        galleryCount: 0,
        beforeAfterCount: 0,
      },
    };

    return success(data);
  } catch (error) {
    return failure(error);
  }
}

async function clearStaffChildren(db: QueryLike, staffId: string) {
  await db`delete from category.provider_staffs where staff_id = ${staffId}`;
  await db`delete from category.staff_services where staff_id = ${staffId}`;
  await db`delete from category.staff_availabilities where staff_id = ${staffId}`;
  await db`delete from category.staff_languages where staff_id = ${staffId}`;
  await db`delete from category.staff_specializations where staff_id = ${staffId}`;
  await db`delete from category.staff_education where staff_id = ${staffId}`;
  await db`delete from category.staff_certifications where staff_id = ${staffId}`;
  await db`delete from category.staff_credentials where staff_id = ${staffId}`;
  await db`delete from category.staff_achievements where staff_id = ${staffId}`;
  await db`delete from category.staff_gallery_items where staff_id = ${staffId}`;
  await db`delete from category.staff_before_after where staff_id = ${staffId}`;
}

async function insertStaffChildren(db: QueryLike, staffId: string, input: StaffMutationInput) {
  for (const provider of input.providerAssignments || []) {
    if (!provider.serviceProviderId) continue;
    await db`
      insert into category.provider_staffs (
        id, staff_id, service_provider_id, notes_translations, is_active, create_date, last_modified_date
      ) values (
        public.uuid_generate_v4(), ${staffId}, ${provider.serviceProviderId}, ${db.json(localizedJsonOrEmpty(provider.notes))}, ${provider.isActive ?? true}, now(), now()
      )
      on conflict do nothing
    `;
  }

  for (const service of input.services || []) {
    if (!service.serviceDefinitionId) continue;
    await db`
      insert into category.staff_services (
        id, staff_id, service_definition_id, is_active, notes_translations, create_date, last_modified_date
      ) values (
        public.uuid_generate_v4(), ${staffId}, ${service.serviceDefinitionId}, ${service.isActive ?? true}, ${db.json(localizedJsonOrEmpty(service.notes))}, now(), now()
      )
      on conflict do nothing
    `;
  }

  for (const availability of input.availabilities || []) {
    await db`
      insert into category.staff_availabilities (
        id, staff_id, day_of_week, is_recurring, availability_status_id, specific_date, start_time, end_time, create_date, last_modified_date
      ) values (
        public.uuid_generate_v4(),
        ${staffId},
        ${dayNameToNumber(availability.dayOfWeek)},
        ${availability.isRecurring ?? true},
        ${availability.availabilityStatusId},
        ${availability.isRecurring ? null : availability.specificDate || null},
        ${availability.startTime}::interval,
        ${availability.endTime}::interval,
        now(),
        now()
      )
    `;
  }

  for (const language of uniqueText(input.languages)) {
    await db`insert into category.staff_languages (staff_id, language, create_date) values (${staffId}, ${language}, now()) on conflict do nothing`;
  }

  for (const specialty of uniqueText(input.specializations)) {
    await db`insert into category.staff_specializations (staff_id, specialty, create_date) values (${staffId}, ${specialty}, now()) on conflict do nothing`;
  }

  for (const item of input.education || []) {
    await db`
      insert into category.staff_education (id, staff_id, degree, institution, year, image_url, create_date, last_modified_date)
      values (public.uuid_generate_v4(), ${staffId}, ${item.degree}, ${item.institution}, ${item.year || null}, ${item.imageUrl || null}, now(), now())
    `;
  }

  for (const item of input.certifications || []) {
    await db`
      insert into category.staff_certifications (id, staff_id, name, issuer, is_verified, image_url, create_date, last_modified_date)
      values (public.uuid_generate_v4(), ${staffId}, ${item.name}, ${item.issuer || null}, ${item.isVerified ?? false}, ${item.imageUrl || null}, now(), now())
    `;
  }

  for (const item of input.credentials || []) {
    await db`
      insert into category.staff_credentials (id, staff_id, credential, is_verified, image_url)
      values (public.uuid_generate_v4(), ${staffId}, ${item.credential}, ${item.isVerified ?? false}, ${item.imageUrl || null})
    `;
  }
  for (const item of input.achievements || []) {
    await db`
      insert into category.staff_achievements (id, staff_id, icon, title, organization, display_order, create_date, last_modified_date)
      values (public.uuid_generate_v4(), ${staffId}, ${item.icon || null}, ${item.title}, ${item.organization || null}, ${item.displayOrder || 0}, now(), now())
    `;
  }

  const bulkGalleryIds = splitCsv(input.galleryBulkMediaIds);
  const galleryFromBulk = bulkGalleryIds.map((id, index) => ({
    title: emptyLocalized(),
    description: emptyLocalized(),
    url: id,
    mediaType: "image",
    displayOrder: (input.galleryItems?.length || 0) + index,
    isPrimary: false,
  }));

  const galleryItems = normalizePrimaryGallery([...(input.galleryItems || []), ...galleryFromBulk]);
  for (const item of galleryItems) {
    await db`
      insert into category.staff_gallery_items (
        id, staff_id, title_translations, description_translations, url, media_type, display_order, is_primary, create_date, last_modified_date
      ) values (
        public.uuid_generate_v4(),
        ${staffId},
        ${db.json(localizedJsonOrEmpty(item.title))},
        ${db.json(localizedJsonOrEmpty(item.description))},
        ${item.url},
        ${item.mediaType || "image"},
        ${item.displayOrder || 0},
        ${item.isPrimary ?? false},
        now(),
        now()
      )
    `;
  }

  for (const item of input.beforeAfterItems || []) {
    await db`
      insert into category.staff_before_after (
        id, staff_id, before_image, after_image, procedure, months, display_order, create_date, last_modified_date
      ) values (
        public.uuid_generate_v4(), ${staffId}, ${item.beforeImage}, ${item.afterImage}, ${item.procedure || null}, ${item.months || null}, ${item.displayOrder || 0}, now(), now()
      )
    `;
  }
}

export async function createStaff(input: StaffMutationInput): Promise<string> {
  return sql.begin(async (tx) => {
    const rows = await tx<{ id: string }[]>`
      insert into category.staff (
        id,
        name_translations,
        biography_translations,
        title_translations,
        profile_image_url,
        is_active,
        experience,
        patients,
        rating,
        specialty,
        consultation_fee,
        next_available_label,
        review_count,
        specialty_translations,
        experience_years,
        success_rate,
        create_date,
        last_modified_date
      ) values (
        public.uuid_generate_v4(),
        ${tx.json(localizedJsonOrEmpty(input.name))},
        ${tx.json(localizedJsonOrEmpty(input.biography))},
        ${tx.json(localizedJsonOrEmpty(input.title))},
        ${input.profileImageUrl || null},
        ${input.isActive ?? true},
        ${input.experience || null},
        ${input.patients || null},
        ${input.rating || 0},
        ${input.specialty || null},
        ${input.consultationFee || 0},
        ${input.nextAvailableLabel || null},
        ${input.reviewCount || 0},
        ${tx.json(localizedJsonOrEmpty(input.specialtyTranslations))},
        ${input.experienceYears || null},
        ${input.successRate || null},
        now(),
        now()
      )
      returning id::text
    `;

    const staffId = rows[0]!.id;
    await insertStaffChildren(tx, staffId, input);
    return staffId;
  });
}

export async function updateStaff(input: StaffMutationInput & { staffId: string }): Promise<string> {
  return sql.begin(async (tx) => {
    await tx`
      update category.staff
      set
        name_translations = ${tx.json(localizedJsonOrEmpty(input.name))},
        biography_translations = ${tx.json(localizedJsonOrEmpty(input.biography))},
        title_translations = ${tx.json(localizedJsonOrEmpty(input.title))},
        profile_image_url = ${input.profileImageUrl || null},
        is_active = ${input.isActive ?? true},
        experience = ${input.experience || null},
        patients = ${input.patients || null},
        rating = ${input.rating || 0},
        specialty = ${input.specialty || null},
        consultation_fee = ${input.consultationFee || 0},
        next_available_label = ${input.nextAvailableLabel || null},
        review_count = ${input.reviewCount || 0},
        specialty_translations = ${tx.json(localizedJsonOrEmpty(input.specialtyTranslations))},
        experience_years = ${input.experienceYears || null},
        success_rate = ${input.successRate || null},
        last_modified_date = now()
      where id = ${input.staffId}
    `;

    await clearStaffChildren(tx, input.staffId);
    await insertStaffChildren(tx, input.staffId, input);
    return input.staffId;
  });
}

export async function setStaffActivation(staffId: string, isActive: boolean): Promise<boolean> {
  const rows = await sql<{ id: string }[]>`
    update category.staff
    set is_active = ${isActive}, last_modified_date = now()
    where id = ${staffId}
    returning id::text
  `;
  return rows.length > 0;
}

export async function deleteStaffOrDeactivate(staffId: string): Promise<"deleted" | "deactivated"> {
  return sql.begin(async (tx) => {
    const rows = await tx<{ booking_count: number; draft_count: number }[]>`
      select
        (select count(*)::int from booking.bookings where specialist_id = ${staffId}) as booking_count,
        (select count(*)::int from booking.booking_drafts where specialist_id = ${staffId}) as draft_count
    `;

    const hasBookingReferences = Number(rows[0]?.booking_count || 0) + Number(rows[0]?.draft_count || 0) > 0;

    if (hasBookingReferences) {
      await tx`update category.staff set is_active = false, last_modified_date = now() where id = ${staffId}`;
      return "deactivated" as const;
    }

    await clearStaffChildren(tx, staffId);
    await tx`delete from category.staff where id = ${staffId}`;
    return "deleted" as const;
  });
}

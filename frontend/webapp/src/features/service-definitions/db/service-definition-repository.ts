import "server-only";

import sql from "@/config/database/db";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import {
  ServiceAttributeDefinition,
  ServiceDefinition,
  ServiceDefinitionDetails,
  ServiceDefinitionOptionWithAllLocales,
  ServiceDefinitionUploadRequirement,
  ServiceDefinitionUsageSummary,
  ServiceDefinitionWithAllLocales,
  ServiceRequirement,
} from "../types/service-definition";

type JsonObject = Record<string, unknown>;

type Problem = {
  title: string;
  status: number;
  detail: string;
};

type LocalizedInputLike = {
  translations?: Record<string, string>;
} | Record<string, string> | null | undefined;

type ServiceDefinitionMutationInput = {
  serviceDefinitionId?: string;
  name: LocalizedInputLike;
  description: LocalizedInputLike;
  categoryId: string;
  durationMinutes: number;
  pricingModel: string;
  isActive: boolean;
  currency: string;
  value: number;
};

type AttributeMutationInput = {
  serviceDefinitionId: string;
  attributeDefinitionId?: string;
  name: LocalizedInputLike;
  description: LocalizedInputLike;
  attributeType: string | number;
  isRequired: boolean;
  affectsPricing: boolean;
  displayOrder?: number;
  options?: Array<{
    displayName: LocalizedInputLike;
    value: LocalizedInputLike;
    additionalPrice?: number;
  }>;
};

type RequirementMutationInput = {
  serviceDefinitionId: string;
  requirementIndex?: number;
  description: LocalizedInputLike;
  isMandatory: boolean;
};

type UploadRequirementMutationInput = {
  serviceDefinitionId: string;
  requirementId?: string;
  title: LocalizedInputLike;
  description: LocalizedInputLike;
  isRequired: boolean;
  maxFileSizeBytes: number;
  allowedExtensions: string[];
  allowedMimeTypes: string[];
  maxFiles: number;
  displayOrder: number;
  exampleFileUrl?: string | null;
};

const DEFAULT_PAGE_SIZE = 20;
const DEFAULT_LOCALE = "en";

function toProblem(error: unknown, fallback = "Database operation failed."): Problem {
  const message = error instanceof Error ? error.message : fallback;
  return {
    title: fallback,
    status: 500,
    detail: message,
  };
}

export function ok<T>(data: T): ApiReturnType<T> {
  return { data } as ApiReturnType<T>;
}

export function fail<T>(error: unknown, fallback?: string): ApiReturnType<T> {
  return { error: toProblem(error, fallback) } as ApiReturnType<T>;
}

export function actionFail(error: unknown, fallback?: string) {
  return { data: undefined, error: toProblem(error, fallback) };
}

function normalizeLocale(locale?: string | null) {
  return (locale || DEFAULT_LOCALE).replace("_", "-");
}

function normalizeTranslations(value: LocalizedInputLike): JsonObject {
  if (!value) return {};
  const maybeTranslations = (value as { translations?: Record<string, string> }).translations;
  const source = maybeTranslations && typeof maybeTranslations === "object" ? maybeTranslations : value;

  return Object.fromEntries(
    Object.entries(source as Record<string, unknown>)
      .filter(([, translation]) => typeof translation === "string" && translation.trim().length > 0)
      .map(([locale, translation]) => [locale, String(translation).trim()])
  );
}

function localizedResponse(value: unknown) {
  return {
    translations:
      value && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, string>)
        : {},
  };
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function parsePageParams(params?: FilterParams) {
  const raw = (params || {}) as Record<string, unknown>;
  const pageNumber = Math.max(
    1,
    asNumber(raw.PageNumber ?? raw.pageNumber ?? raw.page ?? raw.Page, 1)
  );
  const pageSize = Math.min(
    100,
    Math.max(1, asNumber(raw.PageSize ?? raw.pageSize ?? raw.size ?? raw.limit, DEFAULT_PAGE_SIZE))
  );

  const search = String(
    raw.Search ?? raw.search ?? raw.q ?? raw.Query ?? raw.query ?? ""
  ).trim();

  const categoryId = String(raw.CategoryId ?? raw.categoryId ?? "").trim();
  const status = String(raw.Status ?? raw.status ?? "").trim();

  return {
    pageNumber,
    pageSize,
    offset: (pageNumber - 1) * pageSize,
    search,
    categoryId,
    status,
  };
}

function toPaginatedResult<T>(items: T[], totalCount: number, pageNumber: number, pageSize: number): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return {
    items,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: pageNumber < totalPages,
    hasPreviousPage: pageNumber > 1,
  } as PaginatedResult<T>;
}

function mapListRow(row: Record<string, unknown>): ServiceDefinition {
  return {
    id: String(row.id),
    name: String(row.name ?? ""),
    description: String(row.description ?? ""),
    categoryId: String(row.category_id ?? ""),
    categoryName: String(row.category_name ?? ""),
    durationMinutes: asNumber(row.duration_minutes),
    basePrice: asNumber(row.base_price ?? row.value),
    currency: String(row.currency ?? ""),
    pricingModel: String(row.pricing_model ?? ""),
    isActive: asBoolean(row.is_active),
    attributeCount: asNumber(row.attribute_count),
    requirementCount: asNumber(row.requirement_count),
    uploadRequirementCount: asNumber(row.upload_requirement_count),
    providerServiceCount: asNumber(row.provider_service_count),
    staffServiceCount: asNumber(row.staff_service_count),
  };
}

function mapAllLocaleRow(row: Record<string, unknown>): ServiceDefinitionWithAllLocales {
  return {
    id: String(row.id),
    name: localizedResponse(row.name_translations),
    description: localizedResponse(row.description_translations),
    categoryId: String(row.category_id ?? ""),
    categoryName: String(row.category_name ?? ""),
    durationMinutes: asNumber(row.duration_minutes),
    basePrice: asNumber(row.base_price ?? row.value),
    currency: String(row.currency ?? ""),
    pricingModel: String(row.pricing_model ?? ""),
    isActive: asBoolean(row.is_active),
  };
}

function mapRequirement(row: Record<string, unknown>): ServiceRequirement {
  return {
    id: asNumber(row.id),
    description: localizedResponse(row.description_translations),
    isMandatory: asBoolean(row.is_mandatory),
  };
}

function mapUploadRequirement(row: Record<string, unknown>): ServiceDefinitionUploadRequirement {
  return {
    id: String(row.id),
    title: localizedResponse(row.title_translations),
    description: localizedResponse(row.description_translations),
    isRequired: asBoolean(row.is_required),
    maxFileSizeBytes: asNumber(row.max_file_size_bytes),
    allowedExtensions: Array.isArray(row.allowed_extensions) ? (row.allowed_extensions as string[]) : [],
    allowedMimeTypes: Array.isArray(row.allowed_mime_types) ? (row.allowed_mime_types as string[]) : [],
    maxFiles: asNumber(row.max_files, 1),
    displayOrder: asNumber(row.display_order),
    exampleFileUrl: row.example_file_url ? String(row.example_file_url) : null,
  };
}

function mapUsageRow(row: Record<string, unknown>): ServiceDefinitionUsageSummary {
  return {
    providerServiceCount: asNumber(row.provider_service_count),
    activeProviderServiceCount: asNumber(row.active_provider_service_count),
    staffServiceCount: asNumber(row.staff_service_count),
    activeStaffServiceCount: asNumber(row.active_staff_service_count),
    bookingDraftCount: asNumber(row.booking_draft_count),
  };
}

async function resolveAttributeTypeId(attributeType: string | number): Promise<number> {
  if (typeof attributeType === "number" && Number.isFinite(attributeType)) return attributeType;

  const raw = String(attributeType ?? "").trim();
  const numeric = Number(raw);
  if (Number.isInteger(numeric) && numeric > 0) return numeric;

  const rows = await sql<{ id: number }[]>`
    select id
    from category.attribute_types
    where lower(name) = lower(${raw})
    limit 1
  `;

  if (!rows[0]) {
    throw new Error(`Unknown attribute type: ${raw}`);
  }

  return rows[0].id;
}


export async function getServiceDefinitionsFromDb(
  locale: string,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<ServiceDefinition>>> {
  try {
    const { pageNumber, pageSize, offset, search, categoryId, status } = parsePageParams(params);
    const normalizedLocale = normalizeLocale(locale);
    const activeFilter: boolean | null = status === "active" ? true : status === "inactive" ? false : null;

    const rows = await sql<Record<string, unknown>[]>`
      with filtered as (
        select
          sd.id,
          sd.name_translations,
          sd.description_translations,
          sd.category_id,
          sd.duration_minutes,
          sd.pricing_model,
          sd.is_active,
          sd.currency,
          sd.value,
          common.get_translation_t(case when jsonb_typeof(sd.name_translations) = 'object' then sd.name_translations else '{}'::jsonb end, ${normalizedLocale}, 'en') as name,
          common.get_translation_t(case when jsonb_typeof(sd.description_translations) = 'object' then sd.description_translations else '{}'::jsonb end, ${normalizedLocale}, 'en') as description,
          common.get_translation_t(case when jsonb_typeof(c.name_translations) = 'object' then c.name_translations else '{}'::jsonb end, ${normalizedLocale}, 'en') as category_name,
          count(distinct sad.id) as attribute_count,
          count(distinct sddr.id) as requirement_count,
          count(distinct sufr.id) as upload_requirement_count,
          count(distinct ps.id) as provider_service_count,
          count(distinct ss.id) as staff_service_count
        from category.service_definitions sd
        join category.categories c on c.id = sd.category_id
        left join category.service_attribute_definitions sad on sad.service_definition_id = sd.id
        left join category.service_definition_domain_requirements sddr on sddr.service_definition_id = sd.id
        left join category.service_upload_file_requirements sufr on sufr.service_definition_id = sd.id
        left join category.provider_services ps on ps.service_definition_id = sd.id
        left join category.staff_services ss on ss.service_definition_id = sd.id
        where (${search} = '' or common.get_translation_t(case when jsonb_typeof(sd.name_translations) = 'object' then sd.name_translations else '{}'::jsonb end, ${normalizedLocale}, 'en') ilike ${`%${search}%`} or common.get_translation_t(case when jsonb_typeof(sd.description_translations) = 'object' then sd.description_translations else '{}'::jsonb end, ${normalizedLocale}, 'en') ilike ${`%${search}%`})
          and (${categoryId} = '' or sd.category_id = nullif(${categoryId}, '')::uuid)
          and (${activeFilter}::boolean is null or sd.is_active = ${activeFilter})
        group by sd.id, c.id
      ), counted as (
        select *, count(*) over() as total_count
        from filtered
      )
      select
        id,
        name,
        description,
        category_id,
        category_name,
        duration_minutes,
        pricing_model,
        is_active,
        currency,
        value as base_price,
        attribute_count,
        requirement_count,
        upload_requirement_count,
        provider_service_count,
        staff_service_count,
        total_count
      from counted
      order by name asc
      limit ${pageSize}
      offset ${offset}
    `;

    const totalCount = rows[0]?.total_count ? asNumber(rows[0].total_count) : 0;
    return ok(toPaginatedResult(rows.map(mapListRow), totalCount, pageNumber, pageSize));
  } catch (error) {
    return fail(error, "Failed to fetch service definitions.");
  }
}

export async function getServiceDefinitionsAllLocalesFromDb(
  locale: string,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<ServiceDefinitionWithAllLocales>>> {
  try {
    const { pageNumber, pageSize, offset, search } = parsePageParams(params);
    const normalizedLocale = normalizeLocale(locale);

    const rows = await sql<Record<string, unknown>[]>`
      with filtered as (
        select
          sd.id,
          sd.name_translations,
          sd.description_translations,
          sd.category_id,
          sd.duration_minutes,
          sd.pricing_model,
          sd.is_active,
          sd.currency,
          sd.value,
          common.get_translation_t(case when jsonb_typeof(c.name_translations) = 'object' then c.name_translations else '{}'::jsonb end, ${normalizedLocale}, 'en') as category_name,
          common.get_translation_t(case when jsonb_typeof(sd.name_translations) = 'object' then sd.name_translations else '{}'::jsonb end, ${normalizedLocale}, 'en') as sort_name
        from category.service_definitions sd
        join category.categories c on c.id = sd.category_id
        where ${search} = ''
          or common.get_translation_t(case when jsonb_typeof(sd.name_translations) = 'object' then sd.name_translations else '{}'::jsonb end, ${normalizedLocale}, 'en') ilike ${`%${search}%`}
          or common.get_translation_t(case when jsonb_typeof(sd.description_translations) = 'object' then sd.description_translations else '{}'::jsonb end, ${normalizedLocale}, 'en') ilike ${`%${search}%`}
      ), counted as (
        select *, count(*) over() as total_count
        from filtered
      )
      select *
      from counted
      order by sort_name asc
      limit ${pageSize}
      offset ${offset}
    `;

    const totalCount = rows[0]?.total_count ? asNumber(rows[0].total_count) : 0;
    return ok(toPaginatedResult(rows.map(mapAllLocaleRow), totalCount, pageNumber, pageSize));
  } catch (error) {
    return fail(error, "Failed to fetch service definitions.");
  }
}

export async function getServiceDefinitionOptionsFromDb(locale: string): Promise<ServiceDefinitionOptionWithAllLocales[]> {
  const normalizedLocale = normalizeLocale(locale);
  const rows = await sql<Record<string, unknown>[]>`
    select
      sd.id,
      sd.name_translations,
      sd.description_translations,
      common.get_translation_t(case when jsonb_typeof(c.name_translations) = 'object' then c.name_translations else '{}'::jsonb end, ${normalizedLocale}, 'en') as category_name,
      sd.value as base_price,
      sd.currency,
      sd.duration_minutes,
      sd.is_active
    from category.service_definitions sd
    join category.categories c on c.id = sd.category_id
    where sd.is_active = true
    order by common.get_translation_t(case when jsonb_typeof(sd.name_translations) = 'object' then sd.name_translations else '{}'::jsonb end, ${normalizedLocale}, 'en') asc
    limit 500
  `;

  return rows.map((row) => ({
    id: String(row.id),
    name: localizedResponse(row.name_translations),
    description: localizedResponse(row.description_translations),
    categoryName: String(row.category_name ?? ""),
    price: asNumber(row.base_price),
    currency: String(row.currency ?? ""),
    durationMinutes: asNumber(row.duration_minutes),
    isActive: asBoolean(row.is_active),
  }));
}

export async function getServiceDefinitionByIdFromDb(
  id: string,
  locale = DEFAULT_LOCALE
): Promise<ApiReturnType<ServiceDefinitionDetails>> {
  try {
    const normalizedLocale = normalizeLocale(locale);
    const rows = await sql<Record<string, unknown>[]>`
      select
        sd.*,
        common.get_translation_t(case when jsonb_typeof(c.name_translations) = 'object' then c.name_translations else '{}'::jsonb end, ${normalizedLocale}, 'en') as category_name
      from category.service_definitions sd
      join category.categories c on c.id = sd.category_id
      where sd.id = ${id}
      limit 1
    `;

    const row = rows[0];
    if (!row) {
      return {
        error: {
          title: "Service definition not found",
          status: 404,
          detail: "The requested service definition does not exist.",
        },
      } as ApiReturnType<ServiceDefinitionDetails>;
    }

    const [attributes, requirements, uploadRequirements, usageRows] = await Promise.all([
      getServiceAttributeDefinitionsFromDb(id),
      getServiceRequirementsFromDb(id),
      getServiceUploadRequirementsFromDb(id),
      sql<Record<string, unknown>[]>`
        select
          count(distinct ps.id) as provider_service_count,
          count(distinct ps.id) filter (where ps.is_active = true) as active_provider_service_count,
          count(distinct ss.id) as staff_service_count,
          count(distinct ss.id) filter (where ss.is_active = true) as active_staff_service_count,
          count(distinct bd.id) as booking_draft_count
        from category.service_definitions sd
        left join category.provider_services ps on ps.service_definition_id = sd.id
        left join category.staff_services ss on ss.service_definition_id = sd.id
        left join booking.booking_drafts bd on bd.service_id = ps.id
        where sd.id = ${id}
        group by sd.id
      `,
    ]);

    const details: ServiceDefinitionDetails = {
      id: String(row.id),
      name: localizedResponse(row.name_translations),
      description: localizedResponse(row.description_translations),
      categoryId: String(row.category_id),
      categoryName: String(row.category_name ?? ""),
      durationMinutes: asNumber(row.duration_minutes),
      currency: String(row.currency ?? ""),
      basePrice: asNumber(row.value),
      pricingModel: String(row.pricing_model ?? ""),
      isActive: asBoolean(row.is_active),
      attributeDefinitions: attributes,
      requirements,
      uploadRequirements,
      usage: mapUsageRow(usageRows[0] || {}),
    };

    return ok(details);
  } catch (error) {
    return fail(error, "Failed to fetch service definition details.");
  }
}

export async function createServiceDefinitionInDb(input: ServiceDefinitionMutationInput) {
  const rows = await sql<{ id: string }[]>`
    insert into category.service_definitions (
      id,
      name_translations,
      description_translations,
      category_id,
      duration_minutes,
      pricing_model,
      is_active,
      currency,
      value,
      create_date,
      last_modified_date
    ) values (
      public.uuid_generate_v4(),
      ${sql.json(normalizeTranslations(input.name))},
      ${sql.json(normalizeTranslations(input.description))},
      ${input.categoryId},
      ${input.durationMinutes},
      ${input.pricingModel},
      ${input.isActive},
      ${input.currency},
      ${input.value},
      now(),
      now()
    )
    returning id
  `;

  return rows[0].id;
}

export async function updateServiceDefinitionInDb(input: ServiceDefinitionMutationInput) {
  if (!input.serviceDefinitionId) throw new Error("serviceDefinitionId is required.");

  const rows = await sql<{ id: string }[]>`
    update category.service_definitions
    set
      name_translations = ${sql.json(normalizeTranslations(input.name))},
      description_translations = ${sql.json(normalizeTranslations(input.description))},
      category_id = ${input.categoryId},
      duration_minutes = ${input.durationMinutes},
      pricing_model = ${input.pricingModel},
      is_active = ${input.isActive},
      currency = ${input.currency},
      value = ${input.value},
      last_modified_date = now()
    where id = ${input.serviceDefinitionId}
    returning id
  `;

  if (!rows[0]) throw new Error("Service definition was not found.");
  return rows[0].id;
}

export async function deleteServiceDefinitionInDb(serviceDefinitionId: string) {
  const usage = await sql<{ usage_count: number }[]>`
    select
      (
        (select count(*) from category.provider_services where service_definition_id = ${serviceDefinitionId}) +
        (select count(*) from category.staff_services where service_definition_id = ${serviceDefinitionId})
      )::integer as usage_count
  `;

  if (asNumber(usage[0]?.usage_count) > 0) {
    throw new Error("This definition is used by provider/staff services. Deactivate it instead of deleting, or remove dependent records first.");
  }

  const rows = await sql<{ id: string }[]>`
    delete from category.service_definitions
    where id = ${serviceDefinitionId}
    returning id
  `;

  return Boolean(rows[0]);
}

export async function setServiceDefinitionActivationInDb(serviceDefinitionId: string, isActive: boolean) {
  const rows = await sql<{ id: string }[]>`
    update category.service_definitions
    set is_active = ${isActive}, last_modified_date = now()
    where id = ${serviceDefinitionId}
    returning id
  `;
  if (!rows[0]) throw new Error("Service definition was not found.");
  return rows[0].id;
}
export async function getServiceAttributeDefinitionsFromDb(serviceDefinitionId: string): Promise<ServiceAttributeDefinition[]> {
  const rows = await sql<Record<string, unknown>[]>`
    select
      sad.id,
      sad.name_translations,
      sad.description_translations,
      sad.attribute_type_id,
      at.name as attribute_type_name,
      sad.is_required,
      sad.affects_pricing,
      sad.display_order
    from category.service_attribute_definitions sad
    join category.attribute_types at on at.id = sad.attribute_type_id
    where sad.service_definition_id = ${serviceDefinitionId}
    order by sad.display_order asc, sad.create_date asc
  `;

  const optionRows = await sql<Record<string, unknown>[]>`
    select
      service_attribute_definition_id,
      id,
      display_name_translations,
      value_translations,
      additional_price
    from category.service_attribute_definition_options
    where service_attribute_definition_id in (
      select id from category.service_attribute_definitions where service_definition_id = ${serviceDefinitionId}
    )
    order by service_attribute_definition_id, id
  `;

  const optionsByAttribute = new Map<string, Record<string, unknown>[]>();
  for (const option of optionRows) {
    const key = String(option.service_attribute_definition_id);
    optionsByAttribute.set(key, [...(optionsByAttribute.get(key) || []), option]);
  }

  return rows.map((row) => {
    const id = String(row.id);
    return {
      id,
      name: localizedResponse(row.name_translations),
      description: localizedResponse(row.description_translations),
      attributeType: String(row.attribute_type_name ?? row.attribute_type_id ?? ""),
      attributeTypeId: asNumber(row.attribute_type_id),
      isRequired: asBoolean(row.is_required),
      affectsPricing: asBoolean(row.affects_pricing),
      displayOrder: asNumber(row.display_order),
      options: (optionsByAttribute.get(id) || []).map((option) => ({
        id: asNumber(option.id),
        displayName: localizedResponse(option.display_name_translations),
        value: localizedResponse(option.value_translations),
        additionalPrice: asNumber(option.additional_price),
      })),
    };
  });
}

export async function addServiceAttributeDefinitionInDb(input: AttributeMutationInput) {
  const attributeTypeId = await resolveAttributeTypeId(input.attributeType);
  const rows = await sql<{ id: string }[]>`
    insert into category.service_attribute_definitions (
      id,
      name_translations,
      description_translations,
      attribute_type_id,
      is_required,
      affects_pricing,
      display_order,
      service_definition_id,
      create_date,
      last_modified_date
    ) values (
      public.uuid_generate_v4(),
      ${sql.json(normalizeTranslations(input.name))},
      ${sql.json(normalizeTranslations(input.description))},
      ${attributeTypeId},
      ${input.isRequired},
      ${input.affectsPricing},
      ${input.displayOrder ?? 0},
      ${input.serviceDefinitionId},
      now(),
      now()
    )
    returning id
  `;

  const attributeId = rows[0].id;
  await replaceAttributeOptions(attributeId, input.options || []);
  return attributeId;
}

export async function updateServiceAttributeDefinitionInDb(input: AttributeMutationInput) {
  if (!input.attributeDefinitionId) throw new Error("attributeDefinitionId is required.");
  const attributeTypeId = await resolveAttributeTypeId(input.attributeType);

  const rows = await sql<{ id: string }[]>`
    update category.service_attribute_definitions
    set
      name_translations = ${sql.json(normalizeTranslations(input.name))},
      description_translations = ${sql.json(normalizeTranslations(input.description))},
      attribute_type_id = ${attributeTypeId},
      is_required = ${input.isRequired},
      affects_pricing = ${input.affectsPricing},
      display_order = ${input.displayOrder ?? 0},
      last_modified_date = now()
    where id = ${input.attributeDefinitionId}
      and service_definition_id = ${input.serviceDefinitionId}
    returning id
  `;

  if (!rows[0]) throw new Error("Attribute definition was not found.");
  await replaceAttributeOptions(input.attributeDefinitionId, input.options || []);
  return rows[0].id;
}

async function replaceAttributeOptions(
  attributeDefinitionId: string,
  options: NonNullable<AttributeMutationInput["options"]>
) {
  await sql.begin(async (tx) => {
    await tx`
      delete from category.service_attribute_definition_options
      where service_attribute_definition_id = ${attributeDefinitionId}
    `;

    for (const option of options) {
      await tx`
        insert into category.service_attribute_definition_options (
          service_attribute_definition_id,
          display_name_translations,
          value_translations,
          additional_price
        ) values (
          ${attributeDefinitionId},
          ${sql.json(normalizeTranslations(option.displayName))},
          ${sql.json(normalizeTranslations(option.value))},
          ${option.additionalPrice ?? 0}
        )
      `;
    }
  });
}

export async function removeServiceAttributeDefinitionInDb(serviceDefinitionId: string, attributeDefinitionId: string) {
  const rows = await sql<{ id: string }[]>`
    delete from category.service_attribute_definitions
    where id = ${attributeDefinitionId}
      and service_definition_id = ${serviceDefinitionId}
    returning id
  `;
  return Boolean(rows[0]);
}

export async function getServiceRequirementsFromDb(serviceDefinitionId: string): Promise<ServiceRequirement[]> {
  const rows = await sql<Record<string, unknown>[]>`
    select id, description_translations, is_mandatory
    from category.service_definition_domain_requirements
    where service_definition_id = ${serviceDefinitionId}
    order by id asc
  `;
  return rows.map(mapRequirement);
}

export async function addServiceRequirementInDb(input: RequirementMutationInput) {
  const rows = await sql<{ id: number }[]>`
    insert into category.service_definition_domain_requirements (
      service_definition_id,
      description_translations,
      is_mandatory
    ) values (
      ${input.serviceDefinitionId},
      ${sql.json(normalizeTranslations(input.description))},
      ${input.isMandatory}
    )
    returning id
  `;
  return String(rows[0].id);
}

export async function updateServiceRequirementInDb(input: RequirementMutationInput) {
  if (typeof input.requirementIndex !== "number") throw new Error("requirement id is required.");

  const rows = await sql<{ id: number }[]>`
    update category.service_definition_domain_requirements
    set
      description_translations = ${sql.json(normalizeTranslations(input.description))},
      is_mandatory = ${input.isMandatory}
    where service_definition_id = ${input.serviceDefinitionId}
      and id = ${input.requirementIndex}
    returning id
  `;

  if (!rows[0]) throw new Error("Domain requirement was not found.");
  return String(rows[0].id);
}

export async function removeServiceRequirementInDb(serviceDefinitionId: string, requirementId: number) {
  const rows = await sql<{ id: number }[]>`
    delete from category.service_definition_domain_requirements
    where service_definition_id = ${serviceDefinitionId}
      and id = ${requirementId}
    returning id
  `;
  return Boolean(rows[0]);
}

export async function getServiceUploadRequirementsFromDb(serviceDefinitionId: string): Promise<ServiceDefinitionUploadRequirement[]> {
  const rows = await sql<Record<string, unknown>[]>`
    select *
    from category.service_upload_file_requirements
    where service_definition_id = ${serviceDefinitionId}
    order by display_order asc, create_date asc
  `;
  return rows.map(mapUploadRequirement);
}

export async function addServiceUploadRequirementInDb(input: UploadRequirementMutationInput) {
  const rows = await sql<{ id: string }[]>`
    insert into category.service_upload_file_requirements (
      id,
      service_definition_id,
      title_translations,
      description_translations,
      is_required,
      max_file_size_bytes,
      allowed_extensions,
      allowed_mime_types,
      max_files,
      display_order,
      example_file_url,
      create_date,
      last_modified_date
    ) values (
      public.uuid_generate_v4(),
      ${input.serviceDefinitionId},
      ${sql.json(normalizeTranslations(input.title))},
      ${sql.json(normalizeTranslations(input.description))},
      ${input.isRequired},
      ${input.maxFileSizeBytes},
      ${input.allowedExtensions},
      ${input.allowedMimeTypes},
      ${input.maxFiles},
      ${input.displayOrder},
      ${input.exampleFileUrl || null},
      now(),
      now()
    )
    returning id
  `;

  return rows[0].id;
}

export async function updateServiceUploadRequirementInDb(input: UploadRequirementMutationInput) {
  if (!input.requirementId) throw new Error("requirementId is required.");

  const rows = await sql<{ id: string }[]>`
    update category.service_upload_file_requirements
    set
      title_translations = ${sql.json(normalizeTranslations(input.title))},
      description_translations = ${sql.json(normalizeTranslations(input.description))},
      is_required = ${input.isRequired},
      max_file_size_bytes = ${input.maxFileSizeBytes},
      allowed_extensions = ${input.allowedExtensions},
      allowed_mime_types = ${input.allowedMimeTypes},
      max_files = ${input.maxFiles},
      display_order = ${input.displayOrder},
      example_file_url = ${input.exampleFileUrl || null},
      last_modified_date = now()
    where id = ${input.requirementId}
      and service_definition_id = ${input.serviceDefinitionId}
    returning id
  `;

  if (!rows[0]) throw new Error("Upload file requirement was not found.");
  return rows[0].id;
}

export async function removeServiceUploadRequirementInDb(serviceDefinitionId: string, requirementId: string) {
  const rows = await sql<{ id: string }[]>`
    delete from category.service_upload_file_requirements
    where id = ${requirementId}
      and service_definition_id = ${serviceDefinitionId}
    returning id
  `;
  return Boolean(rows[0]);
}

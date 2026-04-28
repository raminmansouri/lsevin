import "server-only";

import sql from "@/config/database/db";

const DEFAULT_LOCALE = "en-US";
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

type ServiceDefinitionRow = {
  id: string;
  name: string;
  description: string;
  category_id: string;
  category_name: string;
  duration_minutes: number;
  pricing_model: string;
  is_active: boolean;
  currency: string;
  base_price: string | number;
  attribute_count: string | number;
  requirement_count: string | number;
  upload_requirement_count: string | number;
  provider_service_count: string | number;
  staff_service_count: string | number;
  total_count: string | number;
};

export type ServiceDefinitionListParams = {
  search?: string | null;
  categoryId?: string | null;
  activeFilter?: string | boolean | null;
  locale?: string | null;
  page?: number | string | null;
  pageSize?: number | string | null;
};

function asInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function normalizePage(value: unknown) {
  return Math.max(1, asInt(value, 1));
}

function normalizePageSize(value: unknown) {
  return Math.max(1, Math.min(MAX_PAGE_SIZE, asInt(value, DEFAULT_PAGE_SIZE)));
}

function normalizeBoolean(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized || normalized === "all") return null;
  if (["true", "1", "active", "yes"].includes(normalized)) return true;
  if (["false", "0", "inactive", "no"].includes(normalized)) return false;
  return null;
}

function normalizeUuid(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized === "all") return null;
  return normalized;
}

function normalizeLocale(locale: unknown) {
  const value = String(locale ?? "").trim();
  return value || DEFAULT_LOCALE;
}

/**
 * Drop-in fixed version of the service definitions list query.
 *
 * What changed:
 * 1. Search now checks ALL translation values, not only the value resolved by current locale.
 * 2. Fallback locale is en-US, not en.
 * 3. activeFilter is normalized in JS before it reaches SQL, so empty strings are never cast to boolean.
 * 4. categoryId is normalized in JS before it reaches SQL, so empty strings are never cast to uuid.
 * 5. jsonb_each_text is only called against guarded JSONB objects.
 */
export async function getServiceDefinitionsFixed(params: ServiceDefinitionListParams) {
  const search = String(params.search ?? "").trim();
  const searchPattern = `%${search}%`;
  const normalizedLocale = normalizeLocale(params.locale);
  const categoryId = normalizeUuid(params.categoryId);
  const activeFilter = normalizeBoolean(params.activeFilter);
  const page = normalizePage(params.page);
  const pageSize = normalizePageSize(params.pageSize);
  const offset = (page - 1) * pageSize;

  const rows = await sql<ServiceDefinitionRow[]>`
    with base as (
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
        sd.create_date,
        case when jsonb_typeof(sd.name_translations) = 'object' then sd.name_translations else '{}'::jsonb end as safe_name_translations,
        case when jsonb_typeof(sd.description_translations) = 'object' then sd.description_translations else '{}'::jsonb end as safe_description_translations,
        case when jsonb_typeof(c.name_translations) = 'object' then c.name_translations else '{}'::jsonb end as safe_category_name_translations,
        common.get_translation_t(
          case when jsonb_typeof(sd.name_translations) = 'object' then sd.name_translations else '{}'::jsonb end,
          ${normalizedLocale},
          ${DEFAULT_LOCALE}
        ) as name,
        common.get_translation_t(
          case when jsonb_typeof(sd.description_translations) = 'object' then sd.description_translations else '{}'::jsonb end,
          ${normalizedLocale},
          ${DEFAULT_LOCALE}
        ) as description,
        common.get_translation_t(
          case when jsonb_typeof(c.name_translations) = 'object' then c.name_translations else '{}'::jsonb end,
          ${normalizedLocale},
          ${DEFAULT_LOCALE}
        ) as category_name,
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
      where (${categoryId}::uuid is null or sd.category_id = ${categoryId}::uuid)
        and (${activeFilter}::boolean is null or sd.is_active = ${activeFilter}::boolean)
      group by sd.id, c.id
    ), filtered as (
      select *
      from base
      where ${search} = ''
        or name ilike ${searchPattern}
        or description ilike ${searchPattern}
        or category_name ilike ${searchPattern}
        or pricing_model ilike ${searchPattern}
        or currency ilike ${searchPattern}
        or id::text ilike ${searchPattern}
        or exists (
          select 1
          from jsonb_each_text(safe_name_translations) t
          where t.value ilike ${searchPattern}
        )
        or exists (
          select 1
          from jsonb_each_text(safe_description_translations) t
          where t.value ilike ${searchPattern}
        )
        or exists (
          select 1
          from jsonb_each_text(safe_category_name_translations) t
          where t.value ilike ${searchPattern}
        )
    ), counted as (
      select *, count(*) over() as total_count
      from filtered
    )
    select
      id::text,
      name,
      description,
      category_id::text,
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
    order by lower(nullif(name, '')) asc nulls last, create_date desc
    limit ${pageSize}
    offset ${offset}
  `;

  const totalCount = Number(rows[0]?.total_count ?? 0);

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      categoryId: row.category_id,
      categoryName: row.category_name,
      durationMinutes: Number(row.duration_minutes ?? 0),
      pricingModel: row.pricing_model,
      isActive: row.is_active,
      currency: row.currency,
      basePrice: Number(row.base_price ?? 0),
      attributeCount: Number(row.attribute_count ?? 0),
      requirementCount: Number(row.requirement_count ?? 0),
      uploadRequirementCount: Number(row.upload_requirement_count ?? 0),
      providerServiceCount: Number(row.provider_service_count ?? 0),
      staffServiceCount: Number(row.staff_service_count ?? 0),
    })),
    page,
    pageSize,
    totalCount,
    pageCount: Math.max(1, Math.ceil(totalCount / pageSize)),
  };
}

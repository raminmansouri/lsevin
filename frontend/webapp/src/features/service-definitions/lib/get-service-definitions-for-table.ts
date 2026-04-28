import "server-only";

import sql from "@/config/database/db";
import { normalizeAdminTableParams, type AdminSearchParamsInput } from "@/features/admin-search/normalize-admin-search-params";

const DEFAULT_LOCALE = "en-US";

type RawServiceDefinitionRow = {
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

export type ServiceDefinitionTableItem = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  durationMinutes: number;
  pricingModel: string;
  isActive: boolean;
  currency: string;
  basePrice: number;
  attributeCount: number;
  requirementCount: number;
  uploadRequirementCount: number;
  providerServiceCount: number;
  staffServiceCount: number;
};

export type ServiceDefinitionsTableResult = {
  items: ServiceDefinitionTableItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  pageCount: number;
  search: string;
};

function n(value: unknown) {
  return Number(value ?? 0);
}

function toSearchPattern(search: string) {
  return `%${search.trim().replace(/[%_\\]/g, "\\$&")}%`;
}

/**
 * This is the query that should power the main admin service-definitions datatable.
 *
 * It intentionally accepts raw searchParams so it works whether your UI currently uses
 * ?search=, ?q=, ?query=, ?keyword=, or TanStack-style ?globalFilter=.
 */
export async function getServiceDefinitionsForTable(args: {
  searchParams?: AdminSearchParamsInput;
  locale?: string | null;
}): Promise<ServiceDefinitionsTableResult> {
  const params = normalizeAdminTableParams(args.searchParams, args.locale);
  const search = params.search.trim();
  const pattern = toSearchPattern(search);
  const categoryId = params.categoryId;
  const activeFilter = params.activeFilter;
  const offset = (params.page - 1) * params.pageSize;
  const locale = params.locale || DEFAULT_LOCALE;

  const rows = await sql<RawServiceDefinitionRow[]>`
    with base as (
      select
        sd.id,
        sd.category_id,
        sd.duration_minutes,
        sd.pricing_model,
        sd.is_active,
        sd.currency,
        sd.value,
        sd.create_date,
        case when jsonb_typeof(sd.name_translations) = 'object' then sd.name_translations else '{}'::jsonb end as sd_names,
        case when jsonb_typeof(sd.description_translations) = 'object' then sd.description_translations else '{}'::jsonb end as sd_descriptions,
        case when jsonb_typeof(c.name_translations) = 'object' then c.name_translations else '{}'::jsonb end as category_names,
        common.get_translation_t(
          case when jsonb_typeof(sd.name_translations) = 'object' then sd.name_translations else '{}'::jsonb end,
          ${locale},
          ${DEFAULT_LOCALE}
        ) as name,
        common.get_translation_t(
          case when jsonb_typeof(sd.description_translations) = 'object' then sd.description_translations else '{}'::jsonb end,
          ${locale},
          ${DEFAULT_LOCALE}
        ) as description,
        common.get_translation_t(
          case when jsonb_typeof(c.name_translations) = 'object' then c.name_translations else '{}'::jsonb end,
          ${locale},
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
        or name ilike ${pattern} escape '\\'
        or description ilike ${pattern} escape '\\'
        or category_name ilike ${pattern} escape '\\'
        or pricing_model ilike ${pattern} escape '\\'
        or currency ilike ${pattern} escape '\\'
        or id::text ilike ${pattern} escape '\\'
        or exists (
          select 1
          from jsonb_each_text(sd_names) t
          where t.value ilike ${pattern} escape '\\'
        )
        or exists (
          select 1
          from jsonb_each_text(sd_descriptions) t
          where t.value ilike ${pattern} escape '\\'
        )
        or exists (
          select 1
          from jsonb_each_text(category_names) t
          where t.value ilike ${pattern} escape '\\'
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
    limit ${params.pageSize}
    offset ${offset}
  `;

  const totalCount = n(rows[0]?.total_count);

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      categoryId: row.category_id,
      categoryName: row.category_name,
      durationMinutes: n(row.duration_minutes),
      pricingModel: row.pricing_model,
      isActive: row.is_active,
      currency: row.currency,
      basePrice: n(row.base_price),
      attributeCount: n(row.attribute_count),
      requirementCount: n(row.requirement_count),
      uploadRequirementCount: n(row.upload_requirement_count),
      providerServiceCount: n(row.provider_service_count),
      staffServiceCount: n(row.staff_service_count),
    })),
    totalCount,
    page: params.page,
    pageSize: params.pageSize,
    pageCount: Math.max(1, Math.ceil(totalCount / params.pageSize)),
    search,
  };
}

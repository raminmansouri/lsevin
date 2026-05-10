import "server-only";

import sql from "@/config/database/db";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  FilterParams,
} from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

export type AdminServiceDefinitionListItem = {
  id: string;
  name: string;
  description: string;
  categoryId: string;
  categoryName: string;
  durationMinutes: number;
  pricingModel: string;
  isActive: boolean;
  currency: string;
  value: number;
  requiresSpecialist: boolean;
  bookingUiMode: string;
  providerServiceCount: number;
  activeProviderServiceCount: number;
  uploadRequirementCount: number;
  attributeCount: number;
  createDate: string;
  lastModifiedDate: string | null;
};

export type AdminServiceDefinitionCategoryOption = {
  id: string;
  name: string;
  serviceDefinitionCount: number;
};

type CountRow = { total_count: number | string };

export type AdminServiceDefinitionFilterParams = FilterParams & {
  categoryId?: string | null;
};

const EMPTY_TRANSLATIONS_SQL = sql`'{}'::jsonb`;

function safeJsonObject(columnSql: any) {
  return sql`case when jsonb_typeof(${columnSql}) = 'object' then ${columnSql} else ${EMPTY_TRANSLATIONS_SQL} end`;
}

function normalizeLocaleCode(locale?: string | null) {
  const normalized = String(locale || "en-US").trim().replace("_", "-");
  return normalized || "en-US";
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

function ok<T>(data: T): ApiReturnType<T> {
  return { data, error: undefined } as ApiReturnType<T>;
}

function fail<T>(title: string, status = 500, detail?: string): ApiReturnType<T> {
  return {
    data: undefined,
    error: { title, status, detail },
  } as ApiReturnType<T>;
}

function resolveSearchText(params: AdminServiceDefinitionFilterParams | undefined) {
  const value =
    params?.filters ||
    (params as any)?.filter ||
    (params as any)?.search ||
    (params as any)?.q ||
    (params as any)?.query ||
    (params as any)?.globalFilter;

  return typeof value === "string" ? value.trim() : "";
}

function buildWhere(params: AdminServiceDefinitionFilterParams | undefined, locale: string) {
  const parts: any[] = [];
  const search = resolveSearchText(params);
  const categoryId = typeof params?.categoryId === "string" ? params.categoryId.trim() : "";

  if (categoryId) {
    parts.push(sql`sd.category_id::text = ${categoryId}`);
  }

  if (search) {
    const like = `%${search}%`;
    parts.push(sql`(
      ${translated(sql`sd.name_translations`, locale)} ilike ${like}
      or ${translated(sql`sd.description_translations`, locale)} ilike ${like}
      or ${translated(sql`c.name_translations`, locale)} ilike ${like}
      or coalesce(sd.pricing_model, '') ilike ${like}
      or coalesce(sd.currency, '') ilike ${like}
      or coalesce(sd.booking_ui_mode, '') ilike ${like}
      or exists (
        select 1
        from category.provider_services ps_search
        where ps_search.service_definition_id = sd.id
          and (
            ${translated(sql`ps_search.display_name_translations`, locale)} ilike ${like}
            or ${translated(sql`ps_search.description_translations`, locale)} ilike ${like}
          )
      )
    )`);
  }

  return parts.length ? sql`where ${parts.reduce((acc, part) => sql`${acc} and ${part}`)}` : sql``;
}

function buildOrder(sortOrder: unknown, locale: string) {
  const value = typeof sortOrder === "string" ? sortOrder : "";

  switch (value) {
    case "name.desc":
      return sql`${translated(sql`sd.name_translations`, locale)} desc`;
    case "created.asc":
      return sql`sd.create_date asc`;
    case "created.desc":
      return sql`sd.create_date desc`;
    case "category.asc":
      return sql`${translated(sql`c.name_translations`, locale)} asc, ${translated(sql`sd.name_translations`, locale)} asc`;
    case "category.desc":
      return sql`${translated(sql`c.name_translations`, locale)} desc, ${translated(sql`sd.name_translations`, locale)} asc`;
    default:
      return sql`${translated(sql`sd.name_translations`, locale)} asc`;
  }
}

export async function getAdminServiceDefinitions(
  locale: string,
  params?: AdminServiceDefinitionFilterParams,
): Promise<ApiReturnType<PaginatedResult<AdminServiceDefinitionListItem>>> {
  try {
    const pageNumber = Math.max(1, Number(params?.pageNumber || DEFAULT_PAGE_NUMBER));
    const pageSize = Math.min(100, Math.max(1, Number(params?.pageSize || DEFAULT_PAGE_SIZE)));
    const offset = (pageNumber - 1) * pageSize;
    const whereSql = buildWhere(params, locale);
    const orderSql = buildOrder((params as any)?.sortOrder, locale);

    const rows = await sql<(AdminServiceDefinitionListItem & CountRow)[]>`
      select
        sd.id::text,
        ${translated(sql`sd.name_translations`, locale)} as name,
        ${translated(sql`sd.description_translations`, locale)} as description,
        sd.category_id::text as "categoryId",
        ${translated(sql`c.name_translations`, locale)} as "categoryName",
        coalesce(sd.duration_minutes, 0)::int as "durationMinutes",
        sd.pricing_model as "pricingModel",
        sd.is_active as "isActive",
        sd.currency,
        coalesce(sd.value, 0)::float8 as value,
        coalesce(sd.requires_specialist, true) as "requiresSpecialist",
        coalesce(sd.booking_ui_mode, 'default_slot') as "bookingUiMode",
        coalesce(ps_counts.provider_service_count, 0)::int as "providerServiceCount",
        coalesce(ps_counts.active_provider_service_count, 0)::int as "activeProviderServiceCount",
        coalesce(requirement_counts.upload_requirement_count, 0)::int as "uploadRequirementCount",
        coalesce(attribute_counts.attribute_count, 0)::int as "attributeCount",
        sd.create_date::text as "createDate",
        sd.last_modified_date::text as "lastModifiedDate",
        count(*) over() as total_count
      from category.service_definitions sd
      left join category.categories c on c.id = sd.category_id
      left join lateral (
        select
          count(*)::int as provider_service_count,
          count(*) filter (where ps.is_active = true)::int as active_provider_service_count
        from category.provider_services ps
        where ps.service_definition_id = sd.id
      ) ps_counts on true
      left join lateral (
        select count(*)::int as upload_requirement_count
        from category.service_upload_file_requirements sufr
        where sufr.service_definition_id = sd.id
      ) requirement_counts on true
      left join lateral (
        select count(*)::int as attribute_count
        from category.service_attribute_definitions sad
        where sad.service_definition_id = sd.id
      ) attribute_counts on true
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
    } as PaginatedResult<AdminServiceDefinitionListItem>);
  } catch (error) {
    console.error("getAdminServiceDefinitions failed", error);
    return fail("Could not load service definitions.");
  }
}

export async function getAdminServiceDefinitionCategoryOptions(
  locale: string,
): Promise<ApiReturnType<AdminServiceDefinitionCategoryOption[]>> {
  try {
    const rows = await sql<AdminServiceDefinitionCategoryOption[]>`
      select
        c.id::text,
        ${translated(sql`c.name_translations`, locale)} as name,
        count(sd.id)::int as "serviceDefinitionCount"
      from category.categories c
      join category.service_definitions sd on sd.category_id = c.id
      group by c.id, c.name_translations, c.display_order
      order by c.display_order nulls last, name
    `;

    return ok(rows);
  } catch (error) {
    console.error("getAdminServiceDefinitionCategoryOptions failed", error);
    return fail("Could not load service definition categories.");
  }
}

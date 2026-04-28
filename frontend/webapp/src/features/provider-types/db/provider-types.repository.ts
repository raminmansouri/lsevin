
import "server-only";

import sql from "@/config/database/db";
import { DEFAULT_PAGE_NUMBER, DEFAULT_PAGE_SIZE } from "@/types/filter";
import { PaginatedResult } from "@/types/network";

import {
  AttributeDefinitionResponse,
  ProviderType,
  ProviderTypeFiltered,
} from "../types/provider-type";
import { ProviderAttributeDefinitionCreateInput, ProviderTypeInput } from "../schemas";

type LocalizedPayload = { translations?: Record<string, string> } | Record<string, string> | null | undefined;

type ProviderTypeRow = {
  id: string;
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  name: string;
  description: string;
  isActive: boolean;
  iconUrl: string | null;
  imageUrl: string | null;
  imagePreviewUrl: string | null;
  createDate: string;
  lastModifiedDate: string | null;
  attributeDefinitionsCount?: number;
};

type AttributeDefinitionRow = {
  id: string;
  nameTranslations: Record<string, string>;
  descriptionTranslations: Record<string, string>;
  attributeTypeId: number;
  attributeType: string;
  isRequired: boolean;
  validationRules: string | null;
};

type AttributeOptionRow = {
  serviceAttributeDefinitionId?: string;
  providerAttributeDefinitionId?: string;
  attributeDefinitionId: string;
  displayNameTranslations: Record<string, string>;
  valueTranslations: Record<string, string>;
};

const DEFAULT_LOCALE = "en-US";

const toTranslations = (value: LocalizedPayload): Record<string, string> => {
  if (!value) return {};
  if ("translations" in value && typeof value.translations === "object" && value.translations) {
    return value.translations;
  }
  return value as Record<string, string>;
};

const normalizeLocale = (locale?: string | null) => locale || DEFAULT_LOCALE;

const getPageNumber = (params?: Record<string, unknown>) => {
  const value = params?.PageNumber ?? params?.pageNumber ?? params?.page ?? DEFAULT_PAGE_NUMBER;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PAGE_NUMBER;
};

const getPageSize = (params?: Record<string, unknown>) => {
  const value = params?.PageSize ?? params?.pageSize ?? params?.perPage ?? DEFAULT_PAGE_SIZE;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 100) : DEFAULT_PAGE_SIZE;
};

const getSearch = (params?: Record<string, unknown>) => {
  const value = params?.Search ?? params?.search ?? params?.query ?? params?.q;
  return typeof value === "string" ? value.trim() : "";
};

const toProblem = (error: unknown) => ({
  title: "Database operation failed",
  detail: error instanceof Error ? error.message : "Unexpected database error.",
  status: 500,
});

export const providerTypeProblem = toProblem;

const mapProviderType = (
  row: ProviderTypeRow,
  attributeDefinitions: AttributeDefinitionResponse[] = []
): ProviderType => ({
  id: row.id,
  name: { translations: row.nameTranslations ?? {} },
  description: { translations: row.descriptionTranslations ?? {} },
  isActive: row.isActive,
  iconUrl: row.iconUrl ?? undefined,
  imageUrl: row.imageUrl ?? undefined,
  imagePreviewUrl: row.imagePreviewUrl ?? undefined,
  createDate: row.createDate,
  lastModifiedDate: row.lastModifiedDate ?? undefined,
  attributeDefinitions: attributeDefinitions.map((attribute) => ({
    ...attribute,
    attributeType: attribute.attributeType,
  })) as ProviderType["attributeDefinitions"],
});

export async function listProviderTypes(params?: Record<string, unknown>, locale?: string): Promise<PaginatedResult<ProviderTypeFiltered>> {
  const pageNumber = getPageNumber(params);
  const pageSize = getPageSize(params);
  const search = getSearch(params);
  const offset = (pageNumber - 1) * pageSize;
  const preferredLocale = normalizeLocale(locale);

  const whereSql = search
    ? sql`where common.get_translation_t(pt.name_translations, ${preferredLocale}, ${DEFAULT_LOCALE}) ilike ${`%${search}%`}
        or common.get_translation_t(pt.description_translations, ${preferredLocale}, ${DEFAULT_LOCALE}) ilike ${`%${search}%`}`
    : sql``;

  const rows = await sql<ProviderTypeRow[]>`
    select
      pt.id,
      pt.name_translations as "nameTranslations",
      pt.description_translations as "descriptionTranslations",
      common.get_translation_t(pt.name_translations, ${preferredLocale}, ${DEFAULT_LOCALE}) as "name",
      common.get_translation_t(pt.description_translations, ${preferredLocale}, ${DEFAULT_LOCALE}) as "description",
      pt.is_active as "isActive",
      pt.icon_url as "iconUrl",
      pt.image_url as "imageUrl",
      coalesce(ml.file_url, pt.image_url) as "imagePreviewUrl",
      pt.create_date as "createDate",
      pt.last_modified_date as "lastModifiedDate",
      count(pad.id)::int as "attributeDefinitionsCount"
    from category.provider_types pt
    left join media.media_library ml on ml.id::text = pt.image_url
    left join category.provider_attribute_definitions pad on pad.provider_type_id = pt.id
    ${whereSql}
    group by pt.id, ml.file_url
    order by pt.create_date desc
    limit ${pageSize} offset ${offset}
  `;

  const countRows = await sql<{ count: number }[]>`
    select count(*)::int as count
    from category.provider_types pt
    ${whereSql}
  `;

  const totalCount = countRows[0]?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  return {
    items: rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      isActive: row.isActive,
      iconUrl: row.iconUrl ?? undefined,
      imageUrl: row.imageUrl ?? undefined,
      imagePreviewUrl: row.imagePreviewUrl ?? undefined,
      createDate: row.createDate,
      lastModifiedDate: row.lastModifiedDate ?? undefined,
      attributeDefinitionsCount: row.attributeDefinitionsCount ?? 0,
    })),
    totalCount,
    pageNumber,
    pageSize,
    totalPages,
  } as PaginatedResult<ProviderTypeFiltered>;
}

export async function getProviderType(id: string): Promise<ProviderType | null> {
  const rows = await sql<ProviderTypeRow[]>`
    select
      pt.id,
      pt.name_translations as "nameTranslations",
      pt.description_translations as "descriptionTranslations",
      common.get_translation_t(pt.name_translations, ${DEFAULT_LOCALE}, ${DEFAULT_LOCALE}) as "name",
      common.get_translation_t(pt.description_translations, ${DEFAULT_LOCALE}, ${DEFAULT_LOCALE}) as "description",
      pt.is_active as "isActive",
      pt.icon_url as "iconUrl",
      pt.image_url as "imageUrl",
      coalesce(ml.file_url, pt.image_url) as "imagePreviewUrl",
      pt.create_date as "createDate",
      pt.last_modified_date as "lastModifiedDate"
    from category.provider_types pt
    left join media.media_library ml on ml.id::text = pt.image_url
    where pt.id = ${id}
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  const attributeRows = await sql<AttributeDefinitionRow[]>`
    select
      pad.id,
      pad.name_translations as "nameTranslations",
      pad.description_translations as "descriptionTranslations",
      pad.attribute_type_id as "attributeTypeId",
      coalesce(at.name, pad.attribute_type_id::text) as "attributeType",
      pad.is_required as "isRequired",
      pad.validation_rules as "validationRules"
    from category.provider_attribute_definitions pad
    left join category.attribute_types at on at.id = pad.attribute_type_id
    where pad.provider_type_id = ${id}
    order by pad.create_date asc
  `;

  const attributeIds = attributeRows.map((item) => item.id);
  const optionRows = attributeIds.length
    ? await sql<AttributeOptionRow[]>`
        select
          provider_attribute_definition_id as "attributeDefinitionId",
          display_name_translations as "displayNameTranslations",
          value_translations as "valueTranslations"
        from category.provider_attribute_definition_domain_options
        where provider_attribute_definition_id = any(${sql.array(attributeIds)})
        order by id asc
      `
    : [];

  const attributeDefinitions = attributeRows.map<AttributeDefinitionResponse>((attribute) => ({
    id: attribute.id,
    name: { translations: attribute.nameTranslations ?? {} },
    description: { translations: attribute.descriptionTranslations ?? {} },
    attributeType: attribute.attributeType,
    isRequired: attribute.isRequired,
    validationRules: attribute.validationRules ?? undefined,
    options: optionRows
      .filter((option) => option.attributeDefinitionId === attribute.id)
      .map((option) => ({
        displayName: { translations: option.displayNameTranslations ?? {} },
        value: { translations: option.valueTranslations ?? {} },
      })),
  }));

  return mapProviderType(row, attributeDefinitions);
}

export async function createProviderType(input: ProviderTypeInput): Promise<string> {
  const rows = await sql<{ id: string }[]>`
    insert into category.provider_types (
      id,
      name_translations,
      description_translations,
      is_active,
      icon_url,
      image_url,
      create_date,
      last_modified_date
    ) values (
      public.uuid_generate_v4(),
      ${sql.json(toTranslations(input.name))},
      ${sql.json(toTranslations(input.description))},
      ${input.isActive},
      ${input.iconUrl || null},
      ${input.imageUrl || null},
      now(),
      now()
    )
    returning id
  `;

  return rows[0]!.id;
}

export async function updateProviderType(input: ProviderTypeInput & { providerTypeId?: string }): Promise<boolean> {
  if (!input.providerTypeId) throw new Error("Provider type id is required.");

  const rows = await sql<{ id: string }[]>`
    update category.provider_types
    set
      name_translations = ${sql.json(toTranslations(input.name))},
      description_translations = ${sql.json(toTranslations(input.description))},
      is_active = ${input.isActive},
      icon_url = ${input.iconUrl || null},
      image_url = ${input.imageUrl || null},
      last_modified_date = now()
    where id = ${input.providerTypeId}
    returning id
  `;

  return rows.length > 0;
}

export async function deleteProviderType(providerTypeId: string): Promise<boolean> {
  const rows = await sql<{ id: string }[]>`
    delete from category.provider_types
    where id = ${providerTypeId}
    returning id
  `;

  return rows.length > 0;
}

export async function changeProviderTypeActivation(providerTypeId: string, isActive: boolean): Promise<boolean> {
  const rows = await sql<{ id: string }[]>`
    update category.provider_types
    set is_active = ${isActive}, last_modified_date = now()
    where id = ${providerTypeId}
    returning id
  `;

  return rows.length > 0;
}

export async function createProviderAttributeDefinition(
  providerTypeId: string,
  input: ProviderAttributeDefinitionCreateInput
): Promise<string> {
  return sql.begin(async (tx) => {
    const rows = await tx<{ id: string }[]>`
      insert into category.provider_attribute_definitions (
        id,
        name_translations,
        description_translations,
        attribute_type_id,
        is_required,
        validation_rules,
        provider_type_id,
        create_date,
        last_modified_date
      ) values (
        public.uuid_generate_v4(),
        ${tx.json(toTranslations(input.name))},
        ${tx.json(toTranslations(input.description))},
        ${Number(input.attributeTypeId)},
        ${input.isRequired ?? false},
        ${input.validationRules || ""},
        ${providerTypeId},
        now(),
        now()
      )
      returning id
    `;

    const id = rows[0]!.id;
    for (const option of input.options ?? []) {
      await tx`
        insert into category.provider_attribute_definition_domain_options (
          provider_attribute_definition_id,
          display_name_translations,
          value_translations
        ) values (
          ${id},
          ${tx.json(toTranslations(option.displayName))},
          ${tx.json(toTranslations(option.value))}
        )
      `;
    }
    return id;
  });
}

export async function updateProviderAttributeDefinition(
  providerTypeId: string,
  attributeDefinitionId: string,
  input: ProviderAttributeDefinitionCreateInput
): Promise<string> {
  return sql.begin(async (tx) => {
    const rows = await tx<{ id: string }[]>`
      update category.provider_attribute_definitions
      set
        name_translations = ${tx.json(toTranslations(input.name))},
        description_translations = ${tx.json(toTranslations(input.description))},
        attribute_type_id = ${Number(input.attributeTypeId)},
        is_required = ${input.isRequired ?? false},
        validation_rules = ${input.validationRules || ""},
        last_modified_date = now()
      where id = ${attributeDefinitionId}
        and provider_type_id = ${providerTypeId}
      returning id
    `;

    if (!rows[0]) throw new Error("Provider attribute definition was not found.");

    await tx`
      delete from category.provider_attribute_definition_domain_options
      where provider_attribute_definition_id = ${attributeDefinitionId}
    `;

    for (const option of input.options ?? []) {
      await tx`
        insert into category.provider_attribute_definition_domain_options (
          provider_attribute_definition_id,
          display_name_translations,
          value_translations
        ) values (
          ${attributeDefinitionId},
          ${tx.json(toTranslations(option.displayName))},
          ${tx.json(toTranslations(option.value))}
        )
      `;
    }

    return attributeDefinitionId;
  });
}

export async function removeProviderAttributeDefinition(providerTypeId: string, attributeDefinitionId: string): Promise<boolean> {
  const rows = await sql<{ id: string }[]>`
    delete from category.provider_attribute_definitions
    where id = ${attributeDefinitionId}
      and provider_type_id = ${providerTypeId}
    returning id
  `;

  return rows.length > 0;
}

import "server-only";

import sql from "@/config/database/db";
import type { BaseRequest } from "@/types/common";
import type { ApiReturnType } from "@/types/network";

import type { ProviderPolicyType, ProviderPolicyTypeMutationInput } from "../types";

const FALLBACK_LOCALE = "en-US";
const LOCALES = ["ar-SA", "de-DE", "en-US", "es-ES", "fa-IR", "fr-FR", "ku-KU", "tr-TR"] as const;
const LOCALE_ALIASES: Record<string, string> = { ar: "ar-SA", "ar-sa": "ar-SA", de: "de-DE", "de-de": "de-DE", en: "en-US", "en-us": "en-US", es: "es-ES", "es-es": "es-ES", fa: "fa-IR", "fa-ir": "fa-IR", fr: "fr-FR", "fr-fr": "fr-FR", ku: "ku-KU", "ku-ku": "ku-KU", tr: "tr-TR", "tr-tr": "tr-TR" };

type AnyRecord = Record<string, unknown>;

function success<T>(data: T): ApiReturnType<T> { return { data, error: undefined } as ApiReturnType<T>; }
function failure<T>(error: unknown): ApiReturnType<T> { return { data: undefined, error: { title: "Database error", detail: error instanceof Error ? error.message : "Unexpected database error.", status: 500 } } as ApiReturnType<T>; }
function normalizeLocale(request?: Partial<BaseRequest> | string): string { return typeof request === "string" ? request || FALLBACK_LOCALE : String((request as AnyRecord | undefined)?.locale || FALLBACK_LOCALE); }
function emptyLocalized() { return Object.fromEntries(LOCALES.map((locale) => [locale, ""])) as Record<string, string>; }
function normalizeLocaleKey(key: string) { const normalized = key.trim().replace(/_/g, "-").toLowerCase(); return LOCALE_ALIASES[normalized] || key.trim(); }
function localizedJsonOrEmpty(value: unknown): Record<string, string> {
  const result = emptyLocalized();
  if (!value || typeof value !== "object" || Array.isArray(value)) return result;
  for (const [rawKey, rawValue] of Object.entries(value as Record<string, unknown>)) {
    const key = normalizeLocaleKey(rawKey);
    if (key) result[key] = typeof rawValue === "string" ? rawValue : rawValue == null ? "" : String(rawValue);
  }
  return result;
}
function tr(columnExpression: string, locale: string) {
  const column = sql.unsafe(columnExpression);
  return sql`common.get_translation_t(case when jsonb_typeof(${column}) = 'object' then ${column} else '{}'::jsonb end, ${locale}, ${FALLBACK_LOCALE})`;
}
function jsonOrEmpty(value: unknown) { return localizedJsonOrEmpty(value); }

export async function getProviderPolicyTypes(request?: Partial<BaseRequest>): Promise<ApiReturnType<ProviderPolicyType[]>> {
  try {
    const locale = normalizeLocale(request);
    const rows = await sql<ProviderPolicyType[]>`
      select
        ppt.id::text as id,
        ppt.code,
        ppt.name_translations as "nameTranslations",
        ppt.description_translations as "descriptionTranslations",
        ${tr("ppt.name_translations", locale)} as name,
        ${tr("ppt.description_translations", locale)} as description,
        ppt.display_order as "displayOrder",
        ppt.is_active as "isActive",
        ppt.create_date::text as "createDate",
        ppt.last_modified_date::text as "lastModifiedDate",
        coalesce(policy_counts.policy_count, 0)::int as "policyCount"
      from category.provider_policy_types ppt
      left join lateral (
        select count(*) as policy_count
        from category.provider_policies pp
        where pp.provider_policy_type_id = ppt.id
      ) policy_counts on true
      order by ppt.display_order asc, ppt.code asc
    `;
    return success(rows.map((row) => ({ ...row, nameTranslations: jsonOrEmpty(row.nameTranslations), descriptionTranslations: jsonOrEmpty(row.descriptionTranslations) })));
  } catch (error) { return failure(error); }
}

export async function getProviderPolicyTypeById(id: string, request?: Partial<BaseRequest>): Promise<ApiReturnType<ProviderPolicyType>> {
  try {
    const locale = normalizeLocale(request);
    const rows = await sql<ProviderPolicyType[]>`
      select
        ppt.id::text as id,
        ppt.code,
        ppt.name_translations as "nameTranslations",
        ppt.description_translations as "descriptionTranslations",
        ${tr("ppt.name_translations", locale)} as name,
        ${tr("ppt.description_translations", locale)} as description,
        ppt.display_order as "displayOrder",
        ppt.is_active as "isActive",
        ppt.create_date::text as "createDate",
        ppt.last_modified_date::text as "lastModifiedDate",
        (select count(*)::int from category.provider_policies pp where pp.provider_policy_type_id = ppt.id) as "policyCount"
      from category.provider_policy_types ppt
      where ppt.id = ${id}
      limit 1
    `;
    const row = rows[0];
    if (!row) return { data: undefined, error: { title: "Not found", detail: "Provider policy type was not found.", status: 404 } } as ApiReturnType<ProviderPolicyType>;
    return success({ ...row, nameTranslations: jsonOrEmpty(row.nameTranslations), descriptionTranslations: jsonOrEmpty(row.descriptionTranslations) });
  } catch (error) { return failure(error); }
}

export async function createProviderPolicyType(input: ProviderPolicyTypeMutationInput): Promise<string> {
  const rows = await sql<{ id: string }[]>`
    insert into category.provider_policy_types (id, code, name_translations, description_translations, display_order, is_active, create_date, last_modified_date)
    values (public.uuid_generate_v4(), ${input.code.trim()}, ${sql.json(localizedJsonOrEmpty(input.nameTranslations))}, ${sql.json(localizedJsonOrEmpty(input.descriptionTranslations))}, ${input.displayOrder || 0}, ${input.isActive ?? true}, now(), now())
    returning id::text
  `;
  return rows[0]!.id;
}

export async function updateProviderPolicyType(input: ProviderPolicyTypeMutationInput & { id: string }): Promise<string> {
  await sql`
    update category.provider_policy_types
    set code = ${input.code.trim()},
        name_translations = ${sql.json(localizedJsonOrEmpty(input.nameTranslations))},
        description_translations = ${sql.json(localizedJsonOrEmpty(input.descriptionTranslations))},
        display_order = ${input.displayOrder || 0},
        is_active = ${input.isActive ?? true},
        last_modified_date = now()
    where id = ${input.id}
  `;
  return input.id;
}

export async function setProviderPolicyTypeActivation(id: string, isActive: boolean): Promise<boolean> {
  const rows = await sql<{ id: string }[]>`update category.provider_policy_types set is_active = ${isActive}, last_modified_date = now() where id = ${id} returning id::text`;
  return rows.length > 0;
}

export async function deleteProviderPolicyType(id: string): Promise<boolean> {
  const rows = await sql<{ id: string }[]>`delete from category.provider_policy_types where id = ${id} returning id::text`;
  return rows.length > 0;
}

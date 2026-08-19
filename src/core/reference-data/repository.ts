import "server-only";
import { sql } from "@core/db/client";
import { translationSql } from "@core/db/translations";
import type { ReferenceOption, ReferenceType } from "./types";

export async function listReferenceOptions(input: {
  type: ReferenceType;
  query?: string;
  locale?: string;
  parentCode?: string;
  selected?: string;
  limit?: number;
}): Promise<ReferenceOption[]> {
  const query = input.query?.trim() ?? "";
  const locale = input.locale || "fa-IR";
  const selected = input.selected?.trim() ?? "";
  const limit = Math.min(80, Math.max(10, input.limit ?? 40));

  if (input.type === "currency") {
    return sql<ReferenceOption[]>`
      select
        c.code as value,
        concat_ws(' · ', coalesce(nullif(c.native_name, ''), c.name), c.code, c.symbol) as label,
        c.code,
        c.name as description
      from finance.currencies c
      where c.is_active = true
        and (${query} = '' or c.code ilike '%' || ${query} || '%' or c.name ilike '%' || ${query} || '%' or coalesce(c.native_name, '') ilike '%' || ${query} || '%')
      order by case when c.code = ${selected} then 0 else 1 end, c.sort_order, c.code
      limit ${limit}
    `;
  }

  if (input.type === "country") {
    return sql<ReferenceOption[]>`
      select
        l.code as value,
        coalesce(${translationSql(sql`l.value_translations`, locale)}, l.code) as label,
        l.code,
        null::text as description
      from category.locations l
      where l.location_type_id = 1
        and (${query} = '' or l.code ilike '%' || ${query} || '%'
          or exists (select 1 from jsonb_each_text(coalesce(l.value_translations, '{}'::jsonb)) item where item.value ilike '%' || ${query} || '%'))
      order by case when lower(l.code) = lower(${selected}) then 0 else 1 end, coalesce(l.display_order, 9999), label
      limit ${limit}
    `;
  }

  const parentCode = input.parentCode?.trim() ?? "";
  return sql<ReferenceOption[]>`
    select
      l.code as value,
      coalesce(${translationSql(sql`l.value_translations`, locale)}, l.code) as label,
      l.code,
      coalesce(${translationSql(sql`parent.value_translations`, locale)}, parent.code) as description
    from category.locations l
    join category.locations parent on parent.id = l.parent_id and parent.location_type_id = 1
    where l.location_type_id = 2
      and (${parentCode} = '' or lower(parent.code) = lower(${parentCode}))
      and (${query} = '' or l.code ilike '%' || ${query} || '%'
        or exists (select 1 from jsonb_each_text(coalesce(l.value_translations, '{}'::jsonb)) item where item.value ilike '%' || ${query} || '%'))
    order by case when lower(l.code) = lower(${selected}) then 0 else 1 end, coalesce(l.display_order, 9999), label
    limit ${limit}
  `;
}

export async function referenceValueExists(input: { type: ReferenceType; value: string; parentCode?: string }) {
  const value = input.value.trim();
  if (!value) return false;
  if (input.type === "currency") {
    const rows = await sql<{ exists: boolean }[]>`select exists(select 1 from finance.currencies where is_active=true and upper(code)=upper(${value})) as exists`;
    return Boolean(rows[0]?.exists);
  }
  if (input.type === "country") {
    const rows = await sql<{ exists: boolean }[]>`select exists(select 1 from category.locations where location_type_id=1 and lower(code)=lower(${value})) as exists`;
    return Boolean(rows[0]?.exists);
  }
  const parentCode = input.parentCode?.trim() || "";
  const rows = await sql<{ exists: boolean }[]>`
    select exists(
      select 1 from category.locations city
      join category.locations country on country.id=city.parent_id and country.location_type_id=1
      where city.location_type_id=2 and lower(city.code)=lower(${value})
        and (${parentCode}='' or lower(country.code)=lower(${parentCode}))
    ) as exists
  `;
  return Boolean(rows[0]?.exists);
}

export async function requireReferenceValue(input: { type: ReferenceType; value: string; parentCode?: string; label?: string }) {
  const value = input.value.trim();
  if (!value || !(await referenceValueExists(input))) {
    throw new Error(`${input.label || input.type} is not a valid active LSevin reference.`);
  }
  return value;
}

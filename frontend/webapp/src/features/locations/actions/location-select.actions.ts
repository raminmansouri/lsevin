"use server";

import sql from "@/config/database/db";
import { z } from "zod";
import { GetLocationByIdInput, LazyOption, LazyOptionsResult, SearchLocationsInput } from "../location-select.types";


const searchLocationsSchema = z.object({
  locationTypeId: z.union([z.literal(1), z.literal(2)]),
  parentId: z.string().uuid().nullable().optional(),
  search: z.string().trim().max(100).optional().default(""),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
  locale: z.string().trim().min(1).optional().default("en"),
  fallbackLocale: z.string().trim().min(1).optional().default("en"),
});

const getLocationByIdSchema = z.object({
  id: z.string().uuid(),
  locale: z.string().trim().min(1).optional().default("en"),
  fallbackLocale: z.string().trim().min(1).optional().default("en"),
});

function localizedExpr(
  tableAlias: "l" | "p",
  locale: string,
  fallbackLocale: string,
  fallbackColumn: "code" = "code"
) {
  return sql`
    coalesce(
      nullif(${sql(tableAlias)}.value_translations ->> ${locale}, ''),
      nullif(${sql(tableAlias)}.value_translations ->> split_part(${locale}, '-', 1), ''),
      nullif(${sql(tableAlias)}.value_translations ->> ${fallbackLocale}, ''),
      nullif(${sql(tableAlias)}.value_translations ->> split_part(${fallbackLocale}, '-', 1), ''),
      ${sql(tableAlias)}.${sql(fallbackColumn)}::text
    )
  `;
}

export async function searchLocationsAction(
  rawInput: SearchLocationsInput
): Promise<LazyOptionsResult> {
  const input = searchLocationsSchema.parse(rawInput);
  const offset = (input.page - 1) * input.pageSize;
  const searchLike = `%${input.search}%`;

  const labelExpr = localizedExpr("l", input.locale, input.fallbackLocale);
  const parentLabelExpr = localizedExpr("p", input.locale, input.fallbackLocale);

  const rows = await sql<{
    id: string;
    label: string;
    code: string;
    parent_label: string | null;
  }[]>`
    select
      l.id,
      ${labelExpr} as label,
      l.code,
      case
        when l.parent_id is null then null
        else ${parentLabelExpr}
      end as parent_label
    from category.locations as l
    left join category.locations as p
      on p.id = l.parent_id
    where
      l.location_type_id = ${input.locationTypeId}
      ${
        input.locationTypeId === 2 && input.parentId
          ? sql`and l.parent_id = ${input.parentId}`
          : input.locationTypeId === 2
            ? sql`and 1 = 0`
            : sql``
      }
      ${
        input.search
          ? sql`and (
              ${labelExpr} ilike ${searchLike}
              or l.code ilike ${searchLike}
            )`
          : sql``
      }
    order by
      l.display_order asc nulls last,
      ${labelExpr} asc
    limit ${input.pageSize + 1}
    offset ${offset}
  `;

  const hasMore = rows.length > input.pageSize;
  const sliced = rows.slice(0, input.pageSize);

  return {
    items: sliced.map((row) => ({
      value: row.id,
      label: row.label,
      description: row.parent_label ?? row.code,
    })),
    hasMore,
  };
}

export async function getLocationByIdAction(
  rawInput: GetLocationByIdInput
): Promise<LazyOption | null> {
  const input = getLocationByIdSchema.parse(rawInput);

  const labelExpr = localizedExpr("l", input.locale, input.fallbackLocale);
  const parentLabelExpr = localizedExpr("p", input.locale, input.fallbackLocale);

  const rows = await sql<{
    id: string;
    label: string;
    code: string;
    parent_label: string | null;
  }[]>`
    select
      l.id,
      ${labelExpr} as label,
      l.code,
      case
        when l.parent_id is null then null
        else ${parentLabelExpr}
      end as parent_label
    from category.locations as l
    left join category.locations as p
      on p.id = l.parent_id
    where l.id = ${input.id}
    limit 1
  `;

  const row = rows[0];
  if (!row) return null;

  return {
    value: row.id,
    label: row.label,
    description: row.parent_label ?? row.code,
  };
}
import { NextRequest, NextResponse } from "next/server";
import { assertAdminPermission } from "@/lib/admin/guard";
import { getAdminDependentRelationConfig } from "@/lib/admin/extensions/dependent-relations";
// Replace this import if your postgres.js client lives elsewhere.
import { db } from "@/lib/db";

function ident(name: string) {
  return '"' + name.replaceAll('"', '""') + '"';
}

function tableRef(schema: string, table: string) {
  return db.unsafe(`${ident(schema)}.${ident(table)}`);
}

function colRef(alias: string, column: string) {
  return db.unsafe(`${alias}.${ident(column)}`);
}

function buildTextExpr(alias: string, column: string, mode: "text" | "translation", locale: string, fallbackLocale: string) {
  const ref = colRef(alias, column);
  if (mode === "translation") {
    return db`common.get_translation_t(${ref}, ${locale}, ${fallbackLocale})`;
  }
  return ref;
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const locale = req.nextUrl.searchParams.get("locale") || "en";
  const fallbackLocale = req.nextUrl.searchParams.get("fallbackLocale") || locale;
  const search = req.nextUrl.searchParams.get("search") || "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || "1"));
  const pageSize = Math.max(1, Math.min(50, Number(req.nextUrl.searchParams.get("pageSize") || "20")));
  const id = req.nextUrl.searchParams.get("id");
  const parentsRaw = req.nextUrl.searchParams.get("parents");
  const parents = parentsRaw ? JSON.parse(parentsRaw) as Array<{ field: string; value: unknown }> : [];

  if (!key) {
    return NextResponse.json({ message: "Missing key." }, { status: 400 });
  }

  const config = getAdminDependentRelationConfigFromKey(key);
  if (!config) {
    return NextResponse.json({ message: "Unknown dependent relation key." }, { status: 404 });
  }

  await assertAdminPermission(config.schema, config.table, "list");

  const labelExpr = buildTextExpr("t", config.labelColumn, config.labelMode ?? "text", locale, fallbackLocale);
  const descriptionExpr = config.descriptionColumn
    ? buildTextExpr("t", config.descriptionColumn, config.descriptionMode ?? "text", locale, fallbackLocale)
    : db`null`;

  const whereParts: any[] = [];

  if (id) {
    whereParts.push(db`${colRef("t", config.valueColumn)} = ${id}`);
  }

  for (const filter of config.staticFilters ?? []) {
    const ref = colRef("t", filter.column);
    if (filter.op === "true") whereParts.push(db`${ref} = true`);
    else if (filter.op === "false") whereParts.push(db`${ref} = false`);
    else whereParts.push(db`${ref} = ${filter.value as any}`);
  }

  for (const parentFilter of config.parentFilters ?? []) {
    const incoming = parents.find((item) => item.field === parentFilter.targetColumn);
    const value = incoming?.value;
    if (value === undefined || value === null || value === "") {
      if (parentFilter.required !== false && !id) {
        return NextResponse.json({ items: [], hasMore: false });
      }
      continue;
    }
    whereParts.push(db`${colRef("t", parentFilter.targetColumn)} = ${value as any}`);
  }

  if (search) {
    const searchLike = `%${search}%`;
    const exprs = (config.searchColumns?.length ? config.searchColumns : [config.labelColumn]).map((column) => {
      return db`${buildTextExpr("t", column, column === config.labelColumn ? config.labelMode ?? "text" : "translation", locale, fallbackLocale)} ilike ${searchLike}`;
    });
    whereParts.push(db`(${db.join(exprs, db` or `)})`);
  }

  const whereSql = whereParts.length ? db`where ${db.join(whereParts, db` and `)}` : db``;

  const orderByExpr = config.orderBy
    ? buildTextExpr("t", config.orderBy.column, config.orderBy.mode ?? "text", locale, fallbackLocale)
    : labelExpr;
  const orderDir = config.orderBy?.direction === "desc" ? db.unsafe("desc") : db.unsafe("asc");

  const rows = await db<Array<{ value: string; label: string; description: string | null }>>`
    select
      ${colRef("t", config.valueColumn)}::text as value,
      ${labelExpr}::text as label,
      ${descriptionExpr}::text as description
    from ${tableRef(config.schema, config.table)} as t
    ${whereSql}
    order by ${orderByExpr} ${orderDir}
    limit ${id ? 1 : pageSize + 1}
    offset ${id ? 0 : (page - 1) * pageSize}
  `;

  if (id) {
    return NextResponse.json({ item: rows[0] ?? null });
  }

  const hasMore = rows.length > pageSize;
  return NextResponse.json({ items: rows.slice(0, pageSize), hasMore });
}

function getAdminDependentRelationConfigFromKey(key: string) {
  const [schema, table, column] = key.split(".");
  if (!schema || !table || !column) return null;
  return getAdminDependentRelationConfig(schema, table, column);
}

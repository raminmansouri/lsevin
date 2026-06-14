import { NextRequest, NextResponse } from "next/server";
import { assertAdminPermission } from "@/lib/admin/guard";
import { getAdminDependentRelationConfigByKey } from "@/lib/admin/extensions/dependent-relations";
import sql from "@/config/database/db";

function ident(name: string) {
  return '"' + name.replaceAll('"', '""') + '"';
}

function tableRef(schema: string, table: string) {
  return sql.unsafe(`${ident(schema)}.${ident(table)}`);
}

function colRef(alias: string, column: string) {
  return sql.unsafe(`${alias}.${ident(column)}`);
}

function joinFragments(parts: any[], separator: any) {
  if (!parts.length) return sql``;

  return parts.slice(1).reduce((acc, part) => {
    return sql`${acc}${separator}${part}`;
  }, parts[0]);
}

function inferColumnMode(column: string): "text" | "translation" {
  return column.endsWith("_translations") ? "translation" : "text";
}

function buildTextExpr(
  alias: string,
  column: string,
  mode: "text" | "translation",
  locale: string,
  fallbackLocale: string
) {
  const ref = colRef(alias, column);

  if (mode === "translation") {
    return sql`common.get_translation_t(${ref}, ${locale}, ${fallbackLocale})`;
  }

  return ref;
}

function getAdminDependentRelationConfigFromKey(key: string) {
  return getAdminDependentRelationConfigByKey(key);
}

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get("key");
  const locale = req.nextUrl.searchParams.get("locale") || "fa";
  const fallbackLocale = req.nextUrl.searchParams.get("fallbackLocale") || locale;
  const search = req.nextUrl.searchParams.get("search") || "";
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page") || "1"));
  const pageSize = Math.max(
    1,
    Math.min(50, Number(req.nextUrl.searchParams.get("pageSize") || "20"))
  );
  const id = req.nextUrl.searchParams.get("id");
  const parentsRaw = req.nextUrl.searchParams.get("parents");
  const parents = parentsRaw
    ? (JSON.parse(parentsRaw) as Array<{ field: string; value: unknown }>)
    : [];

  if (!key) {
    return NextResponse.json({ message: "Missing key." }, { status: 400 });
  }

  const config = getAdminDependentRelationConfigFromKey(key);

  if (!config) {
    return NextResponse.json(
      { message: "Unknown dependent relation key." },
      { status: 404 }
    );
  }

  await assertAdminPermission(config.schema, config.table, "list");

  const labelExpr = buildTextExpr(
    "t",
    config.labelColumn,
    config.labelMode ?? inferColumnMode(config.labelColumn),
    locale,
    fallbackLocale
  );

  const descriptionExpr = config.descriptionColumn
    ? buildTextExpr(
        "t",
        config.descriptionColumn,
        config.descriptionMode ?? inferColumnMode(config.descriptionColumn),
        locale,
        fallbackLocale
      )
    : sql`null`;

  const rawColumns = Array.from(
    new Set(
      (config.parentFilters ?? [])
        .map((item) => item.targetColumn)
        .filter(Boolean)
    )
  );

  const whereParts: any[] = [];

  if (id) {
    whereParts.push(sql`${colRef("t", config.valueColumn)} = ${id}`);
  }

  for (const filter of config.staticFilters ?? []) {
    const ref = colRef("t", filter.column);

    if (filter.op === "true") {
      whereParts.push(sql`${ref} = true`);
    } else if (filter.op === "false") {
      whereParts.push(sql`${ref} = false`);
    } else if (filter.op === "neq") {
      whereParts.push(sql`${ref} <> ${filter.value as any}`);
    } else {
      whereParts.push(sql`${ref} = ${filter.value as any}`);
    }
  }

  for (const parentFilter of config.parentFilters ?? []) {
    const incoming =
      parents.find((item) => item.field === parentFilter.parentField) ??
      parents.find((item) => item.field === parentFilter.targetColumn);

    const value = incoming?.value;

    if (value === undefined || value === null || value === "") {
      if (parentFilter.required !== false && !id) {
        return NextResponse.json({ items: [], hasMore: false });
      }
      continue;
    }

    whereParts.push(
      sql`${colRef("t", parentFilter.targetColumn)} = ${value as any}`
    );
  }

  if (search) {
    const searchLike = `%${search}%`;

    const exprs = (
      config.searchColumns?.length ? config.searchColumns : [config.labelColumn]
    ).map((column) => {
      const mode =
        column === config.labelColumn
          ? config.labelMode ?? inferColumnMode(column)
          : inferColumnMode(column);

      return sql`${buildTextExpr(
        "t",
        column,
        mode,
        locale,
        fallbackLocale
      )} ilike ${searchLike}`;
    });

    whereParts.push(sql`(${joinFragments(exprs, sql` or `)})`);
  }

  const whereSql = whereParts.length
    ? sql`where ${joinFragments(whereParts, sql` and `)}`
    : sql``;

  const orderByExpr = config.orderBy
    ? buildTextExpr(
        "t",
        config.orderBy.column,
        config.orderBy.mode ?? inferColumnMode(config.orderBy.column),
        locale,
        fallbackLocale
      )
    : labelExpr;

  const orderDir =
    config.orderBy?.direction === "desc"
      ? sql.unsafe("desc")
      : sql.unsafe("asc");

  const rawSelects = rawColumns.map((column) => {
    return sql`${colRef("t", column)}::text as ${sql.unsafe(
      ident(`__raw__${column}`)
    )}`;
  });

  const selectList = joinFragments(
    [
      sql`${colRef("t", config.valueColumn)}::text as value`,
      sql`${labelExpr}::text as label`,
      sql`${descriptionExpr}::text as description`,
      ...rawSelects,
    ],
    sql`, `
  );

  const rows = await sql<any[]>`
    select ${selectList}
    from ${tableRef(config.schema, config.table)} as t
    ${whereSql}
    order by ${orderByExpr} ${orderDir}
    limit ${id ? 1 : pageSize + 1}
    offset ${id ? 0 : (page - 1) * pageSize}
  `;

  const mapped = rows.map((row) => {
    const raw = Object.fromEntries(
      rawColumns.map((column) => [column, row[`__raw__${column}`] ?? null])
    );

    return {
      value: row.value,
      label: row.label,
      description: row.description,
      raw,
    };
  });

  if (id) {
    return NextResponse.json({ item: mapped[0] ?? null });
  }

  const hasMore = mapped.length > pageSize;

  return NextResponse.json({
    items: mapped.slice(0, pageSize),
    hasMore,
  });
}
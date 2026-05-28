import { NextRequest, NextResponse } from "next/server";
import { assertAdminPermission } from "@/lib/admin/guard";
import { getDirectTableOptions, getRelationOptions } from "@/lib/admin/list-query";
import { getResolvedTableDefinition } from "@/lib/admin/metadata";

export async function GET(req: NextRequest) {
  const schema = req.nextUrl.searchParams.get("schema");
  const table = req.nextUrl.searchParams.get("table");
  const column = req.nextUrl.searchParams.get("column");
  const locale = req.nextUrl.searchParams.get("locale") || "en";
  const search = req.nextUrl.searchParams.get("search") || "";

  if (!schema || !table || !column) {
    return NextResponse.json({ items: [] }, { status: 400 });
  }

  const definition = await getResolvedTableDefinition({ schema, table });
  const field = definition?.fields.find((x) => x.columnName === column);

  if (field?.manyToMany) {
    await assertAdminPermission(field.manyToMany.targetSchema, field.manyToMany.targetTable, "list");

    const items = await getDirectTableOptions({
      schema: field.manyToMany.targetSchema,
      table: field.manyToMany.targetTable,
      displayField: field.manyToMany.targetDisplayField ?? "id",
      search,
      locale,
    }).catch(() => []);

    return NextResponse.json({ items });
  }

  await assertAdminPermission(schema, table, "list");
  const items = await getRelationOptions({ schema, table, column, search, locale });
  return NextResponse.json({ items });
}

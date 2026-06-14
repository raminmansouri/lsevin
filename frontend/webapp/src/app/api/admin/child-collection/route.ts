import { NextRequest, NextResponse } from "next/server";
import { assertAdminPermission } from "@/lib/admin/guard";
import { getLocaleConfig } from "@/lib/admin/metadata";
import { getParentLinkValue, resolveChildCollection } from "@/lib/admin/child-relations";
import { runListQuery } from "@/lib/admin/list-query";

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parentSchema = searchParams.get("parentSchema");
    const parentTable = searchParams.get("parentTable");
    const parentRecordId = searchParams.get("parentRecordId");
    const childSchema = searchParams.get("childSchema");
    const childTable = searchParams.get("childTable");
    const foreignKeyColumn = searchParams.get("foreignKeyColumn") ?? undefined;
    const q = searchParams.get("q") ?? "";
    const page = parsePositiveInt(searchParams.get("page"), 1);
    const pageSize = parsePositiveInt(searchParams.get("pageSize"), 10);
    const localeRaw = searchParams.get("locale") ?? "";
    const localeConfig = getLocaleConfig();
    const locale = localeConfig.supported.includes(localeRaw)
      ? localeRaw
      : localeConfig.defaultLocale;

    if (!parentSchema || !parentTable || !parentRecordId || !childSchema || !childTable) {
      return NextResponse.json({ ok: false, message: "Missing child collection parameters." }, { status: 400 });
    }

    await assertAdminPermission(childSchema, childTable, "list");
    const { collection } = await resolveChildCollection({
      parentSchema,
      parentTable,
      childSchema,
      childTable,
      foreignKeyColumn,
    });

    const parentLink = await getParentLinkValue({
      parentSchema,
      parentTable,
      parentRecordId,
      collection,
    });

    const result = await runListQuery(
      { schema: childSchema, table: childTable },
      {
        page,
        pageSize,
        q,
        sortField: collection.defaultSort?.field,
        sortDirection: collection.defaultSort?.direction,
        filters: [
  {
    field: collection.foreignKeyColumn,
    op: "eq",
    value: parentLink.value,
    mode: "raw",
  },
],
      },
      locale
    );

    return NextResponse.json({ ok: true, result });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message ?? "Failed to load child collection." },
      { status: 500 }
    );
  }
}

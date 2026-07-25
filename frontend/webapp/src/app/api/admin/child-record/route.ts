import { NextRequest, NextResponse } from "next/server";
import { assertAdminPermission } from "@/lib/admin/guard";
import { assertChildRecordBelongsToParent } from "@/lib/admin/child-relations";
import { requireApiAdmin } from "@/lib/auth/api-guard";

export async function GET(request: NextRequest) {
  try {
    const auth = await requireApiAdmin();
    if (auth instanceof NextResponse) return auth;

    const { searchParams } = new URL(request.url);
    const parentSchema = searchParams.get("parentSchema");
    const parentTable = searchParams.get("parentTable");
    const parentRecordId = searchParams.get("parentRecordId");
    const childSchema = searchParams.get("childSchema");
    const childTable = searchParams.get("childTable");
    const childRecordId = searchParams.get("childRecordId");
    const foreignKeyColumn = searchParams.get("foreignKeyColumn") ?? undefined;

    if (!parentSchema || !parentTable || !parentRecordId || !childSchema || !childTable || !childRecordId) {
      return NextResponse.json({ ok: false, message: "Missing child record parameters." }, { status: 400 });
    }

    await assertAdminPermission(childSchema, childTable, "single");
    const { childRecord } = await assertChildRecordBelongsToParent({
      parentSchema,
      parentTable,
      parentRecordId,
      childSchema,
      childTable,
      childRecordId,
      foreignKeyColumn,
    });

    return NextResponse.json({ ok: true, record: childRecord });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, message: error?.message ?? "Failed to load child record." },
      { status: 500 }
    );
  }
}

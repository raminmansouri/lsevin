import { NextRequest, NextResponse } from "next/server";

import { requireApiAdmin } from "@/lib/auth/api-guard";
import sql from "@/config/database/db";

export async function GET(request: NextRequest) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const search = (searchParams.get("search") || "").trim();
  const page = Math.max(1, Number(searchParams.get("page") || 1));
  const pageSize = Math.min(50, Math.max(1, Number(searchParams.get("pageSize") || 20)));
  const offset = (page - 1) * pageSize;

  const pattern = `%${search.replace(/[%_]/g, (m) => `\\${m}`)}%`;

  const rows = await sql<{ id: string; email: string | null; userName: string | null; phoneNumber: string | null }[]>`
    select id::text as id, email, user_name as "userName", phone_number as "phoneNumber"
    from identity.asp_net_users
    where ${search ? sql`(email ilike ${pattern} or user_name ilike ${pattern} or phone_number ilike ${pattern})` : sql`true`}
    order by email asc nulls last
    limit ${pageSize + 1} offset ${offset}
  `;

  const hasMore = rows.length > pageSize;
  const items = rows.slice(0, pageSize).map((row) => ({
    value: row.id,
    label: row.email || row.userName || row.phoneNumber || row.id,
    description: [row.phoneNumber, row.userName].filter(Boolean).join(" · ") || null,
  }));

  return NextResponse.json({ items, hasMore });
}

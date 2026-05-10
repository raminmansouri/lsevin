import { NextRequest, NextResponse } from "next/server";

import { searchStaffLookupOptions } from "@/features/staff/lib/staff-db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const resource = searchParams.get("resource") || searchParams.get("type") || "";
  const locale = searchParams.get("locale") || "en-US";
  const q = searchParams.get("q") || searchParams.get("search") || "";
  const page = Number(searchParams.get("page") || "1");
  const pageSize = Number(searchParams.get("pageSize") || "30");

  const result = await searchStaffLookupOptions({
    resource,
    locale,
    q,
    page,
    pageSize,
  });

  return NextResponse.json(result);
}

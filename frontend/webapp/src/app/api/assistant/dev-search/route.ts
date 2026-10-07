import { NextRequest, NextResponse } from "next/server";

import { localeToHeader } from "@/config/locales";
import { createSearchServicesTool } from "@/features/assistant/tools/search-services";
import type { LocaleTypes } from "@/types/common";

// TEMPORARY dev-only endpoint to test the assistant tool without a model. Delete before release.
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const sp = request.nextUrl.searchParams;
  const locale = sp.get("locale") ?? "fa";
  const searchTool = createSearchServicesTool(localeToHeader(locale as LocaleTypes) || "fa-IR");
  const output = await searchTool.invoke({
    query: sp.get("q") ?? "",
    city: sp.get("city") ?? undefined,
    limit: 5,
  });
  return new NextResponse(output as string, { headers: { "Content-Type": "application/json" } });
}

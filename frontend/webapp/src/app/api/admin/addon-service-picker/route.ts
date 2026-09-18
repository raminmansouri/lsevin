import { NextRequest, NextResponse } from "next/server";

import { searchProviderServicesForAddonPicker } from "@/features/service-relations/server/repository";
import { requireApiAdmin } from "@/lib/auth/api-guard";

function toPositiveInt(value: string | null, fallback: number, max: number) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return fallback;
  return Math.min(parsed, max);
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const { searchParams } = new URL(request.url);
  const addonId = searchParams.get("addonId")?.trim();
  if (!addonId) {
    return NextResponse.json({ error: "addonId is required." }, { status: 400 });
  }

  const result = await searchProviderServicesForAddonPicker({
    addonId,
    query: searchParams.get("q") || "",
    page: toPositiveInt(searchParams.get("page"), 1, 100000),
    pageSize: toPositiveInt(searchParams.get("pageSize"), 20, 50),
    locale: searchParams.get("locale") || "fa-IR",
  });

  return NextResponse.json(result);
}

import { NextRequest, NextResponse } from "next/server";

import {
  searchAdminProviderLookupOptions,
} from "@/features/service-providers/db/admin-service-providers.queries";
import type { AdminLookupType } from "@/features/service-providers/db/admin-service-providers.queries";
import { requireApiAdmin } from "@/lib/auth/api-guard";


const VALID_TYPES = new Set<AdminLookupType>([
  "providerTypes",
  "grades",
  "countries",
  "cities",
  "categories",
  "serviceDefinitions",
  "staff",
  "providers",
  "providerServices",
  "attributeDefinitions",
  "requestStatuses",
  "policyTypes",
  "currencies",
  "addons",
]);

function toPositiveInt(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiAdmin();
  if (auth instanceof NextResponse) return auth;

  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get("type") as AdminLookupType | null;

  if (!type || !VALID_TYPES.has(type)) {
    return NextResponse.json(
      { error: "Invalid lookup type." },
      { status: 400 }
    );
  }

  const result = await searchAdminProviderLookupOptions({
    type,
    locale: searchParams.get("locale") || "fa-IR",
    query: searchParams.get("q") || "",
    page: toPositiveInt(searchParams.get("page"), 1),
    pageSize: toPositiveInt(searchParams.get("pageSize"), 30),
    parentId: searchParams.get("parentId"),
    providerTypeId: searchParams.get("providerTypeId"),
    categoryId: searchParams.get("categoryId"),
    excludeProviderId: searchParams.get("excludeProviderId"),
  });

  if (result.error) {
    return NextResponse.json(
      { error: result.error.title, detail: result.error.detail },
      { status: result.error.status || 500 }
    );
  }

  return NextResponse.json(result.data);
}

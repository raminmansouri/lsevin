import { NextRequest, NextResponse } from "next/server";

import {
  getAvailabilityLookupOptionById,
  searchAvailabilityLookupOptions,
  type AvailabilityLookupType,
} from "@/features/booking-pro/server/generic-availability-admin.repository";

function intParam(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function clean(value: string | null) {
  const text = String(value || "").trim();
  return text.length ? text : null;
}

const LOOKUP_TYPES = new Set<AvailabilityLookupType>([
  "providers",
  "providerServices",
  "serviceDefinitions",
  "staff",
  "providerStaff",
  "resources",
  "targets",
]);

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const lookupType = clean(params.get("lookupType")) as AvailabilityLookupType | null;

  if (!lookupType || !LOOKUP_TYPES.has(lookupType)) {
    return NextResponse.json({ error: "Invalid lookupType." }, { status: 400 });
  }

  const input = {
    lookupType,
    locale: clean(params.get("locale")) || "fa-IR",
    search: clean(params.get("search")),
    id: clean(params.get("id")),
    page: intParam(params.get("page"), 1),
    pageSize: intParam(params.get("pageSize"), 20),
    targetType: clean(params.get("targetType")),
    serviceProviderId: clean(params.get("serviceProviderId")),
    providerServiceId: clean(params.get("providerServiceId")),
    resourceId: clean(params.get("resourceId")),
  };

  if (input.id) {
    const item = await getAvailabilityLookupOptionById(input);
    return NextResponse.json({ item });
  }

  const result = await searchAvailabilityLookupOptions(input);
  return NextResponse.json(result);
}

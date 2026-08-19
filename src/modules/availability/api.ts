import { portalLocaleHeader } from "@core/i18n/config";
import type { ModuleApiProps } from "@core/modules/types";
import { searchAvailabilityStaffOptions } from "./repository";

export async function handleAvailabilityStaffOptions({ request, params }: ModuleApiProps) {
  const url = new URL(request.url);
  const items = await searchAvailabilityStaffOptions({
    providerId: params.providerId,
    query: url.searchParams.get("q") || "",
    selected: url.searchParams.get("selected") || "",
    locale: portalLocaleHeader(url.searchParams.get("locale")),
    limit: Number(url.searchParams.get("limit") || 30),
  });
  return Response.json({ items });
}

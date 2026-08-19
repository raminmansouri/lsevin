import { portalLocaleHeader } from "@core/i18n/config";
import type { ModuleApiProps } from "@core/modules/types";
import { searchShareableStaff } from "./repository";

export async function handleMediaStaffOptions({ request, params }: ModuleApiProps) {
  const url = new URL(request.url);
  return Response.json({ items: await searchShareableStaff({
    providerId: params.providerId,
    query: url.searchParams.get("q") || "",
    selected: url.searchParams.get("selected") || "",
    locale: portalLocaleHeader(url.searchParams.get("locale")),
    limit: Number(url.searchParams.get("limit") || 30),
  }) });
}

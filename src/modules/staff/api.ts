import { portalLocaleHeader } from "@core/i18n/config";
import type { ModuleApiProps } from "@core/modules/types";
import { searchStaffProviderOptions } from "./repository";

export async function handleAdminStaffProviderOptions({ request }: ModuleApiProps) {
  const url = new URL(request.url);
  return Response.json({ items: await searchStaffProviderOptions({
    query: url.searchParams.get("q") || "",
    selected: url.searchParams.get("selected") || "",
    locale: portalLocaleHeader(url.searchParams.get("locale")),
    limit: Number(url.searchParams.get("limit") || 30),
  }) });
}

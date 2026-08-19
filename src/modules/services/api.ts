import { portalLocaleHeader } from "@core/i18n/config";
import type { ModuleApiProps } from "@core/modules/types";
import { searchServiceDefinitionOptions, searchServiceProviderOptions } from "./repository";

function searchInput(request: Request) {
  const url = new URL(request.url);
  return {
    query: url.searchParams.get("q") || "",
    selected: url.searchParams.get("selected") || "",
    locale: portalLocaleHeader(url.searchParams.get("locale")),
    limit: Number(url.searchParams.get("limit") || 30),
  };
}

export async function handleServiceDefinitionOptions({ request }: ModuleApiProps) {
  return Response.json({ items: await searchServiceDefinitionOptions(searchInput(request)) });
}

export async function handleAdminServiceProviderOptions({ request }: ModuleApiProps) {
  return Response.json({ items: await searchServiceProviderOptions(searchInput(request)) });
}

import type { ModuleApiProps } from "@core/modules/types";
import { searchFinanceStaffOptions, searchPayoutAccountOptions } from "./repository";

export async function handlePayoutAccountOptions({ request, params }: ModuleApiProps) {
  const url = new URL(request.url);
  return Response.json({ items: await searchPayoutAccountOptions({
    providerId: params.providerId,
    query: url.searchParams.get("q") || "",
    selected: url.searchParams.get("selected") || "",
    limit: Number(url.searchParams.get("limit") || 30),
  }) });
}


export async function handleFinanceStaffOptions({ request, params }: ModuleApiProps) {
  const url = new URL(request.url);
  return Response.json({ items: await searchFinanceStaffOptions({
    providerId: params.providerId,
    query: url.searchParams.get("q") || "",
    selected: url.searchParams.get("selected") || "",
    limit: Number(url.searchParams.get("limit") || 30),
  }) });
}

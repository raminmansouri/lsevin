"use server";

import { getProviderPageDataFromDbCached } from "@/features/service-providers/server/provider-page.repository.cached";
import type { ProviderPageQueryInput } from "@/features/service-providers/server/provider-page.repository";

export async function getProviderPageAction(input: ProviderPageQueryInput) {
  return getProviderPageDataFromDbCached(input);
}

"use server";

import { getProviderPageDataFromDbCached } from "@/features/service-providers/server/provider-page.repository.cached";
import type { ProviderPageQueryInput } from "@/features/service-providers/server/provider-page.repository";

export async function getProviderPageAction(
  input: ProviderPageQueryInput,
): ReturnType<typeof getProviderPageDataFromDbCached> {
  try {
    return await getProviderPageDataFromDbCached(input);
  } catch {
    // Keep the action contract while the cache rejects transient failures.
    return { error: { status: 500, title: "Could not load provider page." } };
  }
}

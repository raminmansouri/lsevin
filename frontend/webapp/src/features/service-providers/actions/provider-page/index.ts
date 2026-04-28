"use server";

import {
  getProviderPageDataFromDb,
  type ProviderPageQueryInput,
} from "@/features/service-providers/server/provider-page.repository";

export async function getProviderPageAction(input: ProviderPageQueryInput) {
  return getProviderPageDataFromDb(input);
}

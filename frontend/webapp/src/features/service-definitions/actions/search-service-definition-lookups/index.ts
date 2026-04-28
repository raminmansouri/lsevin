"use server";

import { getServiceDefinitionLookupOptionsFromDb } from "../../db/service-definition-repository";
import type {
  ServiceDefinitionLookupOption,
  ServiceDefinitionLookupType,
} from "../../db/service-definition-repository";

export async function searchServiceDefinitionLookupOptionsForClient({
  lookupType,
  search = "",
  locale = "en",
  limit = 30,
}: {
  lookupType: ServiceDefinitionLookupType;
  search?: string;
  locale?: string;
  limit?: number;
}): Promise<ServiceDefinitionLookupOption[]> {
  return getServiceDefinitionLookupOptionsFromDb({ lookupType, search, locale, limit });
}

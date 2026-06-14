"use server";

import { getServiceDefinitionByIdFromDb } from "../../db/service-definition-repository";
import { ServiceDefinitionDetails } from "../../types/service-definition";

export async function getServiceDefinitionDetailsForClient(
  serviceDefinitionId: string,
  locale: string
): Promise<ServiceDefinitionDetails> {
  const result = await getServiceDefinitionByIdFromDb(serviceDefinitionId, locale);
  if (result.error || !result.data) {
    throw result.error || new Error("Service definition not found.");
  }
  return result.data;
}

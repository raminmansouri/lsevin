"use server";

import {
  getServiceDefinitionsAllLocalesFromDb,
  getServiceDefinitionsFromDb,
} from "../../db/service-definition-repository";
import {
  ServiceDefinition,
  ServiceDefinitionWithAllLocales,
} from "../../types/service-definition";
import { PaginatedResult } from "@/types/network";

export async function searchServiceDefinitionsForClient(
  search: string,
  page: number,
  locale: string
): Promise<PaginatedResult<ServiceDefinition>> {
  const result = await getServiceDefinitionsFromDb(locale, {
    Search: search,
    PageNumber: page,
  } as never);
  if (result.error || !result.data) throw result.error || new Error("Search failed.");
  return result.data;
}

export async function searchServiceDefinitionsAllLocalesForClient(
  search: string,
  page: number,
  locale: string
): Promise<PaginatedResult<ServiceDefinitionWithAllLocales>> {
  const result = await getServiceDefinitionsAllLocalesFromDb(locale, {
    Search: search,
    PageNumber: page,
  } as never);
  if (result.error || !result.data) throw result.error || new Error("Search failed.");
  return result.data;
}

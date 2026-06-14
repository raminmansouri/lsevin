import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getServiceDefinitionIdTag } from "../../db/cache";
import { getServiceDefinitionByIdFromDb } from "../../db/service-definition-repository";
import { ServiceDefinitionDetails } from "../../types/service-definition";

export const getServiceDefinitionById = async (
  id: string,
  request: BaseRequest
): Promise<ApiReturnType<ServiceDefinitionDetails>> => {
  "use cache: remote";
  cacheTag(getServiceDefinitionIdTag(id));
  cacheLife("default");

  return getServiceDefinitionByIdFromDb(id, request.locale);
};

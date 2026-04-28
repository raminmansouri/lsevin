
import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { BaseRequest } from "@/types/common";
import { FilterParams } from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getProviderTypeGlobalTag } from "../../db/cache";
import { listProviderTypes, providerTypeProblem } from "../../db/provider-types.repository";
import { ProviderTypeFiltered } from "../../types/provider-type";

export const getProviderTypes = async (
  request: BaseRequest,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<ProviderTypeFiltered>>> => {
  "use cache: remote";
  cacheTag(getProviderTypeGlobalTag());
  cacheLife("default");

  try {
    const data = await listProviderTypes(params as Record<string, unknown>, request.locale);
    return { data, error: undefined } as ApiReturnType<PaginatedResult<ProviderTypeFiltered>>;
  } catch (error) {
    return { data: undefined, error: providerTypeProblem(error) } as ApiReturnType<PaginatedResult<ProviderTypeFiltered>>;
  }
};

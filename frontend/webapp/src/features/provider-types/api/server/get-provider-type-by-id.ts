
import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getProviderTypeIdTag } from "../../db/cache";
import { getProviderType, providerTypeProblem } from "../../db/provider-types.repository";
import { ProviderType } from "../../types/provider-type";

export const getProviderTypeById = async (
  id: string,
  _request: BaseRequest
): Promise<ApiReturnType<ProviderType>> => {
  "use cache: remote";
  cacheTag(getProviderTypeIdTag(id));
  cacheLife("default");

  try {
    const data = await getProviderType(id);
    if (!data) {
      return {
        data: undefined,
        error: { title: "Not found", detail: "Provider type was not found.", status: 404 },
      } as ApiReturnType<ProviderType>;
    }
    return { data, error: undefined } as ApiReturnType<ProviderType>;
  } catch (error) {
    return { data: undefined, error: providerTypeProblem(error) } as ApiReturnType<ProviderType>;
  }
};

import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getServiceProviderGlobalTag } from "../../db/cache";
import { AvailableCountry } from "../../types";

export const getAvailableCountries = async (
  request: BaseRequest
): Promise<ApiReturnType<AvailableCountry[]>> => {
  "use cache: remote";
  cacheLife("default");
  cacheTag(getServiceProviderGlobalTag());

  return readData<AvailableCountry[]>(
    `${CATEGORY_MODULE_BASE_PATH}/service-providers/available-countries`,
    { ...request }
  );
};

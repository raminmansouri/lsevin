import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { ILocationCity } from "@/features/shared/types/location";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

export const getAllCitiesByCountry = async (
  request: BaseRequest,
  countryCode: string
): Promise<ApiReturnType<ILocationCity[]>> => {
  "use cache: remote";
  cacheLife("default");
  cacheTag(`all-cities-${countryCode}`);
  const response = await readData<ILocationCity[]>(
    `${CATEGORY_MODULE_BASE_PATH}/locations/all-cities/${countryCode}`,
    {
      ...request,
    }
  );
  return response;
};

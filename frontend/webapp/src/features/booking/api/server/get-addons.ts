/* server/get-addons.ts */
import "server-only";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";
import { ADMIN_BASE_PATH, CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";

export interface Addon {
  id: string;
  name: string;
  description: string;
  price: number;
  icon: any;          // server never sends a JSX component
  popular?: boolean;
  details: string[];
}

export interface GetAddonsResponse {
  addons: Addon[];
}

export const getAddons = async (
  request: BaseRequest,
  providerId,
serviceId,
specialistId
): Promise<ApiReturnType<GetAddonsResponse>> => {
  "use cache"
  cacheTag("booking-getAddons");
  cacheLife("default");

   const searchParams = new URLSearchParams();
    if (providerId) {
        searchParams.set("providerId", '');
    } if (serviceId) {
        searchParams.set("serviceId", '');
    } if (specialistId) {
        searchParams.set("specialistId", '');
    } 
    
  const response = await readData<GetAddonsResponse>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/booking/GetAddOns?${searchParams.toString()}`,
    { ...request }
  );
  return response;
};

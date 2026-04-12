/* server/get-addons.ts */
import "server-only";
import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

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
  request: BaseRequest
): Promise<ApiReturnType<GetAddonsResponse>> => {
  cacheTag("booking-getAddons");
  cacheLife("default");
  const response = await readData<GetAddonsResponse>(
    "/booking/getAddons",
    { ...request }
  );
  return response;
};

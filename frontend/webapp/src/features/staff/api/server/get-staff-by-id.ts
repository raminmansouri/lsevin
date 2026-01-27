import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

import { getStaffIdTag } from "../../db/cache";
import { StaffDetails } from "../../types";

export const getStaffById = async (
  id: string,
  request: BaseRequest
): Promise<ApiReturnType<StaffDetails>> => {
  "use cache: remote";
  cacheTag(getStaffIdTag(id));
  cacheLife("default");

  const response = await readData<StaffDetails>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/staff/${id}`,
    {
      ...request,
    }
  );
  return response;
};

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

import { getCategoryIdTag } from "../../db/cache";
import { CategoryDetails } from "../../types/category";

export const getCategoryById = async (
  id: string,
  request: BaseRequest
): Promise<ApiReturnType<CategoryDetails>> => {
  "use cache: remote";
  cacheTag(getCategoryIdTag(id));
  cacheLife("default");

  const response = await readData<CategoryDetails>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/categories/${id}`,
    {
      ...request,
    }
  );
  return response;
};

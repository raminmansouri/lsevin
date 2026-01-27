import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import { readData } from "@/config/http/http-service.server";
import { getUserDocumentsTag } from "@/features/shared/db/cache";
import { CUSTOMER_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { IUserDocuments } from "@/features/shared/types/user";
import { BaseRequest } from "@/types/common";
import { ApiReturnType } from "@/types/network";

export const getUserDocuments = async (
  request: BaseRequest
): Promise<ApiReturnType<IUserDocuments[]>> => {
  "use cache: remote";
  cacheTag(getUserDocumentsTag(request.userId!));
  cacheLife("default");
  const response = await readData<IUserDocuments[]>(
    `${CUSTOMER_MODULE_BASE_PATH}/customer/documents`,
    {
      ...request,
    }
  );

  return response;
};

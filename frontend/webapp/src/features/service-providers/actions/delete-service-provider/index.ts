"use server";

import { deleteData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateServiceProviderCache } from "../../db/cache";
import { DeleteServiceProviderActionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { serviceProviderId } = input;
  const { data, error } = await deleteData(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-providers/${serviceProviderId}`,
    undefined,
    {
      token,
      locale,
    }
  );

  if (data !== undefined) {
    revalidateServiceProviderCache(serviceProviderId, userId);
    return {
      data: true,
      error: error,
    };
  }

  return {
    data: undefined,
    error: error,
  };
};

export const deleteServiceProviderAction = createAuthenticatedSafeAction(
  DeleteServiceProviderActionSchema,
  handler
);

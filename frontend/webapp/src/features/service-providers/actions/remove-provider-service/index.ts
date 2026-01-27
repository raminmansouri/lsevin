"use server";

import { deleteData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateServiceProviderCache } from "../../db/cache";
import { removeProviderServiceSchema } from "./schema";
import { InputType, OutputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { serviceProviderId, serviceId } = input;

  const { data, error } = await deleteData<{}, OutputType>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-providers/${serviceProviderId}/services/${serviceId}`,
    undefined,
    { locale, token }
  );

  if (data) {
    revalidateServiceProviderCache(serviceProviderId, userId);
    return { data, error: undefined };
  }

  return {
    data: undefined,
    error: error,
    payload: input,
  };
};

export const removeProviderService = createAuthenticatedSafeAction(
  removeProviderServiceSchema,
  handler,
  { adminRequired: true }
);

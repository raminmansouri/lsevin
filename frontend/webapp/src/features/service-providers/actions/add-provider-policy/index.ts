"use server";

import { postData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateServiceProviderCache } from "../../db/cache";
import { addProviderPolicySchema } from "./schema";
import { InputType, OutputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { serviceProviderId, type, description } = input;

  const apiPayload = {
    type,
    description,
  };

  const { data, error } = await postData<typeof apiPayload, OutputType>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-providers/${serviceProviderId}/policies`,
    apiPayload,
    { locale, token }
  );

  if (data) {
    revalidateServiceProviderCache(serviceProviderId, userId);
    return { data: data, error: undefined };
  }

  return {
    data: undefined,
    error: error,
    payload: input,
  };
};

export const addProviderPolicy = createAuthenticatedSafeAction(
  addProviderPolicySchema,
  handler,
  { adminRequired: true }
);

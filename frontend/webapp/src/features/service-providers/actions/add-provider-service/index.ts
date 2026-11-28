"use server";

import { postData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import {
  duplicateServiceNameProblem,
  findDuplicateServiceName,
} from "../../lib/duplicate-service-name";
import { revalidateServiceProviderCache } from "../../db/cache";
import { addProviderServiceSchema } from "./schema";
import { InputType, OutputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const {
    serviceProviderId,
    serviceDefinitionId,
    name,
    description,
    price,
    currency,
    durationMinutes,
    trendingScore,
    isActive,
    notes,
  } = input;

  // Only an active service competes for the public URL.
  if (input.isActive !== false) {
    const duplicate = await findDuplicateServiceName({
      serviceProviderId,
      name,
    });
    if (duplicate) {
      return {
        data: undefined,
        error: duplicateServiceNameProblem(duplicate.id),
        payload: input,
      };
    }
  }

  const apiPayload = {
    serviceDefinitionId,
    name,
    description,
    price,
    currency,
    durationMinutes,
    trendingScore,
    isActive,
    notes,
  };

  const { data, error } = await postData<typeof apiPayload, OutputType>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-providers/${serviceProviderId}/services`,
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

export const addProviderService = createAuthenticatedSafeAction(
  addProviderServiceSchema,
  handler,
  { adminRequired: true }
);

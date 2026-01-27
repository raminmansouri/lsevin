"use server";

import { patchData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateServiceProviderCache } from "../../db/cache";
import { ChangeServiceProviderActivationActionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { serviceProviderId, isActive } = input;

  const { data, error } = await patchData<{ isActive: boolean }, boolean>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-providers/${serviceProviderId}/activation`,
    { isActive },
    { locale, token }
  );

  if (data) {
    revalidateServiceProviderCache(serviceProviderId, userId);
    return { data, error: undefined };
  }
  return { data: undefined, error };
};

export const changeServiceProviderActivationAction =
  createAuthenticatedSafeAction(
    ChangeServiceProviderActivationActionSchema,
    handler
  );

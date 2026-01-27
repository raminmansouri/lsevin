"use server";

import { postData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateServiceDefinitionCache } from "../../db/cache";
import { AddServiceAttributeDefinitionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { serviceDefinitionId, ...requestData } = input;

  const { data, error } = await postData<typeof requestData, string>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-definitions/${serviceDefinitionId}/attributes`,
    requestData,
    {
      token,
      locale,
    }
  );

  if (data) {
    revalidateServiceDefinitionCache({ id: serviceDefinitionId, userId });
    return {
      data: data,
      error: error,
    };
  }

  return {
    data: undefined,
    error: error,
  };
};

export const addServiceAttributeDefinitionAction =
  createAuthenticatedSafeAction(AddServiceAttributeDefinitionSchema, handler);

"use server";

import { putData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateServiceDefinitionCache } from "../../db/cache";
import { UpdateServiceAttributeDefinitionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { serviceDefinitionId, attributeDefinitionId, ...requestData } = input;

  const { data, error } = await putData<typeof requestData, string>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-definitions/${serviceDefinitionId}/attributes/${attributeDefinitionId}`,
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

export const updateServiceAttributeDefinitionAction =
  createAuthenticatedSafeAction(
    UpdateServiceAttributeDefinitionSchema,
    handler
  );

"use server";

import { deleteData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateProviderTypeCache } from "../../db/cache";
import { RemoveProviderAttributeDefinitionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { providerTypeId, attributeDefinitionId } = input;

  const { data, error } = await deleteData(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/provider-types/${providerTypeId}/attributes/${attributeDefinitionId}`,
    undefined,
    {
      token,
      locale,
    }
  );

  if (data) {
    revalidateProviderTypeCache({ id: providerTypeId, userId });
    return {
      data: data.toString(),
      error: undefined,
    };
  }

  return {
    data: undefined,
    error: error,
  };
};

export const removeProviderAttributeDefinitionAction =
  createAuthenticatedSafeAction(
    RemoveProviderAttributeDefinitionSchema,
    handler
  );

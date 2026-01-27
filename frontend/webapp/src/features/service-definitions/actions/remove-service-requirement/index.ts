"use server";

import { deleteData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateServiceDefinitionCache } from "../../db/cache";
import { RemoveServiceRequirementSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { serviceDefinitionId, requirementIndex } = input;

  const { data, error } = await deleteData(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-definitions/${serviceDefinitionId}/requirements`,
    { requirementIndex },
    {
      token,
      locale,
    }
  );

  if (data) {
    revalidateServiceDefinitionCache({ id: serviceDefinitionId, userId });
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

export const removeServiceRequirementAction = createAuthenticatedSafeAction(
  RemoveServiceRequirementSchema,
  handler
);

"use server";

import { deleteData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateServiceDefinitionCache } from "../../db/cache";
import { DeleteServiceDefinitionSchema } from "./schema";
import { InputType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
) => {
  const { serviceDefinitionId } = input;

  const { data, error } = await deleteData(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-definitions/${serviceDefinitionId}`,
    undefined,
    {
      token,
      locale,
    }
  );

  if (data) {
    revalidateServiceDefinitionCache({ id: input.serviceDefinitionId, userId });
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

export const deleteServiceDefinitionAction = createAuthenticatedSafeAction(
  DeleteServiceDefinitionSchema,
  handler
);

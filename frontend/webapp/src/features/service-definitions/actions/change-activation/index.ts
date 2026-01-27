"use server";

import { patchData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateServiceDefinitionCache } from "../../db/cache";
import { ChangeServiceDefinitionActivationSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { serviceDefinitionId, isActive } = input;

  const { data, error } = await patchData<
    Omit<InputType, "serviceDefinitionId">,
    string
  >(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-definitions/${serviceDefinitionId}/activation`,
    { isActive },
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

export const changeServiceDefinitionActivationAction =
  createAuthenticatedSafeAction(
    ChangeServiceDefinitionActivationSchema,
    handler
  );

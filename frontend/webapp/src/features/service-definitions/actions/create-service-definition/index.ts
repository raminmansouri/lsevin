"use server";

import { postData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateServiceDefinitionCache } from "../../db/cache";
import { CreateServiceDefinitionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { data, error } = await postData<InputType, string>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-definitions`,
    input,
    {
      token,
      locale,
    }
  );

  if (data) {
    revalidateServiceDefinitionCache({ id: data, userId });
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

export const createServiceDefinitionAction = createAuthenticatedSafeAction(
  CreateServiceDefinitionSchema,
  handler
);

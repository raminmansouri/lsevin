"use server";

import { putData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateServiceDefinitionCache } from "../../db/cache";
import { UpdateServiceDefinitionSchema } from "./schema";
import { InputType, RequestOutputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { data, error } = await putData<InputType, RequestOutputType>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-definitions/${input.serviceDefinitionId}`,
    input,
    { locale, token }
  );

  if (data) {
    revalidateServiceDefinitionCache({ id: input.serviceDefinitionId, userId });
    return { data: input.serviceDefinitionId, error: undefined };
  }
  return { data: undefined, error };
};

export const updateServiceDefinitionAction = createAuthenticatedSafeAction(
  UpdateServiceDefinitionSchema,
  handler
);

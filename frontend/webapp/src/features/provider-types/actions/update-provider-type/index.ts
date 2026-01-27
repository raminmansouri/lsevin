"use server";

import { putData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateProviderTypeCache } from "../../db/cache";
import { UpdateProviderTypeSchema } from "./schema";
import { InputType, RequestOutputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { data, error } = await putData<InputType, RequestOutputType>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/provider-types/${input.providerTypeId}`,
    input,
    { locale, token }
  );

  if (data) {
    revalidateProviderTypeCache({ id: input.providerTypeId, userId });
    return { data: input.providerTypeId!, error: undefined };
  }
  return { data: undefined, error };
};

export const updateProviderTypeAction = createAuthenticatedSafeAction(
  UpdateProviderTypeSchema,
  handler
);

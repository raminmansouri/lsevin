"use server";

import { deleteData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateProviderTypeCache } from "../../db/cache";
import { DeleteProviderTypeSchema } from "./schema";
import { InputType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
) => {
  const { providerTypeId } = input;

  const { data, error } = await deleteData(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/provider-types/${providerTypeId}`,
    undefined,
    {
      token,
      locale,
    }
  );

  if (data) {
    revalidateProviderTypeCache({ id: input.providerTypeId, userId });
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

export const deleteProviderTypeAction = createAuthenticatedSafeAction(
  DeleteProviderTypeSchema,
  handler
);

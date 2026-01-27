"use server";

import { putData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateCategoryCache } from "../../db/cache";
import { UpdateCategorySchema } from "./schema";
import { InputType, RequestOutputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { data, error } = await putData<InputType, RequestOutputType>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/categories/${input.categoryId}`,
    input,
    { locale, token }
  );

  if (data) {
    revalidateCategoryCache({ id: input.categoryId, userId });
    return { data: input.categoryId, error: undefined };
  }
  return { data: undefined, error };
};

export const updateCategoryAction = createAuthenticatedSafeAction(
  UpdateCategorySchema,
  handler
);

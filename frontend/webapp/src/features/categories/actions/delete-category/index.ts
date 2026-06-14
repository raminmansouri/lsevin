"use server";

import { deleteData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateCategoryCache } from "../../db/cache";
import { DeleteCategorySchema } from "./schema";
import { InputType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
) => {
  const { categoryId } = input;

  const { data, error } = await deleteData(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/categories/${categoryId}`,
    undefined,
    {
      token,
      locale,
    }
  );

  if (data) {
    revalidateCategoryCache({ id: input.categoryId, userId });
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

export const deleteCategoryAction = createAuthenticatedSafeAction(
  DeleteCategorySchema,
  handler
);

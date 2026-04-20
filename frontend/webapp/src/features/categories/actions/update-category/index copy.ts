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
  

  
	  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')
  console.log('---------------------------------------------')

    const formData = new FormData();

  for (const [key, value] of Object.entries(input)) {
  if (value == null) continue;

  if (key === "image" && value instanceof File) {
    formData.append("file", value); // backend expects File
    continue;
  }

  if (value instanceof File || value instanceof Blob) {
    formData.append(key, value);
  } else if (typeof value === "object") {
    formData.append(key, JSON.stringify(value));
  } else {
    formData.append(key, String(value));
  }
}

  if (input.image instanceof File && input.image.size > 0) {
  formData.append("file", input.image);
}


  const { data, error } = await putData<FormData, RequestOutputType>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/categories/${input.categoryId}`,
    formData,
    { locale, token }
  );
  console.log('input',formData,data,error)

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

"use server";

import { putData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateStaffCache } from "../../db/cache";
import { UpdateStaffSchema } from "./schema";
import { InputType, RequestOutputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { data, error } = await putData<InputType, RequestOutputType>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/staff/${input.staffId}`,
    input,
    { locale, token }
  );

  if (data) {
    revalidateStaffCache({ id: input.staffId, userId });
    return { data: input.staffId, error: undefined };
  }
  return { data: undefined, error };
};

export const updateStaffAction = createAuthenticatedSafeAction(
  UpdateStaffSchema,
  handler
);

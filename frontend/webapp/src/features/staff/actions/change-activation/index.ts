"use server";

import { patchData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateStaffCache } from "../../db/cache";
import { ChangeStaffActivationSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { staffId, isActive } = input;

  const { data, error } = await patchData<{ isActive: boolean }, boolean>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/staff/${staffId}/activation`,
    { isActive },
    { locale, token }
  );

  if (data) {
    revalidateStaffCache({ id: staffId, userId });
    return { data, error: undefined };
  }
  return { data: undefined, error };
};

export const changeStaffActivationAction = createAuthenticatedSafeAction(
  ChangeStaffActivationSchema,
  handler
);

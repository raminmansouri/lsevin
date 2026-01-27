"use server";

import { getTranslations } from "next-intl/server";

import { putData, withBaseHeaders } from "@/config/http/http-service.server";
import { IDENTITY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { unstable_update } from "@/lib/auth";
import { getUser } from "@/lib/auth/session";
import { parsePhone } from "@/lib/formatters";
import { createSafeAction } from "@/lib/safe-action";

import { UpdateBaseInfoSchema } from "./schema";
import {
  ApiInputType,
  InputType,
  OutputType,
  ReturnType,
  TRANSLATION_KEY,
} from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);
  const parsedPhone = parsePhone(input.phoneNumber);
  if (!parsedPhone) {
    return {
      data: undefined,
      error: { title: t("errors.invalidPhone"), status: 400 },
      payload: input,
    };
  }

  const apiPayload: ApiInputType = {
    firstName: input.firstName,
    lastName: input.lastName,
    userName: input.email,
    email: input.email,
    phoneNumber: parsedPhone.value,
    phoneNumberCountryCode: parsedPhone.country,
  };
  const { data, error } = await withBaseHeaders((locale, token) =>
    putData<ApiInputType, OutputType>(
      `${IDENTITY_MODULE_BASE_PATH}/users`,
      apiPayload,
      { locale, token }
    )
  );
  if (data) {
    const user = await getUser();
    const updatedUser = {
      ...user,
      ...apiPayload,
    };
    await unstable_update({ user: updatedUser });
    return { data: "success", payload: input };
  }

  return {
    data: undefined,
    error: error || {
      title: t("errors.updateFailed"),
      status: 500,
    },
    payload: input,
  };
};

export const updateBaseInfo = createSafeAction(UpdateBaseInfoSchema, handler);

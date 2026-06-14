"use server";

import { getTranslations } from "next-intl/server";

import { putData, withBaseHeaders } from "@/config/http/http-service.server";
import { IDENTITY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { unstable_update } from "@/lib/auth";
import { getUser } from "@/lib/auth/session";
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

  const user = await getUser();

  if (!user) {
    return {
      data: undefined,
      error: { title: "Unauthorized", status: 401 },
      payload: input,
    };
  }

  const apiPayload: ApiInputType = {
    firstName: input.firstName,
    lastName: input.lastName,
    userName: input.email,
    email: input.email,
    // Mobile is immutable. It is copied only from the trusted current session
    // so profile forms cannot submit a changed mobile number/country code.
    phoneNumber: user.phoneNumber ?? "",
    phoneNumberCountryCode: user.phoneNumberCountryCode ?? "",
  };

  const { data, error } = await withBaseHeaders((locale, token) =>
    putData<ApiInputType, OutputType>(
      `${IDENTITY_MODULE_BASE_PATH}/users`,
      apiPayload,
      { locale, token }
    )
  );

  if (data) {
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

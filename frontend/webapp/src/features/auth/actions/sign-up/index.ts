"use server";

import { getTranslations } from "next-intl/server";

import { postData, withBaseHeaders } from "@/config/http/http-service.server";
import { IDENTITY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { parsePhone } from "@/lib/parse-phone";
import { createSafeAction } from "@/lib/safe-action";

import { SignUpSchema } from "./schema";
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

  var { data, error } = await withBaseHeaders(
    (locale) =>
      postData<ApiInputType, OutputType>(
        `${IDENTITY_MODULE_BASE_PATH}/users/register`,
        {
          ...input,
          phoneNumber: parsedPhone.value,
          phoneNumberCountryCode: parsedPhone.country,
        },
        { locale }
      ),
    {
      redirectToLogin: false,
    }
  );

  if (data) {
    return { data: input.phoneNumber, payload: input };
  }

  return { data: undefined, error, payload: input };
};

export const signUp = createSafeAction(SignUpSchema, handler);

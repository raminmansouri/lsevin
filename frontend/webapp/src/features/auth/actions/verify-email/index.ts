"use server";

import { getTranslations } from "next-intl/server";

import { postData, withBaseHeaders } from "@/config/http/http-service.server";
import { createSafeAction } from "@/lib/safe-action";

import { VerifyEmailSchema } from "./schema";
import { InputType, OutputType, ReturnType, TRANSLATION_KEY } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);

  var { data, error } = await withBaseHeaders((locale, token) =>
    postData<InputType, OutputType>("verify-email", input, { locale, token })
  );

  if (error) {
    return {
      data: undefined,
      error: {
        ...error,
        title: t("messages.error"),
      },
      payload: input,
    };
  }

  return { data, error, payload: input };
};

export const verifyEmail = createSafeAction(VerifyEmailSchema, handler);

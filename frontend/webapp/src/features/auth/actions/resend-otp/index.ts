"use server";

import { getLocale, getTranslations } from "next-intl/server";

import { postData } from "@/config/http/http-service.server";
import { IDENTITY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { createSafeAction } from "@/lib/safe-action";

import { ResendOtpSchema } from "./schema";
import { InputType, OutputType, ReturnType, TRANSLATION_KEY } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);
  const locale = await getLocale();

  try {
    const { data, error } = await postData<InputType, OutputType>(
      `${IDENTITY_MODULE_BASE_PATH}/identity/otp/resend`,
      input,
      { locale }
    );

    if (data) {
      return {
        data,
        error: undefined,
      };
    }

    return {
      data: undefined,
      error: error || {
        title: t("messages.resendError"),
        status: 400,
      },
    };
  } catch {
    return {
      data: undefined,
      error: {
        title: t("messages.resendError"),
        status: 400,
      },
    };
  }
};

export const resendOtp = createSafeAction(ResendOtpSchema, handler);

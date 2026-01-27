"use server";

import { getTranslations } from "next-intl/server";

import { createSafeAction } from "@/lib/safe-action";

import { ForgotPasswordSchema } from "./schema";
import { InputType, ReturnType, TRANSLATION_KEY } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);
  try {
    // TODO: Implement actual API call to backend
    // This is a mock implementation
    console.log(`Sending password reset to: ${input.userNameOrEmail}`);
    await new Promise((resolve) => setTimeout(resolve, 1000));

    return {
      data: undefined,
      error: {
        title: t("messages.error"),
        status: 400,
      },
    };
  } catch {
    return {
      data: undefined,
      error: {
        title: t("messages.error"),
        status: 400,
      },
    };
  }
};

export const forgotPassword = createSafeAction(ForgotPasswordSchema, handler);

"use server";

import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { env } from "@/config/env/client";
import { IDENTITY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { createSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { SignInSchema } from "./schema";
import { InputType, ReturnType, TRANSLATION_KEY } from "./types";

const handler = async (
  input: InputType,
  _: LocaleHeaderTypes
): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);
  const locale = await getLocale();

  try {
    // Call backend login API directly
    const response = await fetch(
      `${env.NEXT_PUBLIC_API_URL}/${IDENTITY_MODULE_BASE_PATH}/identity/login`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": locale,
        },
        body: JSON.stringify({
          userNameOrEmail: input.userNameOrEmail,
          password: input.password,
          remember: input.remember,
        }),
      }
    );

    if (!response.ok) {
      return {
        error: {
          title: t("errors.invalidCredentials"),
          status: response.status,
          
        },
        payload: input,
      };
    }

    const data = await response.json();

    // Check if OTP is required (should always be true with 2FA)
    if (data.requiresOtp) {
      // Redirect to OTP page
      redirect(`/otp/${encodeURIComponent(data.phoneNumber)}`);
    }

    // If OTP not required (shouldn't happen), return error
    return {
      error: {
        title: t("errors.authError"),
        status: 400,
      },
      payload: input,
    };
  } catch (exception) {
    // Handle redirect exception (thrown by Next.js redirect)
    if (
      exception instanceof Error &&
      exception.message === "NEXT_REDIRECT" &&
      "digest" in exception
    ) {
      throw exception;
    }

    return {
      error: {
        title: t("errors.authError"),
        status: 500,
      },
      payload: input,
    };
  }
};

export const authenticate = createSafeAction(SignInSchema, handler);

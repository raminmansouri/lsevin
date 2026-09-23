"use server";

import { getLocale, getTranslations } from "next-intl/server";

import { env } from "@/config/env/client";
import { setOtpChallengePhone } from "@/features/auth/lib/otp-challenge";
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
      // The phone rides in an httpOnly cookie rather than the path, so it never
      // reaches a proxy log or the visitor's history — see otp-challenge.ts.
      await setOtpChallengePhone(data.phoneNumber);

      // Return the OTP destination instead of calling next/navigation's
      // redirect(): this action is invoked directly (not via <form action> or
      // useActionState), several async layers deep inside a custom hook, so
      // the thrown NEXT_REDIRECT never reliably reached Next's router --
      // the form appeared to do nothing until the user refreshed. The client
      // now performs a hard navigation itself once it sees this value (same
      // "force a real page load" fix already used below for the post-OTP
      // redirect, needed here too since the OTP page reads the cookie just
      // set above and a soft client transition can outrace it).
      const otpUrl = "/otp";
      const target = input.redirectTo?.trim();
      return {
        data: target ? `${otpUrl}?redirectTo=${encodeURIComponent(target)}` : otpUrl,
        payload: input,
      };
    }

    // If OTP not required (shouldn't happen), return error
    return {
      error: {
        title: t("errors.authError"),
        status: 400,
      },
      payload: input,
    };
  } catch {
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

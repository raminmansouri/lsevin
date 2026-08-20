"use server";

import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import {
  clearOtpChallengePhone,
  readOtpChallengePhone,
} from "@/features/auth/lib/otp-challenge";
import { signIn } from "@/lib/auth";
import { createSafeAction } from "@/lib/safe-action";

import { VerifyOtpSchema } from "./schema";
import { InputType, ReturnType, TRANSLATION_KEY } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);

  // The cookie the sign-in/sign-up step set is the authoritative number for this
  // challenge; the value the form posts is only a fallback for the case where the
  // cookie was dropped. Preferring the cookie means a caller cannot swap in some
  // other person's number and use this action to probe or spam it.
  const challengePhone = await readOtpChallengePhone();
  const phoneNumber = challengePhone || input.phoneNumber;

  try {
    await signIn("credentials", {
      code: input.code,
      phoneNumber,
      isOtpVerification: "true",
      redirect:false
    });
    // The challenge is spent — drop it before leaving so a stale cookie cannot
    // resurrect this screen after the visitor is signed in.
    await clearOtpChallengePhone();
    // If signIn succeeds, handle redirect manually using Next.js redirect()
    // This is the correct way to handle redirects after authentication
    const redirectPath = input.redirectTo || "/";
    redirect(redirectPath);
  } catch (exception) {
    console.error("sign in error::",exception)
    // Handle redirect exception (thrown by Next.js redirect on successful auth)
    if (
      exception instanceof Error &&
      exception.message === "NEXT_REDIRECT" &&
      "digest" in exception
    ) {
      return { error: undefined, payload: input };
    }

    // Handle auth errors
    if (exception instanceof AuthError) {
      return {
        data: undefined,
        error: {
          title: t("messages.error"),
          status: 401,
        },
        payload: input,
      };
    }

    return {
      data: undefined,
      error: {
        title: t("messages.error"),
        status: 400,
      },
      payload: input,
    };
  }
};

export const verifyOtp = createSafeAction(VerifyOtpSchema, handler);

"use server";

import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";

import {
  clearOtpChallengePhone,
  readOtpChallengePhone,
} from "@/features/auth/lib/otp-challenge";
import { redeemPendingSignupReferral } from "@/features/auth/lib/referral-signup";
import { signIn } from "@/lib/auth";
import { parsePhone } from "@/lib/parse-phone";
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
    // First point at which the account is both real and proven to belong to the
    // person holding this number, so it is also the first point an invite code
    // can safely be turned into a discount. Never throws; a sign-in must not
    // fail over a referral reward.
    const parsedPhone = parsePhone(phoneNumber);
    if (parsedPhone) {
      await redeemPendingSignupReferral({
        phoneNumber: parsedPhone.value,
        phoneNumberCountryCode: parsedPhone.country,
      });
    }
    // The client performs a full-page navigation after this action succeeds so
    // the new session is picked up. Returning normally avoids treating Next.js'
    // redirect control-flow exception as an authentication error.
    return { error: undefined, payload: input };
  } catch (exception) {
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

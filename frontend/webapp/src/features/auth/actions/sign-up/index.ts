"use server";

import { getTranslations } from "next-intl/server";

import { postData, withBaseHeaders } from "@/config/http/http-service.server";
import { setOtpChallengePhone } from "@/features/auth/lib/otp-challenge";
import { setPendingReferralCode } from "@/features/auth/lib/referral-signup";
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

  // The identity service owns the account, not the referral programme, so the
  // invite code is stripped out of the payload rather than sent and ignored.
  const { referralCode, ...registration } = input;

  var { data, error } = await withBaseHeaders(
    (locale) =>
      postData<ApiInputType, OutputType>(
        `${IDENTITY_MODULE_BASE_PATH}/users/register`,
        {
          ...registration,
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
    // Registration triggers a verification OTP. Park the number in an httpOnly
    // cookie so the OTP screen can address it without it ever appearing in the
    // URL — the form only needs to know that it should navigate to /otp.
    await setOtpChallengePhone(input.phoneNumber);
    // Parked, not yet redeemed: the customer row the reward hangs off does not
    // exist until the OTP is accepted. An unknown code is resolved there too, so
    // a typo never blocks a registration that has already succeeded.
    if (referralCode) {
      await setPendingReferralCode(referralCode);
    }
    return { data: input.phoneNumber, payload: input };
  }

  return { data: undefined, error, payload: input };
};

export const signUp = createSafeAction(SignUpSchema, handler);

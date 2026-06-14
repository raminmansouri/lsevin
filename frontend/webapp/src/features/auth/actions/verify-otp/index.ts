"use server";

import { AuthError } from "next-auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { signIn } from "@/lib/auth";
import { createSafeAction } from "@/lib/safe-action";

import { VerifyOtpSchema } from "./schema";
import { InputType, ReturnType, TRANSLATION_KEY } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);

  try {
    await signIn("credentials", {
      code: input.code,
      phoneNumber: input.phoneNumber,
      isOtpVerification: "true",
      redirect:false
    });
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

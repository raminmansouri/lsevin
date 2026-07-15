"use server";

import { getLocale, getTranslations } from "next-intl/server";

import { env } from "@/config/env/client";
import { IDENTITY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { createSafeAction } from "@/lib/safe-action";

import { ResetPasswordSchema } from "./schema";
import { InputType, ReturnType, TRANSLATION_KEY } from "./types";

type ProblemDetails = {
  title?: string;
  detail?: string;
  status?: number;
};

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);
  const locale = await getLocale();

  const endpoint = `${env.NEXT_PUBLIC_API_URL}/${IDENTITY_MODULE_BASE_PATH}/identity/reset-password`;

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": locale,
      },
      body: JSON.stringify({
        userNameOrEmail: input.userNameOrEmail.trim(),
        code: input.code.trim(),
        newPassword: input.newPassword,
        confirmPassword: input.confirmPassword,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      let problem: ProblemDetails = { status: response.status };
      try {
        problem = (await response.json()) as ProblemDetails;
      } catch {
        // keep fallback
      }

      return {
        data: undefined,
        error: {
          title: problem.title || t("messages.error"),
          detail: problem.detail,
          status: problem.status || response.status,
        },
        payload: input,
      };
    }

    return { data: undefined, error: undefined, payload: input };
  } catch {
    return {
      data: undefined,
      error: { title: t("messages.error"), status: 500 },
      payload: input,
    };
  }
};

export const resetPassword = createSafeAction(ResetPasswordSchema, handler);

"use server";

import { getLocale, getTranslations } from "next-intl/server";

import { env } from "@/config/env/client";
import { IDENTITY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { createSafeAction } from "@/lib/safe-action";

import { ForgotPasswordSchema } from "./schema";
import { InputType, ReturnType, TRANSLATION_KEY } from "./types";

type ProblemDetails = {
  title?: string;
  detail?: string;
  status?: number;
};

async function readProblem(response: Response): Promise<ProblemDetails> {
  const fallback = { status: response.status };

  try {
    const body = await response.text();
    if (!body) return fallback;

    try {
      const json = JSON.parse(body) as ProblemDetails;
      return {
        title: json.title,
        detail: json.detail,
        status: json.status || response.status,
      };
    } catch {
      return {
        title: body,
        status: response.status,
      };
    }
  } catch {
    return fallback;
  }
}

async function postForgotPassword(endpoint: string, input: InputType, locale: string) {
  return fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": locale,
    },
    body: JSON.stringify({
      userNameOrEmail: input.userNameOrEmail.trim(),
    }),
    cache: "no-store",
  });
}

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);
  const locale = await getLocale();

  const baseUrl = `${env.NEXT_PUBLIC_API_URL}/${IDENTITY_MODULE_BASE_PATH}`;
  const primaryEndpoint = `${baseUrl}/identity/forgot-password`;
  const legacyEndpoint = `${baseUrl}/users/forgot-password`;

  try {
    let response = await postForgotPassword(primaryEndpoint, input, locale);

    // Some older identity modules expose user operations under /users instead of /identity.
    // Keep this fallback so the frontend can work during the endpoint migration window.
    if (response.status === 404) {
      response = await postForgotPassword(legacyEndpoint, input, locale);
    }

    if (!response.ok) {
      const problem = await readProblem(response);
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

    return {
      data: undefined,
      error: undefined,
      payload: input,
    };
  } catch {
    return {
      data: undefined,
      error: {
        title: t("messages.error"),
        status: 500,
      },
      payload: input,
    };
  }
};

export const forgotPassword = createSafeAction(ForgotPasswordSchema, handler);

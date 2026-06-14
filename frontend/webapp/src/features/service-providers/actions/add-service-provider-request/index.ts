"use server";

import { getTranslations } from "next-intl/server";

import { postData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateServiceProviderRequestCache } from "../../db/cache";
import { TRANSLATION_KEY } from "../../types/constants";
import { AddServiceProviderRequestSchema } from "./schema";
import { InputType, OutputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);

  try {
    const apiPayload = {
      message: input.message,
    };

    const { data, error } = await postData<typeof apiPayload, OutputType>(
      `${CATEGORY_MODULE_BASE_PATH}/service-providers/${input.serviceProviderId}/requests`,
      apiPayload,
      { locale, token }
    );

    if (data) {
      revalidateServiceProviderRequestCache(
        data,
        userId,
        input.serviceProviderId
      );
      return { data: data, payload: input };
    }

    return {
      data: undefined,
      error: error || {
        title: t("errors.createFailed"),
        status: 500,
      },
      payload: input,
    };
  } catch (error) {
    console.error("Create service provider request error:", error);
    return {
      data: undefined,
      error: {
        title: t("errors.createFailed"),
        status: 500,
      },
      payload: input,
    };
  }
};

export const addServiceProviderRequest = createAuthenticatedSafeAction(
  AddServiceProviderRequestSchema,
  handler
);

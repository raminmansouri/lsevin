"use server";

import { getTranslations } from "next-intl/server";

import { postData, withBaseHeaders } from "@/config/http/http-service.server";
import { CUSTOMER_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { getUserId } from "@/lib/auth/session";
import { createSafeAction } from "@/lib/safe-action";

import { revalidateConsultingCache } from "../../db/cache";
import { TRANSLATION_KEY } from "../../types/constants";
import { CreateConsultingRequestSchema } from "./schema";
import { InputType, OutputType, ReturnType } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);

  try {
    const apiPayload = {
      description: input.description,
      categoryId: input.categoryId,
      categoryName: input.categoryName,
      documentIds: input.documentIds,
    };

    const { data, error } = await withBaseHeaders((locale, token) =>
      postData<typeof apiPayload, OutputType>(
        `${CUSTOMER_MODULE_BASE_PATH}/consulting`,
        apiPayload,
        { locale, token }
      )
    );

    if (data) {
      const userId = await getUserId();
      revalidateConsultingCache(data, userId!);
      return { data: "success", payload: input };
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
    console.error("Create consulting request error:", error);
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

export const createConsultingRequest = createSafeAction(
  CreateConsultingRequestSchema,
  handler
);

"use server";

import { getTranslations } from "next-intl/server";

import { deleteData, withBaseHeaders } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { getUserId } from "@/lib/auth/session";
import { createSafeAction } from "@/lib/safe-action";

import { revalidateServiceProviderCache } from "../../db/cache";
import { removeGalleryItemSchema } from "./schema";
import { InputType, ReturnType, TRANSLATION_KEY } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);

  try {
    const { serviceProviderId, galleryItemId } = input;

    const { data, error } = await withBaseHeaders((locale, token) =>
      deleteData(
        `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-providers/${serviceProviderId}/gallery-items/${galleryItemId}`,
        undefined,
        { locale, token }
      )
    );

    if (data !== undefined) {
      const userId = await getUserId();
      revalidateServiceProviderCache(serviceProviderId, userId!);
      return { data: "Gallery item removed successfully", payload: input };
    }

    return {
      data: undefined,
      error: error || {
        title: t("errors.removeFailed"),
        status: 500,
      },
      payload: input,
    };
  } catch (error) {
    console.error("Remove gallery item error:", error);
    return {
      data: undefined,
      error: {
        title: t("errors.removeFailed"),
        status: 500,
      },
      payload: input,
    };
  }
};

export const removeGalleryItem = createSafeAction(
  removeGalleryItemSchema,
  handler
);

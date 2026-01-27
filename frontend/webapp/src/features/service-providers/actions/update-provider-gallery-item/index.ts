"use server";

import { getTranslations } from "next-intl/server";

import { putData, withBaseHeaders } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { getUserId } from "@/lib/auth/session";
import { createSafeAction } from "@/lib/safe-action";

import { revalidateServiceProviderCache } from "../../db/cache";
import { updateProviderGalleryItemSchema } from "./schema";
import { InputType, OutputType, ReturnType, TRANSLATION_KEY } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);

  try {
    const {
      serviceProviderId,
      galleryItemId,
      title,
      description,
      displayOrder,
      file,
    } = input;

    // Validate file if provided
    if (file) {
      // Validate file type (images only)
      if (!file.type.startsWith("image/")) {
        return {
          data: undefined,
          error: { title: t("errors.invalidFileType"), status: 400 },
          payload: input,
        };
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        return {
          data: undefined,
          error: { title: t("errors.fileTooLarge"), status: 400 },
          payload: input,
        };
      }
    }

    const formData = new FormData();
    formData.append("title", JSON.stringify(title));
    formData.append("description", JSON.stringify(description));
    formData.append("displayOrder", displayOrder.toString());

    if (file) {
      formData.append("file", file);
    }

    const { data, error } = await withBaseHeaders((locale, token) =>
      putData<FormData, OutputType>(
        `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-providers/${serviceProviderId}/gallery-items/${galleryItemId}`,
        formData,
        { locale, token }
      )
    );

    if (data) {
      const userId = await getUserId();
      revalidateServiceProviderCache(serviceProviderId, userId!);
      return { data: data, payload: input };
    }

    return {
      data: undefined,
      error: error || {
        title: t("errors.updateFailed"),
        status: 500,
      },
      payload: input,
    };
  } catch (error) {
    console.error("Update gallery item error:", error);
    return {
      data: undefined,
      error: {
        title: t("errors.updateFailed"),
        status: 500,
      },
      payload: input,
    };
  }
};

export const updateProviderGalleryItem = createSafeAction(
  updateProviderGalleryItemSchema,
  handler
);

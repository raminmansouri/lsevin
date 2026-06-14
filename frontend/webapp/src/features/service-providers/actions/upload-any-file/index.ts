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

const MAX_PROVIDER_MEDIA_SIZE_BYTES = 200 * 1024 * 1024;

function getProviderMediaType(file: File): "image" | "video" | null {
  if (file.type.startsWith("image/")) return "image";
  if (file.type.startsWith("video/")) return "video";
  return null;
}

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);

  try {
    const {
      title,
      description,
      file,
    } = input;

    let mediaType: "image" | "video" | null = null;

    // Validate file if provided
    if (file) {
      // Validate file type (images and videos)
      mediaType = getProviderMediaType(file);
      if (!mediaType) {
        return {
          data: undefined,
          error: { title: t("errors.invalidFileType"), status: 400 },
          payload: input,
        };
      }

      // Validate file size
      if (file.size > MAX_PROVIDER_MEDIA_SIZE_BYTES) {
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

    if (file && mediaType) {
      formData.append("file", file);
      formData.append("mediaType", mediaType);
    }

    const { data, error } = await withBaseHeaders((locale, token) =>
      putData<FormData, OutputType>(
        `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/UpdateAnyFile`,
        formData,
        { locale, token }
      )
    );

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

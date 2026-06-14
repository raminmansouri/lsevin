"use server";

import { getTranslations } from "next-intl/server";

import { postData, withBaseHeaders } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { getUserId } from "@/lib/auth/session";
import { createSafeAction } from "@/lib/safe-action";

import { revalidateServiceProviderCache } from "../../db/cache";
import { addGalleryItemSchema } from "./schema";
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
    const { serviceProviderId, title, description, file } = input;

    if (!file) {
      return {
        data: undefined,
        error: { title: t("errors.fileRequired"), status: 400 },
        payload: input,
      };
    }

    // Validate file type (images and videos)
    const mediaType = getProviderMediaType(file);
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

    const formData = new FormData();
    formData.append("title", JSON.stringify(title));
    formData.append("description", JSON.stringify(description));
    formData.append("file", file);
    formData.append("mediaType", mediaType);

    const { data, error } = await withBaseHeaders((locale, token) =>
      postData<FormData, OutputType>(
        `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-providers/${serviceProviderId}/gallery-items`,
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
        title: t("errors.addFailed"),
        status: 500,
      },
      payload: input,
    };
  } catch (error) {
    console.error("Add gallery item error:", error);
    return {
      data: undefined,
      error: {
        title: t("errors.addFailed"),
        status: 500,
      },
      payload: input,
    };
  }
};

export const addGalleryItem = createSafeAction(addGalleryItemSchema, handler);

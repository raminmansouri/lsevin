"use server";

import { getTranslations } from "next-intl/server";

import { postData, withBaseHeaders } from "@/config/http/http-service.server";
import { CUSTOMER_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { getUserId } from "@/lib/auth/session";
import { createSafeAction } from "@/lib/safe-action";

import { revalidateUserDocumentCache } from "../../../shared/db/cache";
import { UploadDocumentSchema } from "./schema";
import { InputType, OutputType, ReturnType, TRANSLATION_KEY } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);

  try {
    const documentTypeId = input.documentType;
    const file = input.documentFile;

    // Create a FormData instance
    const formData = new FormData();
    formData.append("file", file, file.name);
    const { data, error } = await withBaseHeaders((locale, token) =>
      postData<FormData, OutputType>(
        `${CUSTOMER_MODULE_BASE_PATH}/customer/document?DocumentTypeId=${documentTypeId}`,
        formData,
        { locale, token }
      )
    );

    if (data) {
      const userId = await getUserId();
      revalidateUserDocumentCache(data, userId!);
      return { data: "success", payload: input };
    }

    return {
      data: undefined,
      error: error || {
        title: t("errors.documentUploadFailed"),
        status: 500,
      },
      payload: input,
    };
  } catch (error) {
    console.error("Document upload error:", error);
    return {
      data: undefined,
      error: {
        title: t("errors.documentUploadFailed"),
        status: 500,
      },
      payload: input,
    };
  }
};

export const uploadDocument = createSafeAction(UploadDocumentSchema, handler);

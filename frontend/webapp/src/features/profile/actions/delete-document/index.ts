"use server";

import { getTranslations } from "next-intl/server";

import { deleteData, withBaseHeaders } from "@/config/http/http-service.server";
import { CUSTOMER_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { getUserId } from "@/lib/auth/session";
import { createSafeAction } from "@/lib/safe-action";

import { revalidateUserDocumentCache } from "../../../shared/db/cache";
import { DeleteDocumentSchema } from "./schema";
import { InputType, ReturnType, TRANSLATION_KEY } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);
  const { data, error } = await withBaseHeaders((locale, token) =>
    deleteData(
      `${CUSTOMER_MODULE_BASE_PATH}/customer/document/${input.documentId}`,
      undefined,
      { locale, token }
    )
  );

  if (data) {
    const userId = await getUserId();
    revalidateUserDocumentCache(input.documentId, userId!);
    return { data: "success", payload: input };
  }

  return {
    data: undefined,
    error: error || {
      title: t("errors.updateFailed"),
      status: 500,
    },
    payload: input,
  };
};

export const deleteDocument = createSafeAction(DeleteDocumentSchema, handler);

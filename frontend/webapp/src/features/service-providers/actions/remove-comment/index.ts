"use server";

import { deleteData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateCommentsCache } from "../../db/cache";
import { RemoveCommentSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { serviceProviderId, commentId } = input;

  const { data, error } = await deleteData(
    `${CATEGORY_MODULE_BASE_PATH}/service-providers/${serviceProviderId}/comments/${commentId}`,
    undefined,
    { locale, token }
  );

  if (data) {
    revalidateCommentsCache(serviceProviderId, userId, commentId);
    return { data: serviceProviderId, error: undefined };
  }

  return { data: undefined, error };
};

export const removeComment = createAuthenticatedSafeAction(
  RemoveCommentSchema,
  handler
);

"use server";

import { postData } from "@/config/http/http-service.server";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateCommentsCache } from "../../db/cache";
import { AddCommentSchema } from "./schema";
import { InputType, OutputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { serviceProviderId, commentText, rating } = input;

  const { data, error } = await postData<
    { commentText: string; rating?: number },
    OutputType
  >(
    `${CATEGORY_MODULE_BASE_PATH}/service-providers/${serviceProviderId}/comments`,
    { commentText, rating },
    { locale, token }
  );

  if (data) {
    revalidateCommentsCache(serviceProviderId, userId);
    return { data, payload: input };
  }

  return { data: undefined, error, payload: input };
};

export const addComment = createAuthenticatedSafeAction(
  AddCommentSchema,
  handler
);

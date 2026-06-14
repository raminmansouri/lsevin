"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateCommentsCache } from "../../db/cache";
import { createProviderReviewInDb } from "../../server/provider-page.repository";
import { AddCommentSchema } from "./schema";
import { InputType, OutputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string,
  _locale: LocaleHeaderTypes,
): Promise<ReturnType> => {
  const { serviceProviderId, commentText, rating, pros, cons } = input;

  const { data, error } = await createProviderReviewInDb({
    providerId: serviceProviderId,
    userId,
    rating: rating || 0,
    comment: commentText,
    pros,
    cons,
    targetType: "provider",
  });

  if (data) {
    revalidateCommentsCache(serviceProviderId, userId);
    return { data: data.review.id as OutputType, payload: input };
  }

  return { data: undefined, error, payload: input };
};

export const addComment = createAuthenticatedSafeAction(
  AddCommentSchema,
  handler,
);

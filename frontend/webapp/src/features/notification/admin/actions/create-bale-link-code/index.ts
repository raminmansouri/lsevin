"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { createBaleLinkCode } from "@/features/notification/server/subscriptions.repository";

import { CreateBaleLinkCodeSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  _input: InputType,
  _token: string,
  userId: string,
  _locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  try {
    const code = await createBaleLinkCode(userId);
    return { data: { code }, error: undefined, payload: _input };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Unable to create a Bale link code",
        status: 500,
        detail: error instanceof Error ? error.message : "Please try again.",
      },
      payload: _input,
    };
  }
};

export const createBaleLinkCodeAction = createAuthenticatedSafeAction(
  CreateBaleLinkCodeSchema,
  handler,
  { adminRequired: true }
);

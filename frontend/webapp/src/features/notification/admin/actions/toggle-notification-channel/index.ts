"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { toggleChannelConfig } from "@/features/notification/server/channel.repository";

import { ToggleNotificationChannelSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string,
  _locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  try {
    const data = await toggleChannelConfig({
      code: input.code,
      isEnabled: input.isEnabled,
      updatedBy: userId,
    });

    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Unable to update notification channel",
        status: 500,
        detail: error instanceof Error ? error.message : "Please try again.",
      },
      payload: input,
    };
  }
};

export const toggleNotificationChannelAction = createAuthenticatedSafeAction(
  ToggleNotificationChannelSchema,
  handler,
  { adminRequired: true }
);

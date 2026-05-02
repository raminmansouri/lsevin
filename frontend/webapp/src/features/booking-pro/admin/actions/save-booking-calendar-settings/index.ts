"use server";

import { revalidatePath } from "next/cache";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { saveBookingCalendarSettings } from "@/features/booking-pro/server/booking-calendar-settings.repository";

import { SaveBookingCalendarSettingsSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  _userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  try {
    const data = await saveBookingCalendarSettings(input);
    revalidatePath(`/${locale}/admin/booking-calendar`);
    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      payload: input,
      error: {
        title: "Unable to save calendar settings",
        status: 500,
        detail: error instanceof Error ? error.message : "Please try again.",
      },
    };
  }
};

export const saveBookingCalendarSettingsAction = createAuthenticatedSafeAction(
  SaveBookingCalendarSettingsSchema,
  handler,
  { adminRequired: true }
);

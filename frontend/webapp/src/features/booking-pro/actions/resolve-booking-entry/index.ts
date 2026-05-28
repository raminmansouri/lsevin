"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { resolveBookingEntry } from "@/features/booking-pro/server/booking-entry.repository";

import { ResolveBookingEntrySchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  _userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  try {
    const data = await resolveBookingEntry({
      locale,
      providerId: input.providerId || null,
      serviceId: input.serviceId || null,
      specialistId: input.specialistId || null,
    });

    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      payload: input,
      error: {
        title: "Unable to prepare booking",
        status: 500,
        detail: error instanceof Error ? error.message : "Please try again.",
      },
    };
  }
};

export const resolveBookingEntryAction = createAuthenticatedSafeAction(
  ResolveBookingEntrySchema,
  handler,
  { adminRequired: false }
);

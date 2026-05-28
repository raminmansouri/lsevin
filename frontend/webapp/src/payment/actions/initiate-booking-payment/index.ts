"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";

import { initiateBookingPayment } from "../../server/payment.service";
import { InitiateBookingPaymentSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  try {
    const result = await initiateBookingPayment({
      bookingId: input.bookingId,
      gateway: input.gateway,
      userId,
      locale,
    });

    return {
      data: result,
      error: undefined,
      payload: input,
    };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Unable to start payment",
        status: 500,
        detail: error instanceof Error ? error.message : "Please try again.",
      },
      payload: input,
    };
  }
};

export const initiateBookingPaymentAction = createAuthenticatedSafeAction(
  InitiateBookingPaymentSchema,
  handler,
  { adminRequired: false }
);

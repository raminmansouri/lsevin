"use server";

import { revalidatePath } from "next/cache";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { confirmBookingPayment } from "@/features/booking-pro/server/payment-repository";

import { RejectBookingPaymentSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string,
  _locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  try {
    const result = await confirmBookingPayment({
      bookingId: input.bookingId,
      paymentId: input.paymentId,
      userId,
      status: "Failed",
      actingAsAdmin: true,
      payload: { reviewRejectedReason: input.reason || "Rejected by admin" },
    });

    revalidatePath("/admin/payments");

    return { data: { ok: true, status: result.status }, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Unable to reject payment",
        status: 500,
        detail: error instanceof Error ? error.message : "Please try again.",
      },
      payload: input,
    };
  }
};

export const rejectBookingPaymentAction = createAuthenticatedSafeAction(
  RejectBookingPaymentSchema,
  handler,
  { adminRequired: true }
);

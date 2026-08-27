"use server";

import { revalidatePath } from "next/cache";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { confirmBookingPayment } from "@/features/booking-pro/server/payment-repository";

import { ApproveBookingPaymentSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

/**
 * Approves a bank receipt (marks the claimed transfer verified) or a pay-on-delivery
 * payment (marks the cash as collected). Both are "this payment actually settled" --
 * the same confirmBookingPayment transaction the online-gateway callback uses, just
 * with actingAsAdmin so it isn't scoped to the paying customer.
 */
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
      status: "Succeeded",
      actingAsAdmin: true,
    });

    revalidatePath("/admin/payments");

    return { data: { ok: true, status: result.status }, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Unable to approve payment",
        status: 500,
        detail: error instanceof Error ? error.message : "Please try again.",
      },
      payload: input,
    };
  }
};

export const approveBookingPaymentAction = createAuthenticatedSafeAction(
  ApproveBookingPaymentSchema,
  handler,
  { adminRequired: true }
);

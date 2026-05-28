"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { requestBookingRefund } from "@/features/refunds/server/repository";
import { RequestRefundSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string,
  _locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  try {
    const result = await requestBookingRefund({
      bookingId: input.bookingId,
      userId,
      reason: input.reason,
      customerNote: input.customerNote,
      refundScope: input.refundScope ?? "full",
    });

    return { data: result, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      payload: input,
      error: {
        title: "Unable to request refund",
        status: 500,
        detail: error instanceof Error ? error.message : "Please try again.",
      },
    };
  }
};

export const requestRefundAction = createAuthenticatedSafeAction(
  RequestRefundSchema,
  handler,
  { adminRequired: false }
);

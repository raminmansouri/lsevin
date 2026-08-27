"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { togglePaymentMethodConfig } from "@/payment/server/payment-method.repository";

import { TogglePaymentMethodSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  _userId: string,
  _locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  try {
    const data = await togglePaymentMethodConfig({
      code: input.code,
      isActive: input.isActive,
    });

    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Unable to update payment method",
        status: 500,
        detail: error instanceof Error ? error.message : "Please try again.",
      },
      payload: input,
    };
  }
};

export const togglePaymentMethodAction = createAuthenticatedSafeAction(
  TogglePaymentMethodSchema,
  handler,
  { adminRequired: true }
);

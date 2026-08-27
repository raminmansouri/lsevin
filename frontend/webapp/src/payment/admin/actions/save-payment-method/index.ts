"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { savePaymentMethodConfig } from "@/payment/server/payment-method.repository";

import { SavePaymentMethodSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  _userId: string,
  _locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  try {
    const data = await savePaymentMethodConfig({
      code: input.code,
      displayName: input.displayName,
      description: input.description,
      isActive: input.isActive,
      sortOrder: input.sortOrder,
      bankAccounts: input.bankAccounts,
    });

    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Unable to save payment method",
        status: 500,
        detail: error instanceof Error ? error.message : "Please try again.",
      },
      payload: input,
    };
  }
};

export const savePaymentMethodAction = createAuthenticatedSafeAction(
  SavePaymentMethodSchema,
  handler,
  { adminRequired: true }
);

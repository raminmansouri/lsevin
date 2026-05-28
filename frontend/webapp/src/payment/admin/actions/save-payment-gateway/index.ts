"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { savePaymentGatewayConfig } from "@/payment/server/payment-gateway.repository";

import { SavePaymentGatewaySchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string,
  _locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  try {
    const data = await savePaymentGatewayConfig({
      code: input.code,
      displayName: input.displayName,
      description: input.description,
      isEnabled: input.isEnabled,
      supportsRefund: input.supportsRefund,
      sortOrder: input.sortOrder,
      settings: input.settings,
      updatedBy: userId,
    });

    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Unable to save payment gateway",
        status: 500,
        detail: error instanceof Error ? error.message : "Please try again.",
      },
      payload: input,
    };
  }
};

export const savePaymentGatewayAction = createAuthenticatedSafeAction(
  SavePaymentGatewaySchema,
  handler,
  { adminRequired: true }
);

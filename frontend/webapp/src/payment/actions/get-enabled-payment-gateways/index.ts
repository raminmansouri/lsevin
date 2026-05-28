"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { listEnabledPaymentGatewayOptions } from "@/payment/server/payment-gateway.repository";

import { GetEnabledPaymentGatewaysSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  _userId: string,
  _locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  try {
    const gateways = await listEnabledPaymentGatewayOptions({
      context: input.context || "booking_online_card",
    });

    return { data: gateways, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Unable to load payment gateways",
        status: 500,
        detail: error instanceof Error ? error.message : "Please try again.",
      },
      payload: input,
    };
  }
};

export const getEnabledPaymentGatewaysAction = createAuthenticatedSafeAction(
  GetEnabledPaymentGatewaysSchema,
  handler,
  { adminRequired: false }
);

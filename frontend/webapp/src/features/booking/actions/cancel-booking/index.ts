"use server";

import { postData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
  CUSTOMER_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";


import { CancelBookingSchema } from "./schema";
import { InputType, OutputType, ReturnType } from "./types";
import { revalidateServiceProviderCache } from "@/features/service-providers/db/cache";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { bookingId,reason} = input;

  const apiPayload = {
    bookingId,
    reason,
  };

  const { data, error } = await postData<typeof apiPayload, OutputType>(
    `${CUSTOMER_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/cancel-booking`,
    apiPayload,
    { locale, token }
  );

  // if (data) {
  //   revalidateServiceProviderCache(serviceProviderId, userId);
  //   return { data: data, error: undefined };
  // }

  return {
    data: undefined,
    error: error,
    payload: input,
  };
};

export const cancelBookingAction = createAuthenticatedSafeAction(
  CancelBookingSchema,
  handler,
  { adminRequired: true }
);

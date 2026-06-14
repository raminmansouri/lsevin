"use server";

import { patchData } from "@/config/http/http-service.server";
import { revalidateServiceProviderRequestCache } from "@/features/service-providers/db/cache";
import { CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { ApproveSchema } from "./schema";
import { InputType, OutputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { requestId } = input;

  const { data, error } = await patchData<undefined, OutputType>(
    `${CATEGORY_MODULE_BASE_PATH}/admin/service-providers/requests/${requestId}/approve`,
    undefined,
    { locale, token }
  );

  if (data) {
    revalidateServiceProviderRequestCache(input.requestId, userId, requestId);
    return { data, payload: input };
  }
  return { data: undefined, error, payload: input };
};

export const approveServiceProviderRequest = createAuthenticatedSafeAction(
  ApproveSchema,
  handler
);

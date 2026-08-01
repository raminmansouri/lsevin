"use server";

import { getTranslations } from "next-intl/server";

import { postData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { optionalLocalizedContentOrNull } from "@/features/shared/utils/localization";
import { parsePhone } from "@/lib/parse-phone";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateServiceProviderCache } from "../../db/cache";
import { gradeToId } from "../../types";
import { TRANSLATION_KEY } from "../../types/constants";
import { CreateServiceProviderActionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);

  // Parse and validate phone number if provided
  let parsedPhone = null;
  if (input.phoneNumber) {
    parsedPhone = parsePhone(input.phoneNumber);
    if (!parsedPhone) {
      return {
        data: undefined,
        error: { title: t("errors.invalidPhone"), status: 400 },
        payload: input,
      };
    }
  }

  // Map frontend field names to backend expected field names
  const apiPayload = {
    name: input.name,
    description: input.description,
    contactEmail: input.email,
    contactPhone: parsedPhone?.value || undefined,
    countryCode: parsedPhone?.country || undefined,
    address: {
      country: input.country,
      city: input.city,
      street: optionalLocalizedContentOrNull(input.street),
      detail: optionalLocalizedContentOrNull(input.detail),
      zipCode: input.zipCode || undefined,
      coordinates: input.coordinates || undefined,
    },
    providerTypeId: input.providerTypeId,
    gradeId: gradeToId(input.grade),
    isActive: true, // input.isActive
  };

  const { data, error } = await postData<typeof apiPayload, string>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-providers`,
    apiPayload,
    {
      token,
      locale,
    }
  );

  if (data) {
    revalidateServiceProviderCache(data, userId);
    return {
      data: data,
      error: error,
    };
  }

  return {
    data: undefined,
    error: error || {
      title: t("errors.createFailed"),
      status: 500,
    },
  };
};

export const createServiceProviderAction = createAuthenticatedSafeAction(
  CreateServiceProviderActionSchema,
  handler
);

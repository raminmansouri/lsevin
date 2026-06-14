"use server";

import { getTranslations } from "next-intl/server";

import { putData, withBaseHeaders } from "@/config/http/http-service.server";
import { CUSTOMER_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { optionalLocalizedContentOrNull } from "@/features/shared/utils/localization";
import { createSafeAction } from "@/lib/safe-action";

import { revalidateUserCache } from "../../../shared/db/cache";
import { UpdateAdditionalInfoSchema } from "./schema";
import { InputType, OutputType, ReturnType, TRANSLATION_KEY } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  const t = await getTranslations(TRANSLATION_KEY);

  const apiPayload = {
    birthDate: input.birthDate ? input.birthDate : "",
    address: {
      country: input.address.countryCode,
      city: input.address.cityCode,
      street: optionalLocalizedContentOrNull(input.address.street),
      detail: optionalLocalizedContentOrNull(input.address.detail),
      zipCode: input.address.zipCode,
    },
    gender: input.gender || 1,
  };
  const { data, error } = await withBaseHeaders((locale, token) =>
    putData<typeof apiPayload, OutputType>(
      `${CUSTOMER_MODULE_BASE_PATH}/customer`,
      apiPayload,
      { locale, token }
    )
  );

  if (data) {
    revalidateUserCache(data);
    return { data: "success", payload: input };
  }

  return {
    data: undefined,
    error: error || {
      title: t("errors.updateFailed"),
      status: 500,
    },
    payload: input,
  };
};

export const updateAdditionalInfo = createSafeAction(
  UpdateAdditionalInfoSchema,
  handler
);

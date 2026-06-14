"use server";

import { putData } from "@/config/http/http-service.server";
import {
  ADMIN_BASE_PATH,
  CATEGORY_MODULE_BASE_PATH,
} from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { revalidateStaffCache } from "../../db/cache";
import { convertDayOfWeekToInteger } from "../../utils/day-of-week-converter";
import { UpdateStaffAvailabilitySchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  token: string,
  userId: string,
  locale: LocaleHeaderTypes
): Promise<ReturnType> => {
  const { staffId, availabilityId, dayOfWeek, ...otherData } = input;

  // Convert DayOfWeek string to integer for .NET backend
  const requestData = {
    ...otherData,
    dayOfWeek: convertDayOfWeekToInteger(dayOfWeek),
  };

  const { data, error } = await putData<typeof requestData, string>(
    `${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/staff/${staffId}/availabilities/${availabilityId}`,
    requestData,
    {
      token,
      locale,
    }
  );

  if (data) {
    revalidateStaffCache({ id: staffId, userId });
    return {
      data: data,
      error: undefined,
    };
  }

  return {
    data: undefined,
    error: error,
  };
};

export const updateStaffAvailabilityAction = createAuthenticatedSafeAction(
  UpdateStaffAvailabilitySchema,
  handler
);

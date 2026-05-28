"use server";

import { revalidatePath } from "next/cache";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { setBookableResourceActive, setGenericAvailabilityRuleActive } from "@/features/booking-pro/server/generic-availability-admin.repository";

import { ToggleBookableResourceSchema, ToggleGenericAvailabilityRuleSchema } from "./schema";
import type {
  ToggleBookableResourceInput,
  ToggleBookableResourceReturn,
  ToggleGenericAvailabilityRuleInput,
  ToggleGenericAvailabilityRuleReturn,
} from "./types";

function revalidateAvailability(locale: LocaleHeaderTypes) {
  revalidatePath(`/${locale}/admin/availability`);
}

const toggleRuleHandler = async (
  input: ToggleGenericAvailabilityRuleInput,
  _token: string,
  _userId: string,
  locale: LocaleHeaderTypes
): Promise<ToggleGenericAvailabilityRuleReturn> => {
  try {
    const data = await setGenericAvailabilityRuleActive(input.id, input.isActive);
    revalidateAvailability(locale);
    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      payload: input,
      error: { title: "Unable to update availability rule", status: 500, detail: error instanceof Error ? error.message : "Please try again." },
    };
  }
};

const toggleResourceHandler = async (
  input: ToggleBookableResourceInput,
  _token: string,
  _userId: string,
  locale: LocaleHeaderTypes
): Promise<ToggleBookableResourceReturn> => {
  try {
    const data = await setBookableResourceActive(input.id, input.isActive);
    revalidateAvailability(locale);
    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      payload: input,
      error: { title: "Unable to update resource", status: 500, detail: error instanceof Error ? error.message : "Please try again." },
    };
  }
};

export const toggleGenericAvailabilityRuleAction = createAuthenticatedSafeAction(ToggleGenericAvailabilityRuleSchema, toggleRuleHandler, { adminRequired: true });
export const toggleBookableResourceAction = createAuthenticatedSafeAction(ToggleBookableResourceSchema, toggleResourceHandler, { adminRequired: true });

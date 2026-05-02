"use server";

import { revalidatePath } from "next/cache";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { saveBookableResource, saveGenericAvailabilityRule } from "@/features/booking-pro/server/generic-availability-admin.repository";

import { SaveBookableResourceSchema, SaveGenericAvailabilityRuleSchema } from "./schema";
import type {
  SaveBookableResourceInput,
  SaveBookableResourceReturn,
  SaveGenericAvailabilityRuleInput,
  SaveGenericAvailabilityRuleReturn,
} from "./types";

function revalidateAvailability(locale: LocaleHeaderTypes) {
  revalidatePath(`/${locale}/admin/availability`);
  revalidatePath(`/${locale}/admin/availability/resources/add`);
  revalidatePath(`/${locale}/admin/availability/rules/add`);
}

const saveRuleHandler = async (
  input: SaveGenericAvailabilityRuleInput,
  _token: string,
  _userId: string,
  locale: LocaleHeaderTypes
): Promise<SaveGenericAvailabilityRuleReturn> => {
  try {
    const data = await saveGenericAvailabilityRule(input as any);
    revalidateAvailability(locale);
    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      payload: input,
      error: { title: "Unable to save availability rule", status: 500, detail: error instanceof Error ? error.message : "Please try again." },
    };
  }
};

const saveResourceHandler = async (
  input: SaveBookableResourceInput,
  _token: string,
  _userId: string,
  locale: LocaleHeaderTypes
): Promise<SaveBookableResourceReturn> => {
  try {
    const data = await saveBookableResource(input as any);
    revalidateAvailability(locale);
    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      payload: input,
      error: { title: "Unable to save resource", status: 500, detail: error instanceof Error ? error.message : "Please try again." },
    };
  }
};

export const saveGenericAvailabilityRuleAction = createAuthenticatedSafeAction(SaveGenericAvailabilityRuleSchema, saveRuleHandler, { adminRequired: true });
export const saveBookableResourceAction = createAuthenticatedSafeAction(SaveBookableResourceSchema, saveResourceHandler, { adminRequired: true });

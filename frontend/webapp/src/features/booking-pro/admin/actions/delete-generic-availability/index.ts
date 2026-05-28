"use server";

import { revalidatePath } from "next/cache";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import type { LocaleHeaderTypes } from "@/types/common";
import { deleteBookableResource, deleteGenericAvailabilityRule } from "@/features/booking-pro/server/generic-availability-admin.repository";

import { DeleteBookableResourceSchema, DeleteGenericAvailabilityRuleSchema } from "./schema";
import type {
  DeleteBookableResourceInput,
  DeleteBookableResourceReturn,
  DeleteGenericAvailabilityRuleInput,
  DeleteGenericAvailabilityRuleReturn,
} from "./types";

function revalidateAvailability(locale: LocaleHeaderTypes) {
  revalidatePath(`/${locale}/admin/availability`);
}

const deleteRuleHandler = async (
  input: DeleteGenericAvailabilityRuleInput,
  _token: string,
  _userId: string,
  locale: LocaleHeaderTypes
): Promise<DeleteGenericAvailabilityRuleReturn> => {
  try {
    const data = await deleteGenericAvailabilityRule(input.id);
    revalidateAvailability(locale);
    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      payload: input,
      error: { title: "Unable to delete availability rule", status: 500, detail: error instanceof Error ? error.message : "Please try again." },
    };
  }
};

const deleteResourceHandler = async (
  input: DeleteBookableResourceInput,
  _token: string,
  _userId: string,
  locale: LocaleHeaderTypes
): Promise<DeleteBookableResourceReturn> => {
  try {
    const data = await deleteBookableResource(input.id);
    revalidateAvailability(locale);
    return { data, error: undefined, payload: input };
  } catch (error) {
    return {
      data: undefined,
      payload: input,
      error: { title: "Unable to delete resource", status: 500, detail: error instanceof Error ? error.message : "Please try again." },
    };
  }
};

export const deleteGenericAvailabilityRuleAction = createAuthenticatedSafeAction(DeleteGenericAvailabilityRuleSchema, deleteRuleHandler, { adminRequired: true });
export const deleteBookableResourceAction = createAuthenticatedSafeAction(DeleteBookableResourceSchema, deleteResourceHandler, { adminRequired: true });

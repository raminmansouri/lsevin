"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { deleteServiceIncludedSchema } from "../../schemas";
import { deleteServiceIncluded } from "../../server/repository";

type InputType = z.infer<typeof deleteServiceIncludedSchema>;
type ReturnType = { data?: unknown; error?: { title?: string; detail?: string } };

const handler = async (input: InputType, _token: string, _userId: string, locale: LocaleHeaderTypes): Promise<ReturnType> => {
  try {
    const data = await deleteServiceIncluded(input.providerServiceId, input.includedId);
    revalidatePath(`/${locale}/admin/provider-services/${input.providerServiceId}/included`);
    return { data };
  } catch (error) {
    return { data: undefined, error: { detail: error instanceof Error ? error.message : "Unexpected error" } };
  }
};

export const deleteServiceIncludedAction = createAuthenticatedSafeAction(deleteServiceIncludedSchema, handler);

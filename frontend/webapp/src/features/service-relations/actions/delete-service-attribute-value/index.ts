"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { deleteServiceAttributeValueSchema } from "../../schemas";
import { deleteServiceAttributeValue } from "../../server/repository";

type InputType = z.infer<typeof deleteServiceAttributeValueSchema>;
type ReturnType = { data?: unknown; error?: { title?: string; detail?: string } };

const handler = async (input: InputType, _token: string, _userId: string, locale: LocaleHeaderTypes): Promise<ReturnType> => {
  try {
    const data = await deleteServiceAttributeValue(input.providerServiceId, input.valueId);
    revalidatePath(`/${locale}/admin/provider-services/${input.providerServiceId}/attribute-values`);
    return { data };
  } catch (error) {
    return { data: undefined, error: { detail: error instanceof Error ? error.message : "Unexpected error" } };
  }
};

export const deleteServiceAttributeValueAction = createAuthenticatedSafeAction(deleteServiceAttributeValueSchema, handler);

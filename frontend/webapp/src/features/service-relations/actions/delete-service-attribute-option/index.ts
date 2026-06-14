"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { deleteServiceAttributeOptionSchema } from "../../schemas";
import { deleteServiceAttributeOption } from "../../server/repository";

type InputType = z.infer<typeof deleteServiceAttributeOptionSchema>;
type ReturnType = { data?: unknown; error?: { title?: string; detail?: string } };

const handler = async (input: InputType, _token: string, _userId: string, locale: LocaleHeaderTypes): Promise<ReturnType> => {
  try {
    const data = await deleteServiceAttributeOption(input.attributeDefinitionId, input.optionId);
    revalidatePath(`/${locale}/admin/service-definitions/${input.serviceDefinitionId}/attribute-definitions`);
    return { data };
  } catch (error) {
    return { data: undefined, error: { detail: error instanceof Error ? error.message : "Unexpected error" } };
  }
};

export const deleteServiceAttributeOptionAction = createAuthenticatedSafeAction(deleteServiceAttributeOptionSchema, handler);

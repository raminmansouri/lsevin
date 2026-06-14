"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { deleteServiceAttributeDefinitionSchema } from "../../schemas";
import { deleteServiceAttributeDefinition } from "../../server/repository";

type InputType = z.infer<typeof deleteServiceAttributeDefinitionSchema>;
type ReturnType = { data?: unknown; error?: { title?: string; detail?: string } };

const handler = async (input: InputType, _token: string, _userId: string, locale: LocaleHeaderTypes): Promise<ReturnType> => {
  try {
    const data = await deleteServiceAttributeDefinition(input.serviceDefinitionId, input.attributeDefinitionId);
    revalidatePath(`/${locale}/admin/service-definitions/${input.serviceDefinitionId}/attribute-definitions`);
    return { data };
  } catch (error) {
    return { data: undefined, error: { detail: error instanceof Error ? error.message : "Unexpected error" } };
  }
};

export const deleteServiceAttributeDefinitionAction = createAuthenticatedSafeAction(deleteServiceAttributeDefinitionSchema, handler);

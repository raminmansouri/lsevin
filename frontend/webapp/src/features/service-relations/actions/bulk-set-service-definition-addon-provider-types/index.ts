"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { bulkSetServiceDefinitionAddonProviderTypesSchema } from "../../schemas";
import { bulkSetServiceDefinitionAddonProviderTypes } from "../../server/repository";

type InputType = z.infer<typeof bulkSetServiceDefinitionAddonProviderTypesSchema>;
type ReturnType = { data?: unknown; error?: { title?: string; detail?: string } };

const handler = async (input: InputType, _token: string, _userId: string, locale: LocaleHeaderTypes): Promise<ReturnType> => {
  try {
    await bulkSetServiceDefinitionAddonProviderTypes(input);
    revalidatePath(`/${locale}/admin/addon-provider-types/${input.providerTypeId}/services`);
    return { data: { ok: true } };
  } catch (error) {
    return { data: undefined, error: { detail: error instanceof Error ? error.message : "Unexpected error" } };
  }
};

export const bulkSetServiceDefinitionAddonProviderTypesAction = createAuthenticatedSafeAction(
  bulkSetServiceDefinitionAddonProviderTypesSchema,
  handler
);

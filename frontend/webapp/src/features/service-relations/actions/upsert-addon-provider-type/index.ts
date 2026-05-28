"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { addonProviderTypeSchema } from "../../schemas";
import { upsertAddonProviderType } from "../../server/repository";

type InputType = z.infer<typeof addonProviderTypeSchema>;
type ReturnType = { data?: unknown; error?: { title?: string; detail?: string } };

const handler = async (input: InputType, _token: string, _userId: string, locale: LocaleHeaderTypes): Promise<ReturnType> => {
  try {
    const data = await upsertAddonProviderType(input);
    revalidatePath(`/${locale}/admin/service-definitions/${input.serviceDefinitionId}/addon-provider-types`);
    return { data };
  } catch (error) {
    return { data: undefined, error: { detail: error instanceof Error ? error.message : "Unexpected error" } };
  }
};

export const upsertAddonProviderTypeAction = createAuthenticatedSafeAction(addonProviderTypeSchema, handler);

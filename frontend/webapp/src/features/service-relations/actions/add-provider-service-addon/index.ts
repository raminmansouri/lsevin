"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { providerServiceAddonSchema } from "../../schemas";
import { addProviderServiceAddon } from "../../server/repository";

type InputType = z.infer<typeof providerServiceAddonSchema>;
type ReturnType = { data?: unknown; error?: { title?: string; detail?: string } };

const handler = async (input: InputType, _token: string, _userId: string, locale: LocaleHeaderTypes): Promise<ReturnType> => {
  try {
    const data = await addProviderServiceAddon(input.providerServiceId, input.addonId);
    revalidatePath(`/${locale}/admin/provider-services/${input.providerServiceId}/addons`);
    return { data };
  } catch (error) {
    return { data: undefined, error: { detail: error instanceof Error ? error.message : "Unexpected error" } };
  }
};

export const addProviderServiceAddonAction = createAuthenticatedSafeAction(providerServiceAddonSchema, handler);

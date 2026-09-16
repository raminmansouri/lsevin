"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { bulkSetAddonProviderServicesSchema } from "../../schemas";
import { bulkSetAddonProviderServices } from "../../server/repository";

type InputType = z.infer<typeof bulkSetAddonProviderServicesSchema>;
type ReturnType = { data?: unknown; error?: { title?: string; detail?: string } };

const handler = async (input: InputType, _token: string, _userId: string, locale: LocaleHeaderTypes): Promise<ReturnType> => {
  try {
    await bulkSetAddonProviderServices(input);
    revalidatePath(`/${locale}/admin/addons/${input.addonId}/services`);
    return { data: { ok: true } };
  } catch (error) {
    return { data: undefined, error: { detail: error instanceof Error ? error.message : "Unexpected error" } };
  }
};

export const bulkSetAddonProviderServicesAction = createAuthenticatedSafeAction(bulkSetAddonProviderServicesSchema, handler);

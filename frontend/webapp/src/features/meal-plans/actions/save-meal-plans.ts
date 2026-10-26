"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod/v4";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";

import { saveMealPlansSchema } from "../schemas";
import { saveRoomMealPlans } from "../server/repository";

type InputType = z.infer<typeof saveMealPlansSchema>;
type ReturnType = { data?: unknown; error?: { title?: string; detail?: string } };

const handler = async (input: InputType, _token: string, _userId: string, locale: LocaleHeaderTypes): Promise<ReturnType> => {
  try {
    await saveRoomMealPlans(input.providerServiceId, { breakfast: input.breakfastPrice, fullBoard: input.fullBoardPrice });
    revalidatePath("/" + locale + "/admin/provider-services/" + input.providerServiceId + "/meal-plans");
    return { data: { ok: true } };
  } catch (error) {
    return { data: undefined, error: { detail: error instanceof Error ? error.message : "Unexpected error" } };
  }
};

// Prices are money: admin only (the attribute-values actions are not, this one is).
export const saveMealPlansAction = createAuthenticatedSafeAction(saveMealPlansSchema, handler, { adminRequired: true });

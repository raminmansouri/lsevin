"use server";

import { revalidateTag } from "next/cache";
import { z } from "zod/v4";

import { getMarketingLoyaltyGlobalTag } from "../db/cache";
import { updatePointsEarnDivisor } from "../server/loyalty-settings.repository";

const UpdateLoyaltySettingsSchema = z.object({
  divisor: z.coerce
    .number({ message: "Earn-rate divisor must be a number." })
    .positive("Earn-rate divisor must be greater than zero."),
});

export type UpdateLoyaltySettingsResult = {
  data?: { divisor: number };
  error?: {
    detail: string;
  };
};

export async function updateLoyaltySettingsAction(input: unknown): Promise<UpdateLoyaltySettingsResult> {
  const parsed = UpdateLoyaltySettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { error: { detail: parsed.error.issues[0]?.message || "Invalid form data." } };
  }

  try {
    await updatePointsEarnDivisor(parsed.data.divisor);
    revalidateTag(getMarketingLoyaltyGlobalTag());
    return { data: { divisor: parsed.data.divisor } };
  } catch (error) {
    return { error: { detail: error instanceof Error ? error.message : "Database operation failed." } };
  }
}

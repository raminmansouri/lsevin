"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateSponseredSliderCache } from "../../db/cache";
import { changeSponseredSliderActivation } from "../../lib/sponsered-slider-db";
import { ChangeSponseredSliderActivationSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  console.log("[sponsered-slider/action:change-activation] received", { input, userId });
  try {
    const id = await changeSponseredSliderActivation(input.sliderId, input.isActive);
    revalidateSponseredSliderCache({ id, userId });
    return { data: id, error: undefined };
  } catch (error) {
    console.error("[sponsered-slider/action:change-activation] failed", error);
    return {
      data: undefined,
      error: {
        title: "Change sponsored slider status failed",
        detail: error instanceof Error ? error.message : "Could not change sponsored slider status.",
        status: 500,
      } as any,
    };
  }
};

export const changeSponseredSliderActivationAction = createAuthenticatedSafeAction(ChangeSponseredSliderActivationSchema, handler);

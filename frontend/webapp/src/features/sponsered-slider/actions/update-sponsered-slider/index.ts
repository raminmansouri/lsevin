"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateSponseredSliderCache } from "../../db/cache";
import { updateSponseredSlider } from "../../lib/sponsered-slider-db";
import { UpdateSponseredSliderSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  console.log("[sponsered-slider/action:update-sponsered-slider] received", { input, userId });
  try {
    const id = await updateSponseredSlider(input);
    revalidateSponseredSliderCache({ id, userId });
    return { data: id, error: undefined };
  } catch (error) {
    console.error("[sponsered-slider/action:update-sponsered-slider] failed", error);
    return {
      data: undefined,
      error: {
        title: "Update sponsored slider failed",
        detail: error instanceof Error ? error.message : "Could not update sponsored slider item.",
        status: 500,
      } as any,
    };
  }
};

export const updateSponseredSliderAction = createAuthenticatedSafeAction(UpdateSponseredSliderSchema, handler);

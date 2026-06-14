"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateSponseredSliderCache } from "../../db/cache";
import { deleteSponseredSlider } from "../../lib/sponsered-slider-db";
import { DeleteSponseredSliderSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  console.log("[sponsered-slider/action:delete-sponsered-slider] received", { input, userId });
  try {
    const id = await deleteSponseredSlider(input.sliderId);
    revalidateSponseredSliderCache({ id, userId });
    return { data: id, error: undefined };
  } catch (error) {
    console.error("[sponsered-slider/action:delete-sponsered-slider] failed", error);
    return {
      data: undefined,
      error: {
        title: "Delete sponsored slider failed",
        detail: error instanceof Error ? error.message : "Could not delete sponsored slider item.",
        status: 500,
      } as any,
    };
  }
};

export const deleteSponseredSliderAction = createAuthenticatedSafeAction(DeleteSponseredSliderSchema, handler);

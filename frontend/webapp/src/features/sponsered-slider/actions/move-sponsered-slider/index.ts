"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateSponseredSliderCache } from "../../db/cache";
import { moveSponseredSlider } from "../../lib/sponsered-slider-db";
import { MoveSponseredSliderSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  console.log("[sponsered-slider/action:move-sponsered-slider] received", { input, userId });
  try {
    const id = await moveSponseredSlider(input.sliderId, input.direction);
    revalidateSponseredSliderCache({ id, userId });
    return { data: id, error: undefined };
  } catch (error) {
    console.error("[sponsered-slider/action:move-sponsered-slider] failed", error);
    return {
      data: undefined,
      error: {
        title: "Move sponsored slider failed",
        detail: error instanceof Error ? error.message : "Could not reorder sponsored slider item.",
        status: 500,
      } as any,
    };
  }
};

export const moveSponseredSliderAction = createAuthenticatedSafeAction(MoveSponseredSliderSchema, handler);

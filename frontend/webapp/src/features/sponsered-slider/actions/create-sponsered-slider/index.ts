"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateSponseredSliderCache } from "../../db/cache";
import { createSponseredSlider } from "../../lib/sponsered-slider-db";
import { CreateSponseredSliderSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  console.log("[sponsered-slider/action:create-sponsered-slider] received", { input, userId });
  try {
    const id = await createSponseredSlider(input);
    revalidateSponseredSliderCache({ id, userId });
    return { data: id, error: undefined };
  } catch (error) {
    console.error("[sponsered-slider/action:create-sponsered-slider] failed", error);
    return {
      data: undefined,
      error: {
        title: "Create sponsored slider failed",
        detail: error instanceof Error ? error.message : "Could not create sponsored slider item.",
        status: 500,
      } as any,
    };
  }
};

export const createSponseredSliderAction = createAuthenticatedSafeAction(CreateSponseredSliderSchema, handler);

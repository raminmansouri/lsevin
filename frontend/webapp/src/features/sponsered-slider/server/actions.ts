"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createSponseredSlider,
  deleteSponseredSlider,
  updateSponseredSlider,
} from "./repository";
import { SponseredSliderInputSchema, type SponseredSliderFormValues } from "./schema";

export type SponseredSliderActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function flattenFieldErrors(error: unknown): Record<string, string[]> {
  if (!error || typeof error !== "object" || !("flatten" in error)) return {};
  const flattened = (error as { flatten: () => { fieldErrors: Record<string, string[]> } }).flatten();
  return flattened.fieldErrors;
}

function revalidateSponseredSlider() {
  revalidatePath("/admin/sponsered-slider");
  revalidatePath("/");
  revalidatePath("/n/app/mobile");
}

export async function saveSponseredSliderAction(input: SponseredSliderFormValues & { id?: string }): Promise<SponseredSliderActionState> {
  const parsed = SponseredSliderInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please review the highlighted fields.",
      fieldErrors: flattenFieldErrors(parsed.error),
    };
  }

  try {
    if (input.id) {
      await updateSponseredSlider({ ...parsed.data, id: input.id });
    } else {
      await createSponseredSlider(parsed.data);
    }

    revalidateSponseredSlider();
    return { ok: true, message: "Slider saved." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to save slider.",
    };
  }
}

export async function deleteSponseredSliderAction(id: string) {
  await deleteSponseredSlider(id);
  revalidateSponseredSlider();
  redirect("/admin/sponsered-slider");
}

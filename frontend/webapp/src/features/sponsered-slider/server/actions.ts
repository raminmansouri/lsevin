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

/**
 * Slides are now rendered from several placements across the site (home, search
 * results, explore, categories, offers, packages, provider/service pages, shop),
 * and most of those routes are `force-static` with hourly ISR. Revalidating a
 * handful of literal paths missed all of them twice over: the routes are locale
 * prefixed (`/fa/n/app/mobile/home`, never `/n/app/mobile`), and a new placement
 * would need another line here to ever show up.
 *
 * `revalidatePath("/", "layout")` clears the route cache for the whole app --
 * the same purge the admin cache tool performs -- so an edit is visible on every
 * page that hosts a slot, whichever locale it is viewed in.
 */
function revalidateSponseredSlider() {
  revalidatePath("/admin/sponsored-slider");
  revalidatePath("/", "layout");
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
  redirect("/admin/sponsored-slider");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  createSpecialPackage,
  deleteSpecialPackage,
  updateSpecialPackage,
} from "./repository";
import { SpecialPackageInputSchema, type SpecialPackageFormValues } from "./schema";

export type SpecialPackageActionState = {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string[]>;
};

function flattenFieldErrors(error: unknown): Record<string, string[]> {
  if (!error || typeof error !== "object" || !("flatten" in error)) return {};
  const flattened = (error as { flatten: () => { fieldErrors: Record<string, string[]> } }).flatten();
  return flattened.fieldErrors;
}

function revalidateSpecialPackages() {
  revalidatePath("/admin/special-packages");
  revalidatePath("/n/app/mobile/home");
  revalidatePath("/n/app/mobile/packages");
}

export async function saveSpecialPackageAction(
  input: SpecialPackageFormValues & { id?: string }
): Promise<SpecialPackageActionState> {
  const parsed = SpecialPackageInputSchema.safeParse(input);

  if (!parsed.success) {
    return {
      ok: false,
      message: "Please review the highlighted fields.",
      fieldErrors: flattenFieldErrors(parsed.error),
    };
  }

  try {
    if (input.id) {
      await updateSpecialPackage(input.id, parsed.data);
    } else {
      await createSpecialPackage(parsed.data);
    }

    revalidateSpecialPackages();
    return { ok: true, message: "Package saved." };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to save package.",
    };
  }
}

export async function deleteSpecialPackageAction(id: string) {
  await deleteSpecialPackage(id);
  revalidateSpecialPackages();
  redirect("/admin/special-packages");
}

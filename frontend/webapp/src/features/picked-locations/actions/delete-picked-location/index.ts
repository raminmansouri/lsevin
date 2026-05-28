"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, deletePickedLocationInDb } from "../../db/picked-location-repository";
import { revalidatePickedLocationCache } from "../../db/cache";
import { DeletePickedLocationSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  try {
    const deleted = await deletePickedLocationInDb(input.pickedLocationId);
    revalidatePickedLocationCache(input.pickedLocationId);
    return { data: deleted, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to delete picked location.") as ReturnType;
  }
};

export const deletePickedLocationAction = createAuthenticatedSafeAction(
  DeletePickedLocationSchema,
  handler,
  { adminRequired: true },
);

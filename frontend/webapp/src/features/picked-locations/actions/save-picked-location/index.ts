"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, savePickedLocationInDb } from "../../db/picked-location-repository";
import { revalidatePickedLocationCache } from "../../db/cache";
import { SavePickedLocationSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  try {
    const id = await savePickedLocationInDb(input);
    revalidatePickedLocationCache(id);
    return { data: id, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to save picked location.") as ReturnType;
  }
};

export const savePickedLocationAction = createAuthenticatedSafeAction(
  SavePickedLocationSchema,
  handler,
  { adminRequired: true },
);

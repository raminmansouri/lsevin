"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateStaffCache } from "../../db/cache";
import { updateStaff } from "../../lib/staff-db";
import { UpdateStaffSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string
): Promise<ReturnType> => {
  try {
    const id = await updateStaff(input);
    revalidateStaffCache({ id, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Update staff failed",
        detail: error instanceof Error ? error.message : "Could not update staff.",
        status: 500,
      } as any,
    };
  }
};

export const updateStaffAction = createAuthenticatedSafeAction(UpdateStaffSchema, handler);

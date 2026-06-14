"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateStaffCache } from "../../db/cache";
import { deleteStaffOrDeactivate } from "../../lib/staff-db";
import { DeleteStaffSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string
): Promise<ReturnType> => {
  try {
    const result = await deleteStaffOrDeactivate(input.staffId);
    revalidateStaffCache({ id: input.staffId, userId });
    return { data: result, error: undefined };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Delete staff failed",
        detail: error instanceof Error ? error.message : "Could not delete staff.",
        status: 500,
      } as any,
    };
  }
};

export const deleteStaffAction = createAuthenticatedSafeAction(DeleteStaffSchema, handler);

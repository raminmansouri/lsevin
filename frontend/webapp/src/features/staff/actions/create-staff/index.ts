"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateStaffCache } from "../../db/cache";
import { createStaff } from "../../lib/staff-db";
import { CreateStaffSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string
): Promise<ReturnType> => {
  try {
    const id = await createStaff(input);
    revalidateStaffCache({ id, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Create staff failed",
        detail: error instanceof Error ? error.message : "Could not create staff.",
        status: 500,
      } as any,
    };
  }
};

export const createStaffAction = createAuthenticatedSafeAction(CreateStaffSchema, handler);

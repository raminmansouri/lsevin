"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateStaffCache } from "../../db/cache";
import { setStaffActivation } from "../../lib/staff-db";
import { ChangeStaffActivationSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string
): Promise<ReturnType> => {
  try {
    const data = await setStaffActivation(input.staffId, input.isActive);
    revalidateStaffCache({ id: input.staffId, userId });
    return { data, error: undefined };
  } catch (error) {
    return {
      data: undefined,
      error: {
        title: "Status update failed",
        detail: error instanceof Error ? error.message : "Could not update staff status.",
        status: 500,
      } as any,
    };
  }
};

export const changeStaffActivationAction = createAuthenticatedSafeAction(ChangeStaffActivationSchema, handler);

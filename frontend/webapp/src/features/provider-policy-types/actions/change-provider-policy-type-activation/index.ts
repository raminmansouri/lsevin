"use server";

import { revalidatePath } from "next/cache";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { setProviderPolicyTypeActivation } from "../../lib/provider-policy-types-db";
import { ChangeProviderPolicyTypeActivationSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  try {
    const data = await setProviderPolicyTypeActivation(input.id, input.isActive);
    revalidatePath("/admin/provider-policy-types");
    return { data, error: undefined };
  } catch (error) {
    return { data: undefined, error: { title: "Status update failed", detail: error instanceof Error ? error.message : "Could not update provider policy type status.", status: 500 } as any };
  }
};

export const changeProviderPolicyTypeActivationAction = createAuthenticatedSafeAction(ChangeProviderPolicyTypeActivationSchema, handler);

"use server";

import { revalidatePath } from "next/cache";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { updateProviderPolicyType } from "../../lib/provider-policy-types-db";
import { UpdateProviderPolicyTypeSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  try {
    const id = await updateProviderPolicyType(input);
    revalidatePath("/admin/provider-policy-types");
    revalidatePath(`/admin/provider-policy-types/${id}/update`);
    return { data: id, error: undefined };
  } catch (error) {
    return { data: undefined, error: { title: "Update provider policy type failed", detail: error instanceof Error ? error.message : "Could not update provider policy type.", status: 500 } as any };
  }
};

export const updateProviderPolicyTypeAction = createAuthenticatedSafeAction(UpdateProviderPolicyTypeSchema, handler);

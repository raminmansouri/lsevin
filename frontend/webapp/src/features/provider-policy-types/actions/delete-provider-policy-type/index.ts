"use server";

import { revalidatePath } from "next/cache";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { deleteProviderPolicyType } from "../../lib/provider-policy-types-db";
import { DeleteProviderPolicyTypeSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  try {
    const data = await deleteProviderPolicyType(input.id);
    revalidatePath("/admin/provider-policy-types");
    return { data, error: undefined };
  } catch (error) {
    return { data: undefined, error: { title: "Delete provider policy type failed", detail: error instanceof Error ? error.message : "Could not delete provider policy type.", status: 500 } as any };
  }
};

export const deleteProviderPolicyTypeAction = createAuthenticatedSafeAction(DeleteProviderPolicyTypeSchema, handler);

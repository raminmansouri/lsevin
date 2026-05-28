"use server";

import { revalidatePath } from "next/cache";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { createProviderPolicyType } from "../../lib/provider-policy-types-db";
import { CreateProviderPolicyTypeSchema } from "./schema";
import type { InputType, ReturnType } from "./types";

const handler = async (input: InputType): Promise<ReturnType> => {
  try {
    const id = await createProviderPolicyType(input);
    revalidatePath("/admin/provider-policy-types");
    return { data: id, error: undefined };
  } catch (error) {
    return { data: undefined, error: { title: "Create provider policy type failed", detail: error instanceof Error ? error.message : "Could not create provider policy type.", status: 500 } as any };
  }
};

export const createProviderPolicyTypeAction = createAuthenticatedSafeAction(CreateProviderPolicyTypeSchema, handler);

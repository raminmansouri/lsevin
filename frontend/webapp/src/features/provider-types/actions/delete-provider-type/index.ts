
"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateProviderTypeCache } from "../../db/cache";
import { deleteProviderType, providerTypeProblem } from "../../db/provider-types.repository";
import { DeleteProviderTypeSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string
): Promise<ReturnType> => {
  try {
    const deleted = await deleteProviderType(input.providerTypeId);
    revalidateProviderTypeCache({ id: input.providerTypeId, userId });
    return { data: deleted, error: undefined };
  } catch (error) {
    return { data: undefined, error: providerTypeProblem(error) as any };
  }
};

export const deleteProviderTypeAction = createAuthenticatedSafeAction(
  DeleteProviderTypeSchema,
  handler
);

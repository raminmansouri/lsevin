
"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateProviderTypeCache } from "../../db/cache";
import { providerTypeProblem, removeProviderAttributeDefinition } from "../../db/provider-types.repository";
import { RemoveProviderAttributeDefinitionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string
): Promise<ReturnType> => {
  try {
    const data = await removeProviderAttributeDefinition(input.providerTypeId, input.attributeDefinitionId);
    revalidateProviderTypeCache({ id: input.providerTypeId, userId });
    return { data: data.toString(), error: undefined };
  } catch (error) {
    return { data: undefined, error: providerTypeProblem(error) as any };
  }
};

export const removeProviderAttributeDefinitionAction =
  createAuthenticatedSafeAction(RemoveProviderAttributeDefinitionSchema, handler);

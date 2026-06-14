
"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateProviderTypeCache } from "../../db/cache";
import { providerTypeProblem, updateProviderAttributeDefinition } from "../../db/provider-types.repository";
import { UpdateProviderAttributeDefinitionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string
): Promise<ReturnType> => {
  try {
    const { providerTypeId, attributeDefinitionId, ...requestData } = input;
    const id = await updateProviderAttributeDefinition(providerTypeId, attributeDefinitionId, requestData);
    revalidateProviderTypeCache({ id: providerTypeId, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return { data: undefined, error: providerTypeProblem(error) as any };
  }
};

export const updateProviderAttributeDefinitionAction =
  createAuthenticatedSafeAction(UpdateProviderAttributeDefinitionSchema, handler);


"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateProviderTypeCache } from "../../db/cache";
import { createProviderAttributeDefinition, providerTypeProblem } from "../../db/provider-types.repository";
import { AddProviderAttributeDefinitionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string
): Promise<ReturnType> => {
  try {
    const { providerTypeId, ...requestData } = input;
    const id = await createProviderAttributeDefinition(providerTypeId, requestData);
    revalidateProviderTypeCache({ id: providerTypeId, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return { data: undefined, error: providerTypeProblem(error) as any };
  }
};

export const addProviderAttributeDefinitionAction =
  createAuthenticatedSafeAction(AddProviderAttributeDefinitionSchema, handler);

"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, removeServiceAttributeDefinitionInDb } from "../../db/service-definition-repository";
import { revalidateServiceDefinitionCache } from "../../db/cache";
import { RemoveServiceAttributeDefinitionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  try {
    await removeServiceAttributeDefinitionInDb(input.serviceDefinitionId, input.attributeDefinitionId);
    revalidateServiceDefinitionCache({ id: input.serviceDefinitionId, userId });
    return { data: input.attributeDefinitionId, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to remove service attribute.") as ReturnType;
  }
};

export const removeServiceAttributeDefinitionAction =
  createAuthenticatedSafeAction(RemoveServiceAttributeDefinitionSchema, handler);

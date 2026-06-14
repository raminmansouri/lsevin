"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, updateServiceAttributeDefinitionInDb } from "../../db/service-definition-repository";
import { revalidateServiceDefinitionCache } from "../../db/cache";
import { UpdateServiceAttributeDefinitionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  try {
    const id = await updateServiceAttributeDefinitionInDb(input);
    revalidateServiceDefinitionCache({ id: input.serviceDefinitionId, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to update service attribute.") as ReturnType;
  }
};

export const updateServiceAttributeDefinitionAction =
  createAuthenticatedSafeAction(UpdateServiceAttributeDefinitionSchema, handler);

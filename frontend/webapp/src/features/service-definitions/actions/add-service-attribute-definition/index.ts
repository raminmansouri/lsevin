"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, addServiceAttributeDefinitionInDb } from "../../db/service-definition-repository";
import { revalidateServiceDefinitionCache } from "../../db/cache";
import { AddServiceAttributeDefinitionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  try {
    const id = await addServiceAttributeDefinitionInDb(input);
    revalidateServiceDefinitionCache({ id: input.serviceDefinitionId, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to add service attribute.") as ReturnType;
  }
};

export const addServiceAttributeDefinitionAction =
  createAuthenticatedSafeAction(AddServiceAttributeDefinitionSchema, handler);

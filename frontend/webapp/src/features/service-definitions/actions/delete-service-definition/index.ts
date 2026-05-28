"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, deleteServiceDefinitionInDb } from "../../db/service-definition-repository";
import { revalidateServiceDefinitionCache } from "../../db/cache";
import { DeleteServiceDefinitionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  try {
    const deleted = await deleteServiceDefinitionInDb(input.serviceDefinitionId);
    revalidateServiceDefinitionCache({ id: input.serviceDefinitionId, userId });
    return { data: deleted, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to delete service definition.") as ReturnType;
  }
};

export const deleteServiceDefinitionAction = createAuthenticatedSafeAction(
  DeleteServiceDefinitionSchema,
  handler
);

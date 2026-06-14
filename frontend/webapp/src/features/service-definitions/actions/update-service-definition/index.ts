"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, updateServiceDefinitionInDb } from "../../db/service-definition-repository";
import { revalidateServiceDefinitionCache } from "../../db/cache";
import { UpdateServiceDefinitionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  try {
    const id = await updateServiceDefinitionInDb(input);
    revalidateServiceDefinitionCache({ id, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to update service definition.") as ReturnType;
  }
};

export const updateServiceDefinitionAction = createAuthenticatedSafeAction(
  UpdateServiceDefinitionSchema,
  handler
);

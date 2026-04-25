"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { createServiceDefinitionInDb, actionFail } from "../../db/service-definition-repository";
import { revalidateServiceDefinitionCache } from "../../db/cache";
import { CreateServiceDefinitionSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  try {
    const id = await createServiceDefinitionInDb(input);
    revalidateServiceDefinitionCache({ id, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to create service definition.") as ReturnType;
  }
};

export const createServiceDefinitionAction = createAuthenticatedSafeAction(
  CreateServiceDefinitionSchema,
  handler
);

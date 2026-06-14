"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, updateServiceRequirementInDb } from "../../db/service-definition-repository";
import { revalidateServiceDefinitionCache } from "../../db/cache";
import { UpdateServiceRequirementSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  try {
    const id = await updateServiceRequirementInDb(input);
    revalidateServiceDefinitionCache({ id: input.serviceDefinitionId, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to update service requirement.") as ReturnType;
  }
};

export const updateServiceRequirementAction = createAuthenticatedSafeAction(
  UpdateServiceRequirementSchema,
  handler
);

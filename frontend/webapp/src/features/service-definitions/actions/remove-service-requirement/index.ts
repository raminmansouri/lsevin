"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, removeServiceRequirementInDb } from "../../db/service-definition-repository";
import { revalidateServiceDefinitionCache } from "../../db/cache";
import { RemoveServiceRequirementSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  try {
    await removeServiceRequirementInDb(input.serviceDefinitionId, input.requirementIndex);
    revalidateServiceDefinitionCache({ id: input.serviceDefinitionId, userId });
    return { data: String(input.requirementIndex), error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to remove service requirement.") as ReturnType;
  }
};

export const removeServiceRequirementAction = createAuthenticatedSafeAction(
  RemoveServiceRequirementSchema,
  handler
);

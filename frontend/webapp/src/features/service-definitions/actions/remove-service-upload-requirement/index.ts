"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, removeServiceUploadRequirementInDb } from "../../db/service-definition-repository";
import { revalidateServiceDefinitionCache } from "../../db/cache";
import { RemoveServiceUploadRequirementSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  try {
    await removeServiceUploadRequirementInDb(input.serviceDefinitionId, input.requirementId);
    revalidateServiceDefinitionCache({ id: input.serviceDefinitionId, userId });
    return { data: input.requirementId, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to remove upload requirement.") as ReturnType;
  }
};

export const removeServiceUploadRequirementAction = createAuthenticatedSafeAction(
  RemoveServiceUploadRequirementSchema,
  handler
);

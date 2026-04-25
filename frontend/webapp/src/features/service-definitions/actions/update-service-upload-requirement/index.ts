"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, updateServiceUploadRequirementInDb } from "../../db/service-definition-repository";
import { revalidateServiceDefinitionCache } from "../../db/cache";
import { UpdateServiceUploadRequirementSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  try {
    const id = await updateServiceUploadRequirementInDb(input);
    revalidateServiceDefinitionCache({ id: input.serviceDefinitionId, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to update upload requirement.") as ReturnType;
  }
};

export const updateServiceUploadRequirementAction = createAuthenticatedSafeAction(
  UpdateServiceUploadRequirementSchema,
  handler
);

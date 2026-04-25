"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, addServiceUploadRequirementInDb } from "../../db/service-definition-repository";
import { revalidateServiceDefinitionCache } from "../../db/cache";
import { AddServiceUploadRequirementSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  try {
    const id = await addServiceUploadRequirementInDb(input);
    revalidateServiceDefinitionCache({ id: input.serviceDefinitionId, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to add upload requirement.") as ReturnType;
  }
};

export const addServiceUploadRequirementAction = createAuthenticatedSafeAction(
  AddServiceUploadRequirementSchema,
  handler
);

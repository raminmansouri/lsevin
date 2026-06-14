"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, addServiceRequirementInDb } from "../../db/service-definition-repository";
import { revalidateServiceDefinitionCache } from "../../db/cache";
import { AddServiceRequirementSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  try {
    const id = await addServiceRequirementInDb(input);
    revalidateServiceDefinitionCache({ id: input.serviceDefinitionId, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to add service requirement.") as ReturnType;
  }
};

export const addServiceRequirementAction = createAuthenticatedSafeAction(
  AddServiceRequirementSchema,
  handler
);

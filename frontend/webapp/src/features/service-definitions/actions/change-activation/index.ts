"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { actionFail, setServiceDefinitionActivationInDb } from "../../db/service-definition-repository";
import { revalidateServiceDefinitionCache } from "../../db/cache";
import { ChangeServiceDefinitionActivationSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (input: InputType, _token: string, userId: string): Promise<ReturnType> => {
  try {
    const id = await setServiceDefinitionActivationInDb(input.serviceDefinitionId, input.isActive);
    revalidateServiceDefinitionCache({ id, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return actionFail(error, "Failed to change activation status.") as ReturnType;
  }
};

export const changeServiceDefinitionActivationAction =
  createAuthenticatedSafeAction(ChangeServiceDefinitionActivationSchema, handler);

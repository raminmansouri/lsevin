
"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateProviderTypeCache } from "../../db/cache";
import { changeProviderTypeActivation, providerTypeProblem } from "../../db/provider-types.repository";
import { ChangeProviderTypeActivationSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string
): Promise<ReturnType> => {
  try {
    const data = await changeProviderTypeActivation(input.providerTypeId, input.isActive);
    revalidateProviderTypeCache({ id: input.providerTypeId, userId });
    return { data, error: undefined };
  } catch (error) {
    return { data: undefined, error: providerTypeProblem(error) as any };
  }
};

export const changeProviderTypeActivationAction = createAuthenticatedSafeAction(
  ChangeProviderTypeActivationSchema,
  handler
);


"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateProviderTypeCache } from "../../db/cache";
import { createProviderType, providerTypeProblem } from "../../db/provider-types.repository";
import { CreateProviderTypeSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string
): Promise<ReturnType> => {
  try {
    const id = await createProviderType(input);
    revalidateProviderTypeCache({ id, userId });
    return { data: id, error: undefined };
  } catch (error) {
    return { data: undefined, error: providerTypeProblem(error) as any };
  }
};

export const createProviderTypeAction = createAuthenticatedSafeAction(
  CreateProviderTypeSchema,
  handler
);

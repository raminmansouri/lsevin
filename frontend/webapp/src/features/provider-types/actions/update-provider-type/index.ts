
"use server";

import { createAuthenticatedSafeAction } from "@/lib/safe-action";

import { revalidateProviderTypeCache } from "../../db/cache";
import { providerTypeProblem, updateProviderType } from "../../db/provider-types.repository";
import { UpdateProviderTypeSchema } from "./schema";
import { InputType, ReturnType } from "./types";

const handler = async (
  input: InputType,
  _token: string,
  userId: string
): Promise<ReturnType> => {
  try {
    const updated = await updateProviderType(input);
    if (!updated) {
      return {
        data: undefined,
        error: { title: "Not found", detail: "Provider type was not found.", status: 404 } as any,
      };
    }
    revalidateProviderTypeCache({ id: input.providerTypeId, userId });
    return { data: input.providerTypeId!, error: undefined };
  } catch (error) {
    return { data: undefined, error: providerTypeProblem(error) as any };
  }
};

export const updateProviderTypeAction = createAuthenticatedSafeAction(
  UpdateProviderTypeSchema,
  handler
);

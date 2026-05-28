"use server";

import { deleteData } from "@/config/http/http-service.server";
import { ADMIN_BASE_PATH, CATEGORY_MODULE_BASE_PATH } from "@/features/shared/types/constants";
import { createAuthenticatedSafeAction } from "@/lib/safe-action";
import { LocaleHeaderTypes } from "@/types/common";
import { providerServiceAddonSchema, serviceFaqSchema, serviceIncludedSchema, serviceProcessSchema, addonProviderTypeSchema, serviceAttributeDefinitionSchema, serviceAttributeOptionSchema, serviceAttributeValueSchema } from "../../schemas";

const schema = serviceAttributeOptionSchema.pick({ serviceDefinitionId: true, attributeDefinitionId: true, id: true });
type InputType = import("zod").infer<typeof schema>;
type ReturnType = { data?: unknown; error?: { title?: string; detail?: string } };

const handler = async (input: InputType, token: string, _userId: string, locale: LocaleHeaderTypes): Promise<ReturnType> => {
  const { data, error } = await deleteData<unknown>(`${CATEGORY_MODULE_BASE_PATH}/${ADMIN_BASE_PATH}/service-definitions/${input.serviceDefinitionId}/attribute-definitions/${input.attributeDefinitionId}/options/${input.id}`, { token, locale });
  return { data, error };
};

export const deleteServiceAttributeOptionAction = createAuthenticatedSafeAction(schema, handler);

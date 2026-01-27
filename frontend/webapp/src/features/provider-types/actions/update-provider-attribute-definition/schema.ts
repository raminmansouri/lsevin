import { z } from "zod/v4";

import { ProviderAttributeDefinitionCreateSchema } from "../../schemas";

export const UpdateProviderAttributeDefinitionSchema =
  ProviderAttributeDefinitionCreateSchema.extend({
    providerTypeId: z.guid(),
    attributeDefinitionId: z.guid(),
  });

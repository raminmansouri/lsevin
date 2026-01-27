import { z } from "zod/v4";

import { ProviderAttributeDefinitionCreateSchema } from "../../schemas";

export const AddProviderAttributeDefinitionSchema =
  ProviderAttributeDefinitionCreateSchema.extend({
    providerTypeId: z.guid(),
  });

import { z } from "zod/v4";

import { ServiceAttributeDefinitionUpdateSchema } from "../../schemas";

export const UpdateServiceAttributeDefinitionSchema =
  ServiceAttributeDefinitionUpdateSchema.extend({
    serviceDefinitionId: z.guid(),
    attributeDefinitionId: z.guid(),
  });

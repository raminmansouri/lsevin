import { z } from "zod/v4";

import { ServiceAttributeDefinitionCreateSchema } from "../../schemas";

export const AddServiceAttributeDefinitionSchema =
  ServiceAttributeDefinitionCreateSchema.extend({
    serviceDefinitionId: z.guid(),
  });

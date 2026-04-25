import { z } from "zod/v4";

import { ServiceRequirementCreateSchema } from "../../schemas";

export const UpdateServiceRequirementSchema =
  ServiceRequirementCreateSchema.extend({
    serviceDefinitionId: z.guid(),
    requirementIndex: z.coerce.number().int().min(0),
  });

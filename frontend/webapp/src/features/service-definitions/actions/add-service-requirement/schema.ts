import { z } from "zod/v4";

import { ServiceRequirementCreateSchema } from "../../schemas";

export const AddServiceRequirementSchema =
  ServiceRequirementCreateSchema.extend({
    serviceDefinitionId: z.guid(),
  });

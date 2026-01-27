import { z } from "zod/v4";

export const ChangeServiceDefinitionActivationSchema = z.object({
  serviceDefinitionId: z.guid(),
  isActive: z.boolean(),
});

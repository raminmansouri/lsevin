import { z } from "zod/v4";

export const DeleteServiceDefinitionSchema = z.object({
  serviceDefinitionId: z.guid(),
});

export type DeleteServiceDefinitionInput = z.infer<
  typeof DeleteServiceDefinitionSchema
>;

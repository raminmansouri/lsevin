import { z } from "zod/v4";
import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

export const ProviderPolicyTypeSchema = z.object({
  id: z.guid().optional(),
  code: z.string().trim().min(2).max(80).regex(/^[a-z0-9][a-z0-9_-]*$/, "Use lowercase letters, numbers, dash or underscore."),
  nameTranslations: LocalizedContentSchema,
  descriptionTranslations: LocalizedContentSchema,
  displayOrder: z.coerce.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const CreateProviderPolicyTypeSchema = ProviderPolicyTypeSchema.omit({ id: true }).extend({ id: z.undefined().optional() });
export const UpdateProviderPolicyTypeSchema = ProviderPolicyTypeSchema.extend({ id: z.guid() });
export const DeleteProviderPolicyTypeSchema = z.object({ id: z.guid() });
export const ChangeProviderPolicyTypeActivationSchema = z.object({ id: z.guid(), isActive: z.boolean() });

export type ProviderPolicyTypeFormInput = z.infer<typeof ProviderPolicyTypeSchema>;
export type CreateProviderPolicyTypeInput = z.infer<typeof CreateProviderPolicyTypeSchema>;
export type UpdateProviderPolicyTypeInput = z.infer<typeof UpdateProviderPolicyTypeSchema>;
export type DeleteProviderPolicyTypeInput = z.infer<typeof DeleteProviderPolicyTypeSchema>;
export type ChangeProviderPolicyTypeActivationInput = z.infer<typeof ChangeProviderPolicyTypeActivationSchema>;

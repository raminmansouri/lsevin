import { z } from 'zod/v4';

import { OptionalLocalizedContentSchema } from '@/features/shared/schemas/localization';

const jsonObjectString = z
  .string()
  .optional()
  .nullable()
  .transform((value) => (value && value.trim().length ? value : '{}'))
  .refine((value) => {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed);
    } catch {
      return false;
    }
  }, 'Metadata must be a valid JSON object.');

export const HomeSectionFormSchema = z.object({
  sectionKey: z.string().trim().min(1),
  badge: OptionalLocalizedContentSchema.default({ translations: {} }),
  title: OptionalLocalizedContentSchema.default({ translations: {} }),
  subtitle: OptionalLocalizedContentSchema.default({ translations: {} }),
  description: OptionalLocalizedContentSchema.default({ translations: {} }),
  buttonLabel: OptionalLocalizedContentSchema.default({ translations: {} }),
  buttonHref: z.string().trim().optional().nullable().default(''),
  imageUrl: z.string().trim().optional().nullable().default(''),
  iconName: z.string().trim().optional().nullable().default(''),
  displayOrder: z.coerce.number().int().default(0),
  isActive: z.coerce.boolean().default(true),
  metadata: jsonObjectString,
});

export type HomeSectionFormInput = z.infer<typeof HomeSectionFormSchema>;

import { z } from "zod/v4";

import {
  normalizeLocalizedContentForDatabase,
  normalizeMediaPickerValue,
  normalizeOptionalLocalizedContentForDatabase,
} from "../lib/admin-form-normalizers";

export const adminTranslationsSchema = z.preprocess(
  normalizeLocalizedContentForDatabase,
  z.record(z.string(), z.string()).default({})
);

export const adminNullableTranslationsSchema = z.preprocess(
  normalizeOptionalLocalizedContentForDatabase,
  z.record(z.string(), z.string()).nullable().optional()
);
export const adminUuidSchema = z.guid();
export const adminOptionalUuidSchema = z.guid().optional().nullable();

export const adminNullableMediaValueSchema = z.preprocess(
  (value) => {
    const normalized = normalizeMediaPickerValue(value);
    return normalized || null;
  },
  z.string().max(500).nullable().optional()
);

export const saveServiceProviderProfileSchema = z.object({
  serviceProviderId: adminOptionalUuidSchema,
  name: adminTranslationsSchema,
  description: adminTranslationsSchema,
  providerTypeId: adminUuidSchema,
  isActive: z.boolean().default(true),
  country: z.string().trim().min(1, "Please select a country.").max(15),
  city: z.string().trim().min(1, "Please select a city.").max(15),
  street: adminNullableTranslationsSchema,
  detail: adminNullableTranslationsSchema,
  zipCode: z.string().max(50).optional().nullable(),
  email: z.email(),
  phoneNumberCountryCode: z.string().min(1).max(5),
  phoneNumber: z.string().min(1).max(20),
  gradeId: z.coerce.number().int().positive().optional().nullable(),
  latitude: z.coerce.number().min(-90).max(90).optional().nullable(),
  longitude: z.coerce.number().min(-180).max(180).optional().nullable(),
  rating: z.coerce.number().min(0).max(5).default(0),
  reviewCount: z.coerce.number().int().min(0).default(0),
  accredited: z.boolean().default(false),
  responseTime: z.string().max(50).optional().nullable(),
  establishedYear: z.coerce.number().int().min(1800).max(2200).optional().nullable(),
  totalPatients: z.string().max(50).optional().nullable(),
  successRate: z.string().max(50).optional().nullable(),
  languagesText: z.string().optional().nullable(),
  isSponsored: z.boolean().default(false),
  sponsoredTag: z.string().max(50).optional().nullable(),
  specialtiesText: z.string().optional().nullable(),
  featuredScore: z.coerce.number().min(0).default(0),
  // International price coefficient (Prompt 2). Free positive number; null/empty =>
  // the provider uses the global finance.settings default.
  internationalPriceMultiplier: z.coerce.number().positive().optional().nullable(),
  imageUrl: adminNullableMediaValueSchema,
  timezoneId: z.string().min(1).default("UTC"),
});

export type SaveServiceProviderProfileInput = z.infer<typeof saveServiceProviderProfileSchema>;

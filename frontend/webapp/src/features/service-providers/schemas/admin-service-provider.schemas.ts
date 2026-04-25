import { z } from "zod/v4";

export const adminTranslationsSchema = z.record(z.string(), z.string()).default({});
export const adminNullableTranslationsSchema = adminTranslationsSchema.nullish();
export const adminUuidSchema = z.guid();
export const adminOptionalUuidSchema = z.guid().optional().nullable();

export const saveServiceProviderProfileSchema = z.object({
  serviceProviderId: adminOptionalUuidSchema,
  name: adminTranslationsSchema,
  description: adminTranslationsSchema,
  providerTypeId: adminUuidSchema,
  isActive: z.boolean().default(true),
  country: z.string().min(1).max(15),
  city: z.string().min(1).max(15),
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
  imageUrl: z.string().optional().nullable(),
  timezoneId: z.string().min(1).default("UTC"),
});

export type SaveServiceProviderProfileInput = z.infer<typeof saveServiceProviderProfileSchema>;

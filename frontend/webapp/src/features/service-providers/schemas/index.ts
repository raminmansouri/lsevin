import { z } from "zod/v4";

import { optionalCoordinatesSchema } from "@/features/shared/schemas/coordinates";
import {
  LocalizedContentSchema,
  OptionalLocalizedContentSchema,
} from "@/features/shared/schemas/localization";
import { phoneNumberSchema } from "@/features/shared/types/schemas";

import { ServiceProviderGrade } from "../types";

export const CreateServiceProviderSchema = z.object({
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  providerTypeId: z.guid(),
  city: z.string().trim().min(1, "Please select a city.").max(15),
  country: z.string().trim().min(1, "Please select a country.").max(15),
  street: OptionalLocalizedContentSchema.optional(),
  detail: OptionalLocalizedContentSchema.optional(),
  zipCode: z.string().max(50).optional(),
  coordinates: optionalCoordinatesSchema,
  email: z.email(),
  phoneNumber: phoneNumberSchema.optional(),
  phoneNumberCountryCode: z.string().max(3).optional(),
  grade: z.enum(ServiceProviderGrade).optional(),
  isActive: z.boolean(),
});

export const UpdateServiceProviderSchema = CreateServiceProviderSchema.extend({
  isActive: z.boolean(),
});

export const ChangeServiceProviderActivationSchema = z.object({
  isActive: z.boolean(),
});

// Form schema for frontend
export const ServiceProviderFormSchema = z.object({
  serviceProviderId: z.string().optional(),
  name: LocalizedContentSchema,
  description: LocalizedContentSchema,
  providerTypeId: z.guid(),
  country: z.string().trim().min(1, "Please select a country.").max(15),
  city: z.string().trim().min(1, "Please select a city.").max(15),
  street: OptionalLocalizedContentSchema.optional(),
  detail: OptionalLocalizedContentSchema.optional(),
  zipCode: z.string().max(50).optional(),
  coordinates: optionalCoordinatesSchema,
  email: z.email(),
  phoneNumber: phoneNumberSchema.optional(),
  phoneNumberCountryCode: z.string().max(3).optional(),
  grade: z.enum(ServiceProviderGrade).optional(),
  isActive: z.boolean(),
});

export type ServiceProviderFormInput = z.infer<
  typeof ServiceProviderFormSchema
>;

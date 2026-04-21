import { z } from "zod";

export const userPreferencesSchema = z.object({
  countryId: z.string().uuid().nullable().optional(),
  cityId: z.string().uuid().nullable().optional(),
  pickedLocationId: z.string().uuid().nullable().optional(),

  selectedSource: z.enum(["manual", "picked_location", "gps"]).default("manual"),

  useCurrentLocation: z.boolean().default(false),
  currentLatitude: z.number().nullable().optional(),
  currentLongitude: z.number().nullable().optional(),

  preferredLocale: z.string().min(2).max(10).default("en"),
  preferredCurrencyCode: z.string().length(3).default("USD"),
  preferredTheme: z.enum(["system", "light", "dark"]).default("system"),
  distanceUnit: z.enum(["km", "mi"]).default("km"),

  notificationsEnabled: z.boolean().default(true),
  marketingNotificationsEnabled: z.boolean().default(false),

  extraPreferences: z.record(z.any()).default({}),
});

export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
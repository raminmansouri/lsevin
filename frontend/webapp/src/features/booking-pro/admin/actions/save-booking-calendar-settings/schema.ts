import * as z from "zod/v4";

export const SaveBookingCalendarSettingsSchema = z.object({
  scopeType: z.enum(["global", "provider_type", "provider", "service_definition", "provider_service"]),
  scopeId: z.string().optional().nullable(),
  defaultCalendar: z.enum(["gregorian", "jalali"]),
  enabledCalendars: z.array(z.enum(["gregorian", "jalali"])).min(1),
  timezoneId: z.string().min(1).default("UTC"),
  weekStartsOn: z.coerce.number().int().min(0).max(6).default(6),
  isActive: z.boolean().default(true),
});

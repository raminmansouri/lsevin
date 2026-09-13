import * as z from "zod/v4";
import { isBookingTimeZone } from '@/features/booking-pro/lib/calendar';

export const SaveBookingCalendarSettingsSchema = z.object({
  scopeType: z.enum(["global", "provider_type", "provider", "service_definition", "provider_service"]),
  scopeId: z.string().optional().nullable(),
  defaultCalendar: z.enum(["gregorian", "jalali", "hijri"]),
  enabledCalendars: z.array(z.enum(["gregorian", "jalali", "hijri"])).min(1),
  timezoneId: z.string().refine(isBookingTimeZone).default("UTC"),
  weekStartsOn: z.coerce.number().int().min(0).max(6).default(6),
  isActive: z.boolean().default(true),
}).refine(value => value.enabledCalendars.includes(value.defaultCalendar), { path: ['defaultCalendar'] });

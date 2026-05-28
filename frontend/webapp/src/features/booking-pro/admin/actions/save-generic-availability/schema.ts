import * as z from "zod/v4";

const OptionalId = z.preprocess((value) => {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length ? text : undefined;
}, z.string().optional());

const RequiredId = z.preprocess((value) => {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}, z.string().min(1, "Please select an item."));

const TimeValue = z.preprocess((value) => {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length ? text : undefined;
}, z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional());

const DateValue = z.preprocess((value) => {
  if (value === null || value === undefined) return undefined;
  const text = String(value).trim();
  return text.length ? text : undefined;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional());

const DayOfWeeks = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return [];
  const raw = Array.isArray(value) ? value : [value];
  return raw
    .map((item) => Number(item))
    .filter((item) => Number.isInteger(item) && item >= 1 && item <= 7);
}, z.array(z.number().int().min(1).max(7)).default([]));

const OptionalPositiveInt = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return undefined;
  return Number(value);
}, z.number().int().positive().optional());

export const SaveGenericAvailabilityRuleSchema = z.object({
  id: OptionalId,
  targetType: z.enum(["provider", "provider_service", "service_definition", "staff", "provider_staff", "bookable_resource"]),
  targetId: RequiredId,
  serviceProviderId: OptionalId,
  providerServiceId: OptionalId,
  resourceId: OptionalId,
  dayOfWeek: z.preprocess((value) => {
    if (value === null || value === undefined || value === "") return undefined;
    return Number(value);
  }, z.number().int().min(1).max(7).optional()),
  dayOfWeeks: DayOfWeeks,
  specificDate: DateValue,
  startsAt: TimeValue,
  endsAt: TimeValue,
  isAvailable: z.coerce.boolean(),
  isActive: z.coerce.boolean().optional(),
  capacity: OptionalPositiveInt,
  slotIntervalMinutes: OptionalPositiveInt,
  minBookingMinutes: OptionalPositiveInt,
  maxBookingMinutes: OptionalPositiveInt,
  priority: z.preprocess((value) => {
    if (value === null || value === undefined || value === "") return undefined;
    return Number(value);
  }, z.number().int().optional()),
  timezoneId: z.preprocess((value) => {
    const text = String(value ?? "").trim();
    return text || "UTC";
  }, z.string().min(1).optional()),
  metadata: z.record(z.string(), z.unknown()).optional(),
}).refine((value) => Boolean(value.specificDate) || (value.dayOfWeeks?.length || value.dayOfWeek), {
  message: "Select at least one weekday or choose a specific date.",
  path: ["dayOfWeeks"],
}).refine((value) => {
  if (!value.startsAt || !value.endsAt) return true;
  return value.startsAt < value.endsAt;
}, {
  message: "End time must be after start time.",
  path: ["endsAt"],
});

export const SaveBookableResourceSchema = z.object({
  id: OptionalId,
  serviceProviderId: RequiredId,
  providerServiceId: OptionalId,
  resourceType: z.enum(["generic", "room", "bed", "seat", "table", "vehicle", "equipment", "unit"]),
  code: z.string().optional(),
  nameTranslations: z.record(z.string(), z.string()).optional(),
  descriptionTranslations: z.record(z.string(), z.string()).optional(),
  totalCapacity: z.coerce.number().int().positive(),
  isActive: z.coerce.boolean(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

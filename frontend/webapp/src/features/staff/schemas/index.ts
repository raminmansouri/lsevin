import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

import { DayOfWeek } from "../types";

// Base Staff schema with localized fields
export const StaffSchema = z.object({
  staffId: z.guid().optional(),
  name: LocalizedContentSchema, // Changed from z.string()
  biography: LocalizedContentSchema, // Changed from z.string()
  title: LocalizedContentSchema, // Changed from z.string()
  profileImageUrl: z.string().optional(),
  isActive: z.boolean(),
});

export const StaffFormSchema = StaffSchema;

// Staff Availability schema for adding/updating
export const StaffAvailabilityCreateSchema = z.object({
  dayOfWeek: z.enum(DayOfWeek),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be in HH:mm:ss format"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be in HH:mm:ss format"),
  isRecurring: z.boolean().default(true),
  specificDate: z.string().optional(),
  availabilityStatusId: z.number().int().min(1),
  notes: z.string().optional(),
});

export const StaffAvailabilityUpdateSchema =
  StaffAvailabilityCreateSchema.extend({
    availabilityId: z.guid(),
  });

// Staff Availability removal schema
export const StaffAvailabilityDeleteSchema = z.object({
  staffId: z.guid(),
  availabilityId: z.guid(),
});

// Staff Service schema with localized notes
export const StaffServiceCreateSchema = z.object({
  serviceDefinitionId: z.guid(),
  notes: LocalizedContentSchema, // Changed from z.string()
});

export const StaffServiceUpdateSchema = z.object({
  serviceId: z.guid(),
  isActive: z.boolean(),
  notes: LocalizedContentSchema,
  serviceDefinitionId: z.guid().optional(),
});

// Staff Service removal schema
export const StaffServiceDeleteSchema = z.object({
  staffId: z.guid(),
  serviceId: z.guid(),
});

// Type exports
export type StaffInput = z.infer<typeof StaffSchema>;
export type StaffFormInput = z.infer<typeof StaffFormSchema>;
export type StaffAvailabilityCreateInput = z.infer<
  typeof StaffAvailabilityCreateSchema
>;
export type StaffAvailabilityUpdateInput = z.infer<
  typeof StaffAvailabilityUpdateSchema
>;
export type StaffAvailabilityDeleteInput = z.infer<
  typeof StaffAvailabilityDeleteSchema
>;
export type StaffServiceCreateInput = z.infer<typeof StaffServiceCreateSchema>;
export type StaffServiceUpdateInput = z.infer<typeof StaffServiceUpdateSchema>;
export type StaffServiceDeleteInput = z.infer<typeof StaffServiceDeleteSchema>;

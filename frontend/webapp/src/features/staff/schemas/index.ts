import { z } from "zod/v4";

import { LocalizedContentSchema } from "@/features/shared/schemas/localization";

import { DayOfWeek } from "../types";

const optionalTrimmedString = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().optional()
);

const nullablePositiveYear = z.preprocess(
  (value) => (value === "" || value === null ? undefined : value),
  z.coerce.number().int().min(1900).max(2200).optional()
);

export const DayOfWeekSchema = z.enum(DayOfWeek);

export const StaffProviderAssignmentSchema = z.object({
  id: z.guid().optional(),
  serviceProviderId: z.guid(),
  notes: LocalizedContentSchema,
  isActive: z.boolean().default(true),
});

export const StaffServiceSchema = z.object({
  id: z.guid().optional(),
  serviceDefinitionId: z.guid(),
  isActive: z.boolean().default(true),
  notes: LocalizedContentSchema,
});

export const StaffAvailabilitySchema = z
  .object({
    id: z.guid().optional(),
    dayOfWeek: DayOfWeekSchema,
    startTime: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, "Use HH:mm:ss format."),
    endTime: z
      .string()
      .regex(/^\d{2}:\d{2}:\d{2}$/, "Use HH:mm:ss format."),
    isRecurring: z.boolean().default(true),
    specificDate: optionalTrimmedString,
    availabilityStatusId: z.coerce.number().int().min(1),
  })
  .refine((value) => value.startTime < value.endTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  })
  .refine((value) => value.isRecurring || !!value.specificDate, {
    message: "Specific date is required for non-recurring availability.",
    path: ["specificDate"],
  });

export const StaffEducationSchema = z.object({
  id: z.guid().optional(),
  degree: z.string().trim().min(1).max(200),
  institution: z.string().trim().min(1).max(250),
  year: nullablePositiveYear,
  imageUrl: optionalTrimmedString,
});

export const StaffCertificationSchema = z.object({
  id: z.guid().optional(),
  name: z.string().trim().min(1).max(200),
  issuer: optionalTrimmedString,
  isVerified: z.boolean().default(false),
  imageUrl: optionalTrimmedString,
});

export const StaffCredentialSchema = z.object({
  id: z.guid().optional(),
  credential: z.string().trim().min(1),
  isVerified: z.boolean().default(false),
  imageUrl: optionalTrimmedString,
});

export const StaffAchievementSchema = z.object({
  id: z.guid().optional(),
  icon: optionalTrimmedString,
  title: z.string().trim().min(1).max(200),
  organization: optionalTrimmedString,
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const StaffGalleryItemSchema = z.object({
  id: z.guid().optional(),
  title: LocalizedContentSchema,
  description: LocalizedContentSchema,
  url: z.string().trim().min(1).max(500),
  mediaType: z.string().trim().min(1).max(50).default("image"),
  displayOrder: z.coerce.number().int().min(0).default(0),
  isPrimary: z.boolean().default(false),
});

export const StaffBeforeAfterSchema = z.object({
  id: z.guid().optional(),
  beforeImage: z.string().trim().min(1).max(500),
  afterImage: z.string().trim().min(1).max(500),
  procedure: optionalTrimmedString,
  months: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().min(0).max(600).optional()
  ),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const StaffSchema = z.object({
  staffId: z.guid().optional(),
  name: LocalizedContentSchema,
  biography: LocalizedContentSchema,
  title: LocalizedContentSchema,
  profileImageUrl: optionalTrimmedString,
  isActive: z.boolean().default(true),
  experience: optionalTrimmedString,
  patients: optionalTrimmedString,
  rating: z.coerce.number().min(0).max(5).default(0),
  specialty: optionalTrimmedString,
  consultationFee: z.coerce.number().min(0).default(0),
  nextAvailableLabel: optionalTrimmedString,
  reviewCount: z.coerce.number().int().min(0).default(0),
  specialtyTranslations: LocalizedContentSchema.optional(),
  experienceYears: z.preprocess(
    (value) => (value === "" || value === null ? undefined : value),
    z.coerce.number().int().min(0).max(100).optional()
  ),
  successRate: optionalTrimmedString,
  providerAssignments: z.array(StaffProviderAssignmentSchema).default([]),
  services: z.array(StaffServiceSchema).default([]),
  availabilities: z.array(StaffAvailabilitySchema).default([]),
  languages: z.array(z.string().trim().min(1).max(50)).default([]),
  specializations: z.array(z.string().trim().min(1).max(150)).default([]),
  education: z.array(StaffEducationSchema).default([]),
  certifications: z.array(StaffCertificationSchema).default([]),
  credentials: z.array(StaffCredentialSchema).default([]),
  achievements: z.array(StaffAchievementSchema).default([]),
  galleryItems: z.array(StaffGalleryItemSchema).default([]),
  galleryBulkMediaIds: optionalTrimmedString,
  beforeAfterItems: z.array(StaffBeforeAfterSchema).default([]),
});

export const CreateStaffSchema = StaffSchema.omit({ staffId: true }).extend({
  staffId: z.undefined().optional(),
});
export const UpdateStaffSchema = StaffSchema.extend({ staffId: z.guid() });
export const DeleteStaffSchema = z.object({ staffId: z.guid() });
export const ChangeStaffActivationSchema = z.object({
  staffId: z.guid(),
  isActive: z.boolean(),
});

export type StaffFormInput = z.infer<typeof StaffSchema>;
export type CreateStaffInput = z.infer<typeof CreateStaffSchema>;
export type UpdateStaffInput = z.infer<typeof UpdateStaffSchema>;
export type DeleteStaffInput = z.infer<typeof DeleteStaffSchema>;
export type ChangeStaffActivationInput = z.infer<typeof ChangeStaffActivationSchema>;

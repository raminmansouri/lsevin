import { z } from "zod";

const uuid = z.string().uuid();
const optionalText = z.string().trim().optional().nullable().transform((value) => value || null);
const looseEmail = z.string().trim().email().optional().or(z.literal("")).transform((value) => value || null);
const optionalNumber = z.preprocess(
  (value) => value === "" || value === null || value === undefined ? null : value,
  z.coerce.number().optional().nullable()
);
const optionalInt = z.preprocess(
  (value) => value === "" || value === null || value === undefined ? null : value,
  z.coerce.number().int().optional().nullable()
);

export const createProviderApplicationSchema = z.object({
  providerTypeId: uuid,
  legalName: z.string().trim().min(2, "Legal name is required."),
  displayNameEn: z.string().trim().min(2, "Display name is required."),
  displayNameFa: z.string().trim().optional().default(""),
  email: looseEmail,
  phoneNumberCountryCode: z.string().trim().min(1).max(5).default("+98"),
  phoneNumber: z.string().trim().min(5, "Phone number is required."),
  country: z.string().trim().min(2, "Country is required.").max(15, "Database country column supports max 15 chars."),
  city: z.string().trim().min(2, "City is required.").max(15, "Database city column supports max 15 chars."),
  addressText: optionalText,
  websiteUrl: optionalText,
});

export const updateProviderProfileSchema = z.object({
  providerId: uuid,
  nameEn: z.string().trim().min(1, "Name is required."),
  nameFa: z.string().trim().optional().default(""),
  descriptionEn: z.string().trim().optional().default(""),
  descriptionFa: z.string().trim().optional().default(""),
  detailEn: z.string().trim().optional().default(""),
  detailFa: z.string().trim().optional().default(""),
  streetEn: z.string().trim().optional().default(""),
  streetFa: z.string().trim().optional().default(""),
  email: z.string().trim().email("Valid email is required."),
  phoneNumberCountryCode: z.string().trim().min(1).max(3),
  phoneNumber: z.string().trim().min(5).max(15),
  zipCode: optionalText,
  imageUrl: optionalText,
  latitude: optionalNumber.refine((value) => value === null || value === undefined || (value >= -90 && value <= 90), "Latitude must be between -90 and 90."),
  longitude: optionalNumber.refine((value) => value === null || value === undefined || (value >= -180 && value <= 180), "Longitude must be between -180 and 180."),
  responseTime: optionalText,
  establishedYear: optionalInt.refine((value) => value === null || value === undefined || (value >= 1800 && value <= 2200), "Established year is invalid."),
  totalPatients: optionalText,
  successRate: optionalText,
  languagesCsv: z.string().trim().optional().default(""),
  specialtiesCsv: z.string().trim().optional().default(""),
  timezoneId: z.string().trim().min(1).default("UTC"),
});

export const saveProviderServiceSchema = z.object({
  providerId: uuid,
  serviceId: uuid.optional().nullable(),
  serviceDefinitionId: uuid,
  nameEn: z.string().trim().min(1, "Service name is required."),
  nameFa: z.string().trim().optional().default(""),
  descriptionEn: z.string().trim().optional().default(""),
  descriptionFa: z.string().trim().optional().default(""),
  currency: z.string().trim().min(3).max(15).default("USD"),
  value: z.coerce.number().min(0),
  durationMinutes: z.coerce.number().int().min(0).default(0),
  slotIntervalMinutes: z.coerce.number().int().min(1).default(15),
  imageUrl: optionalText,
  isActive: z.coerce.boolean().default(true),
  isPopular: z.coerce.boolean().default(false),
  tagsCsv: z.string().trim().optional().default(""),
});

export const deleteProviderServiceSchema = z.object({
  providerId: uuid,
  serviceId: uuid,
});

export const saveStaffSchema = z.object({
  providerId: uuid,
  staffId: uuid.optional().nullable(),
  providerStaffId: uuid.optional().nullable(),
  nameEn: z.string().trim().min(1, "Staff name is required."),
  nameFa: z.string().trim().optional().default(""),
  titleEn: z.string().trim().optional().default(""),
  titleFa: z.string().trim().optional().default(""),
  biographyEn: z.string().trim().optional().default(""),
  biographyFa: z.string().trim().optional().default(""),
  profileImageUrl: optionalText,
  specialty: optionalText,
  experienceYears: optionalInt.refine((value) => value === null || value === undefined || (value >= 0 && value <= 80), "Experience years is invalid."),
  consultationFee: z.coerce.number().min(0).default(0),
  notesEn: z.string().trim().optional().default(""),
  notesFa: z.string().trim().optional().default(""),
  isActive: z.coerce.boolean().default(true),
});

export const deleteStaffLinkSchema = z.object({
  providerId: uuid,
  providerStaffId: uuid,
});

export const saveOperatingHoursSchema = z.object({
  providerId: uuid,
  hours: z.array(z.object({
    dayOfWeek: z.coerce.number().int().min(1).max(7),
    opensAt: z.string().trim().optional().nullable(),
    closesAt: z.string().trim().optional().nullable(),
    isClosed: z.coerce.boolean().default(false),
    slotIntervalMinutes: z.coerce.number().int().min(1).default(15),
  })).length(7),
});

export const updateBookingProviderSchema = z.object({
  providerId: uuid,
  bookingId: uuid,
  bookingSource: z.enum(["main", "child"]).default("main"),
  providerNotes: optionalText,
  status: z.enum(["Pending", "Confirmed", "Cancelled", "Completed"]).optional(),
});

export const saveGalleryItemSchema = z.object({
  providerId: uuid,
  galleryItemId: uuid.optional().nullable(),
  titleEn: z.string().trim().optional().default(""),
  titleFa: z.string().trim().optional().default(""),
  descriptionEn: z.string().trim().optional().default(""),
  descriptionFa: z.string().trim().optional().default(""),
  url: z.string().trim().min(1, "Media URL or media id is required."),
  mediaType: z.enum(["image", "video", "gif", "file"]).default("image"),
  displayOrder: z.coerce.number().int().default(0),
});

export const deleteGalleryItemSchema = z.object({
  providerId: uuid,
  galleryItemId: uuid,
});

export const saveOfferSchema = z.object({
  providerId: uuid,
  offerId: z.coerce.number().int().optional().nullable(),
  providerServiceId: uuid,
  title: z.string().trim().min(1, "Title is required."),
  subtitle: optionalText,
  discountPercent: z.coerce.number().min(0).max(100),
  validUntil: z.string().trim().min(1),
  code: optionalText,
  isActive: z.coerce.boolean().default(true),
  isFeatured: z.coerce.boolean().default(false),
  usageLimit: optionalInt.refine((value) => value === null || value === undefined || value >= 0, "Usage limit is invalid."),
  descriptionEn: z.string().trim().optional().default(""),
  descriptionFa: z.string().trim().optional().default(""),
});

export const deleteOfferSchema = z.object({
  providerId: uuid,
  offerId: z.coerce.number().int(),
});

export const savePayoutAccountSchema = z.object({
  providerId: uuid,
  payoutAccountId: uuid.optional().nullable(),
  accountHolderName: z.string().trim().min(2, "Account holder is required."),
  bankName: optionalText,
  iban: optionalText,
  swiftCode: optionalText,
  accountNumberLast4: z.string().trim().max(4).optional().nullable().transform((value) => value || null),
  country: optionalText,
  currencyCode: z.string().trim().min(3).max(10).default("USD"),
  isDefault: z.coerce.boolean().default(false),
});

export const createSupportTicketSchema = z.object({
  providerId: uuid,
  subject: z.string().trim().min(2, "Subject is required."),
  message: z.string().trim().min(5, "Message is required."),
  priority: z.enum(["low", "normal", "high", "urgent"]).default("normal"),
});

export const updateSupportTicketSchema = z.object({
  providerId: uuid,
  ticketId: uuid,
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
});

export const approveApplicationSchema = z.object({
  applicationId: uuid,
  reviewNote: z.string().trim().optional().default(""),
});

export const rejectApplicationSchema = z.object({
  applicationId: uuid,
  reviewReason: z.string().trim().min(2, "Rejection reason is required."),
});

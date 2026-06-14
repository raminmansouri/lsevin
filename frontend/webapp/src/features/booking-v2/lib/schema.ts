import { z } from "zod";

export const selectedAddonSchema = z.object({
  addonId: z.string().min(1),
  sourceType: z.enum(["provider", "lsevin"]),
  addonKind: z.enum([
    "simple",
    "hotel",
    "airport_pickup",
    "transport",
    "insurance",
    "other",
  ]),
  quantity: z.number().int().min(1).default(1),
  unitPrice: z.number().min(0),
  config: z.record(z.any()).default({}),
});

export const uploadedDraftDocumentSchema = z.object({
  id: z.string().uuid().optional(),
  requirementId: z.string().uuid().nullable().optional(),
  title: z.string().min(1),
  fileName: z.string().min(1),
  fileUrl: z.string().min(1),
  mimeType: z.string().nullable().optional(),
  sizeBytes: z.number().nullable().optional(),
});

export const draftSaveSchema = z.object({
  draftId: z.string().uuid().optional(),
  providerId: z.string().uuid().nullable().optional(),
  serviceId: z.string().uuid().nullable().optional(),
  specialistId: z.string().uuid().nullable().optional(),
  selectedDate: z.string().nullable().optional(),
  selectedTime: z.string().nullable().optional(),
  selectedTimeFrom: z.string().nullable().optional(),
  selectedTimeTo: z.string().nullable().optional(),
  useLsevin: z.boolean().optional(),
  currentStep: z.number().int().min(1).optional(),
  paymentMethod: z
    .enum(["manual_transfer", "online_gateway", "pay_on_arrival"])
    .nullable()
    .optional(),
  currency: z.string().default("USD"),
  selectedAddons: z.array(selectedAddonSchema).default([]),
  documents: z.array(uploadedDraftDocumentSchema).default([]),
  notes: z.string().nullable().optional(),
});

export const checkoutSchema = z.object({
  draftId: z.string().uuid(),
  paymentMethod: z.enum(["manual_transfer", "online_gateway", "pay_on_arrival"]),
  currency: z.string().default("USD"),
});

import { z } from "zod";

const jsonRecord = z.record(z.string(), z.unknown()).default({});
const localizedLabels = z.record(
  z.string(),
  z.object({
    launcherLabel: z.string().optional(),
    headerTitle: z.string().optional(),
    headerSubtitle: z.string().optional(),
    welcomeTitle: z.string().optional(),
    welcomeMessage: z.string().optional(),
    inputPlaceholder: z.string().optional(),
    startConversationLabel: z.string().optional(),
    offlineLabel: z.string().optional(),
    onlineLabel: z.string().optional(),
    sendButton: z.string().optional(),
    attachmentLabel: z.string().optional(),
  })
);

export const SupportSettingsInputSchema = z.object({
  supportPageEnabled: z.boolean(),
  requireLogin: z.boolean(),
  allowGuestConversation: z.boolean(),
  primaryColor: z.string().trim().min(3).max(40),
  accentColor: z.string().trim().min(3).max(40),
  borderRadius: z.string().trim().min(1).max(40),
  themeMode: z.enum(["system", "light", "dark"]),
  labels: localizedLabels,
  officeHours: jsonRecord,
  offlineSettings: jsonRecord,
  autoReplySettings: jsonRecord,
  metadata: jsonRecord.optional().default({}),
});

export const SupportAttachmentSchema = z.object({
  id: z.string().optional(),
  url: z.string().trim().min(1),
  name: z.string().optional(),
  mimeType: z.string().optional(),
  sizeBytes: z.number().nonnegative().optional(),
  mediaType: z.enum(["image", "video", "file"]).optional(),
});

export const CreateGuestConversationSchema = z.object({
  guestName: z.string().trim().min(2, "Name is required.").max(160),
  guestEmail: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  guestPhoneCountryCode: z.string().trim().max(5).optional().or(z.literal("")),
  guestPhone: z.string().trim().max(30).optional().or(z.literal("")),
  body: z.string().trim().min(1, "Message is required.").max(4000),
  locale: z.string().trim().default("en-US"),
  source: z.enum(["floating_widget", "support_page", "booking", "provider_page", "service_page", "admin_created"]).default("support_page"),
  sourceUrl: z.string().trim().optional().or(z.literal("")),
  metadata: jsonRecord.optional().default({}),
}).refine((value) => Boolean(value.guestEmail || value.guestPhone), {
  message: "Email or phone is required.",
  path: ["guestEmail"],
});

export const GetOrCreateConversationSchema = z.object({
  customerUserId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
  displayName: z.string().trim().optional(),
  locale: z.string().trim().default("en-US"),
  source: z.enum(["floating_widget", "support_page", "booking", "provider_page", "service_page", "admin_created", "consultation"]).default("support_page"),
  sourceUrl: z.string().trim().optional().or(z.literal("")),
  metadata: jsonRecord.optional().default({}),
});

/** Migration 0064: get-or-create for a conversation attached to a specific
 * booking or مشاوره/consultation request, instead of the generic
 * customerUserId-scoped thread GetOrCreateConversationSchema resolves. */
export const CreateContextConversationSchema = z.object({
  contextType: z.enum(["booking", "consultation"]),
  bookingId: z.string().uuid().optional(),
  consultationRequestId: z.string().uuid().optional(),
  patientId: z.string().uuid().optional(),
  medicalCaseId: z.string().uuid().optional(),
  customerUserId: z.string().uuid(),
  displayName: z.string().trim().optional(),
  locale: z.string().trim().default("en-US"),
}).refine(
  (value) => (value.contextType === "booking" ? Boolean(value.bookingId) : Boolean(value.consultationRequestId)),
  { message: "The anchor id must match contextType.", path: ["contextType"] }
);

export const SendCustomerMessageSchema = z.object({
  conversationId: z.string().uuid(),
  senderUserId: z.string().uuid().optional(),
  body: z.string().trim().min(1, "Message is required.").max(4000),
  attachments: z.array(SupportAttachmentSchema).default([]),
});

export const SendAgentMessageSchema = z.object({
  conversationId: z.string().uuid(),
  agentUserId: z.string().uuid().optional(),
  body: z.string().trim().min(1, "Message is required.").max(4000),
  attachments: z.array(SupportAttachmentSchema).default([]),
});

/** A provider-portal user replying inside a booking/case conversation --
 * distinct from an agent (LSevin admin/support staff). */
export const SendProviderMessageSchema = z.object({
  conversationId: z.string().uuid(),
  providerUserId: z.string().uuid(),
  providerId: z.string().uuid(),
  body: z.string().trim().min(1, "Message is required.").max(4000),
  attachments: z.array(SupportAttachmentSchema).default([]),
});

/** Structured "ask for a file/info" sent from inside a conversation -- this
 * creates a real patient.medical_case_requirements row through the existing
 * cases-repository.addCaseRequirement(), not a parallel mechanism. */
export const SendRequirementRequestSchema = z.object({
  conversationId: z.string().uuid(),
  medicalCaseId: z.string().uuid(),
  requirementType: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(2000).optional(),
  isMandatory: z.boolean().optional().default(true),
  maxAgeHours: z.number().int().min(1).max(8760).optional(),
  actorUserId: z.string().uuid().optional(),
  actorProviderId: z.string().uuid().optional(),
});

/** Structured "write to the medical record" sent from inside a conversation
 * -- dispatches to the existing clinical-repository add* functions, not a
 * parallel mechanism. */
export const AddClinicalRecordFromConversationSchema = z.object({
  conversationId: z.string().uuid(),
  medicalCaseId: z.string().uuid().optional(),
  patientId: z.string().uuid(),
  recordType: z.enum(["condition", "allergy", "medication", "procedure"]),
  payload: z.record(z.string(), z.unknown()),
  actorUserId: z.string().uuid().optional(),
  actorProviderId: z.string().uuid().optional(),
});

export const AddInternalNoteSchema = z.object({
  conversationId: z.string().uuid(),
  agentUserId: z.string().uuid().optional(),
  body: z.string().trim().min(1, "Note is required.").max(4000),
});

export const UpdateConversationStatusSchema = z.object({
  conversationId: z.string().uuid(),
  status: z.enum(["open", "pending", "resolved", "closed", "archived"]),
  actorUserId: z.string().uuid().optional(),
});

export const UpdateConversationPrioritySchema = z.object({
  conversationId: z.string().uuid(),
  priority: z.enum(["low", "normal", "high", "urgent"]),
  actorUserId: z.string().uuid().optional(),
});

export const AssignConversationSchema = z.object({
  conversationId: z.string().uuid(),
  assignedToUserId: z.string().uuid().optional().nullable(),
  actorUserId: z.string().uuid().optional(),
});

export const ConversationTagSchema = z.object({
  conversationId: z.string().uuid(),
  tagId: z.string().uuid(),
  actorUserId: z.string().uuid().optional(),
});

export const UpsertSupportTagSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Name is required.").max(80),
  color: z.string().trim().min(3).max(40).default("#083f30"),
  isActive: z.boolean().default(true),
});

export const DeleteSupportTagSchema = z.object({
  id: z.string().uuid(),
});

export const UpsertCannedReplySchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1, "Title is required.").max(160),
  shortcut: z.string().trim().max(80).optional().or(z.literal("")),
  bodyTranslations: z.record(z.string(), z.string()).default({}),
  isActive: z.boolean().default(true),
  displayOrder: z.coerce.number().int().min(0).default(0),
});

export const DeleteCannedReplySchema = z.object({
  id: z.string().uuid(),
});

export type SupportSettingsInput = z.infer<typeof SupportSettingsInputSchema>;
export type CreateGuestConversationInput = z.infer<typeof CreateGuestConversationSchema>;
export type GetOrCreateConversationInput = z.infer<typeof GetOrCreateConversationSchema>;
export type SendCustomerMessageInput = z.infer<typeof SendCustomerMessageSchema>;
export type SendAgentMessageInput = z.infer<typeof SendAgentMessageSchema>;
export type CreateContextConversationInput = z.infer<typeof CreateContextConversationSchema>;
export type SendProviderMessageInput = z.infer<typeof SendProviderMessageSchema>;
export type SendRequirementRequestInput = z.infer<typeof SendRequirementRequestSchema>;
export type AddClinicalRecordFromConversationInput = z.infer<typeof AddClinicalRecordFromConversationSchema>;
export type AddInternalNoteInput = z.infer<typeof AddInternalNoteSchema>;
export type UpdateConversationStatusInput = z.infer<typeof UpdateConversationStatusSchema>;
export type UpdateConversationPriorityInput = z.infer<typeof UpdateConversationPrioritySchema>;
export type AssignConversationInput = z.infer<typeof AssignConversationSchema>;
export type ConversationTagInput = z.infer<typeof ConversationTagSchema>;
export type UpsertSupportTagInput = z.infer<typeof UpsertSupportTagSchema>;
export type DeleteSupportTagInput = z.infer<typeof DeleteSupportTagSchema>;
export type UpsertCannedReplyInput = z.infer<typeof UpsertCannedReplySchema>;
export type DeleteCannedReplyInput = z.infer<typeof DeleteCannedReplySchema>;

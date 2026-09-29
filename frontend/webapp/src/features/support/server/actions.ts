"use server";

import { revalidatePath } from "next/cache";
import { ZodError } from "zod";

import {
  AddClinicalRecordFromConversationSchema,
  AddInternalNoteSchema,
  AssignConversationSchema,
  ConversationTagSchema,
  CreateContextConversationSchema,
  CreateGuestConversationSchema,
  DeleteCannedReplySchema,
  DeleteSupportTagSchema,
  GetOrCreateConversationSchema,
  SendAgentMessageSchema,
  SendCustomerMessageSchema,
  SendProviderMessageSchema,
  SendRequirementRequestSchema,
  SupportSettingsInputSchema,
  UpdateConversationPrioritySchema,
  UpdateConversationStatusSchema,
  UpsertCannedReplySchema,
  UpsertSupportTagSchema,
  type AddClinicalRecordFromConversationInput,
  type AddInternalNoteInput,
  type AssignConversationInput,
  type ConversationTagInput,
  type CreateContextConversationInput,
  type CreateGuestConversationInput,
  type DeleteCannedReplyInput,
  type DeleteSupportTagInput,
  type GetOrCreateConversationInput,
  type SendAgentMessageInput,
  type SendCustomerMessageInput,
  type SendProviderMessageInput,
  type SendRequirementRequestInput,
  type SupportSettingsInput,
  type UpdateConversationPriorityInput,
  type UpdateConversationStatusInput,
  type UpsertCannedReplyInput,
  type UpsertSupportTagInput,
} from "../schemas";
import type {
  SupportActionResult,
  SupportBootstrapData,
  SupportCannedReply,
  SupportConversationDetail,
  SupportConversationListResult,
  SupportMessage,
  SupportSettings,
  SupportTag,
} from "../types";
import {
  addInternalNote,
  addTagToConversation,
  assignConversation,
  createGuestConversation,
  deleteCannedReply,
  deleteSupportTag,
  getAdminConversationDetail,
  getCustomerConversationDetail,
  getFloatingWidgetBootstrapData,
  getOrCreateConversationForContext,
  getOrCreateConversationForUser,
  getSupportSettings,
  listAdminConversations,
  listCannedReplies,
  listSupportTags,
  markConversationReadForAdmin,
  markConversationReadForCustomer,
  removeTagFromConversation,
  sendAgentMessage,
  sendCustomerMessage,
  sendProviderMessage,
  supportError,
  updateConversationPriority,
  updateConversationStatus,
  updateSupportSettings,
  upsertAgentPresence,
  upsertCannedReply,
  upsertSupportTag,
} from "./repository";
import { requestFileInConversation, addClinicalRecordFromConversation } from "./structured-actions";

function toFieldErrors(error: ZodError): Record<string, string[]> {
  const flattened = error.flatten().fieldErrors;
  return Object.fromEntries(Object.entries(flattened).map(([key, value]) => [key, value || []]));
}

function actionFailure(error: unknown): SupportActionResult<never> {
  if (error instanceof ZodError) {
    return { fieldErrors: toFieldErrors(error) };
  }
  return { error: supportError(error) };
}

function revalidateSupport() {
  revalidatePath("/admin/support");
  revalidatePath("/admin/support/settings");
  revalidatePath("/admin/support/canned-replies");
  revalidatePath("/admin/support/tags");
  revalidatePath("/n/app/mobile/support");
}

export async function getSupportSettingsAction(): Promise<SupportActionResult<SupportSettings>> {
  try {
    return { data: await getSupportSettings() };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function updateSupportSettingsAction(input: SupportSettingsInput): Promise<SupportActionResult<SupportSettings>> {
  try {
    const parsed = SupportSettingsInputSchema.parse(input);
    const data = await updateSupportSettings(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function listAdminConversationsAction(input?: {
  search?: string;
  status?: string;
  priority?: string;
  contextType?: string;
  assignedToUserId?: string;
  tagId?: string;
  pageNumber?: number;
  pageSize?: number;
}): Promise<SupportActionResult<SupportConversationListResult>> {
  try {
    return { data: await listAdminConversations(input as any) };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function getAdminConversationDetailAction(conversationId: string): Promise<SupportActionResult<SupportConversationDetail | null>> {
  try {
    return { data: await getAdminConversationDetail(conversationId) };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function getCustomerConversationDetailAction(conversationId: string): Promise<SupportActionResult<SupportConversationDetail | null>> {
  try {
    return { data: await getCustomerConversationDetail(conversationId) };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function getFloatingWidgetBootstrapDataAction(input?: { customerUserId?: string; locale?: string }): Promise<SupportActionResult<SupportBootstrapData>> {
  try {
    return { data: await getFloatingWidgetBootstrapData(input) };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function getOrCreateConversationAction(input: GetOrCreateConversationInput): Promise<SupportActionResult<SupportConversationDetail>> {
  try {
    const parsed = GetOrCreateConversationSchema.parse(input);
    const data = await getOrCreateConversationForUser(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function createGuestConversationAction(input: CreateGuestConversationInput): Promise<SupportActionResult<SupportConversationDetail>> {
  try {
    const parsed = CreateGuestConversationSchema.parse(input);
    const data = await createGuestConversation(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function sendCustomerMessageAction(input: SendCustomerMessageInput): Promise<SupportActionResult<SupportMessage>> {
  try {
    const parsed = SendCustomerMessageSchema.parse(input);
    const data = await sendCustomerMessage(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function sendAgentMessageAction(input: SendAgentMessageInput): Promise<SupportActionResult<SupportMessage>> {
  try {
    const parsed = SendAgentMessageSchema.parse(input);
    const data = await sendAgentMessage(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

/** Customer-side: get-or-create the thread attached to a specific booking
 * or مشاوره/consultation request, instead of the generic per-account one. */
export async function getOrCreateContextConversationAction(input: CreateContextConversationInput): Promise<SupportActionResult<SupportConversationDetail>> {
  try {
    const parsed = CreateContextConversationSchema.parse(input);
    const data = await getOrCreateConversationForContext(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

/** A provider-portal user replying inside a booking/case conversation. The
 * caller (either the admin composer, gated by admin auth, or a bridge
 * called from the portal) is responsible for confirming the provider
 * actually has standing on this conversation -- see authorization.ts. */
export async function sendProviderMessageAction(input: SendProviderMessageInput): Promise<SupportActionResult<SupportMessage>> {
  try {
    const parsed = SendProviderMessageSchema.parse(input);
    const data = await sendProviderMessage(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function requestFileInConversationAction(input: SendRequirementRequestInput): Promise<SupportActionResult<SupportMessage>> {
  try {
    const parsed = SendRequirementRequestSchema.parse(input);
    const data = await requestFileInConversation(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function addClinicalRecordFromConversationAction(input: AddClinicalRecordFromConversationInput): Promise<SupportActionResult<SupportMessage>> {
  try {
    const parsed = AddClinicalRecordFromConversationSchema.parse(input);
    const data = await addClinicalRecordFromConversation(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function addInternalNoteAction(input: AddInternalNoteInput): Promise<SupportActionResult<SupportMessage>> {
  try {
    const parsed = AddInternalNoteSchema.parse(input);
    const data = await addInternalNote(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function updateConversationStatusAction(input: UpdateConversationStatusInput): Promise<SupportActionResult<SupportConversationDetail>> {
  try {
    const parsed = UpdateConversationStatusSchema.parse(input);
    const data = await updateConversationStatus(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function updateConversationPriorityAction(input: UpdateConversationPriorityInput): Promise<SupportActionResult<SupportConversationDetail>> {
  try {
    const parsed = UpdateConversationPrioritySchema.parse(input);
    const data = await updateConversationPriority(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function assignConversationAction(input: AssignConversationInput): Promise<SupportActionResult<SupportConversationDetail>> {
  try {
    const parsed = AssignConversationSchema.parse(input);
    const data = await assignConversation(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function addTagToConversationAction(input: ConversationTagInput): Promise<SupportActionResult<SupportConversationDetail>> {
  try {
    const parsed = ConversationTagSchema.parse(input);
    const data = await addTagToConversation(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function removeTagFromConversationAction(input: ConversationTagInput): Promise<SupportActionResult<SupportConversationDetail>> {
  try {
    const parsed = ConversationTagSchema.parse(input);
    const data = await removeTagFromConversation(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function markConversationReadForAdminAction(conversationId: string): Promise<SupportActionResult<boolean>> {
  try {
    await markConversationReadForAdmin(conversationId);
    revalidateSupport();
    return { data: true };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function markConversationReadForCustomerAction(conversationId: string): Promise<SupportActionResult<boolean>> {
  try {
    await markConversationReadForCustomer(conversationId);
    revalidateSupport();
    return { data: true };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function listSupportTagsAction(includeInactive = false): Promise<SupportActionResult<SupportTag[]>> {
  try {
    return { data: await listSupportTags(includeInactive) };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function upsertSupportTagAction(input: UpsertSupportTagInput): Promise<SupportActionResult<SupportTag>> {
  try {
    const parsed = UpsertSupportTagSchema.parse(input);
    const data = await upsertSupportTag(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function deleteSupportTagAction(input: DeleteSupportTagInput): Promise<SupportActionResult<string>> {
  try {
    const parsed = DeleteSupportTagSchema.parse(input);
    const data = await deleteSupportTag(parsed.id);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function listCannedRepliesAction(includeInactive = false): Promise<SupportActionResult<SupportCannedReply[]>> {
  try {
    return { data: await listCannedReplies(includeInactive) };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function upsertCannedReplyAction(input: UpsertCannedReplyInput): Promise<SupportActionResult<SupportCannedReply>> {
  try {
    const parsed = UpsertCannedReplySchema.parse(input);
    const data = await upsertCannedReply(parsed);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function deleteCannedReplyAction(input: DeleteCannedReplyInput): Promise<SupportActionResult<string>> {
  try {
    const parsed = DeleteCannedReplySchema.parse(input);
    const data = await deleteCannedReply(parsed.id);
    revalidateSupport();
    return { data };
  } catch (error) {
    return actionFailure(error);
  }
}

export async function upsertAgentPresenceAction(input: { userId: string; status: "online" | "away" | "offline"; displayName?: string; avatarUrl?: string }): Promise<SupportActionResult<boolean>> {
  try {
    await upsertAgentPresence(input);
    return { data: true };
  } catch (error) {
    return actionFailure(error);
  }
}

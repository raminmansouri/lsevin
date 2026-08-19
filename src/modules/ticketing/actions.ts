"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission } from "@core/auth/permissions";
import { stringFromForm } from "@core/lib/forms";
import { sendTemplateNotification } from "@core/notifications/capability";
import { createTicket, replyTicket, updateTicketAdminState } from "./repository";

function priorityFromForm(value: string) {
  return ["low", "normal", "high", "urgent"].includes(value) ? value : "normal";
}

export async function createTicketAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "view");
  await createTicket({
    providerId,
    createdByUserId: user.id,
    subject: stringFromForm(formData, "subject"),
    body: stringFromForm(formData, "body"),
    priority: priorityFromForm(stringFromForm(formData, "priority", "normal")),
    department: stringFromForm(formData, "department", "support"),
    attachmentUrl: stringFromForm(formData, "attachmentUrl"),
    attachmentName: stringFromForm(formData, "attachmentName"),
  });
  revalidatePath(`/providers/${providerId}/tickets`);
  revalidatePath("/admin/tickets");
}

export async function replyTicketAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "view");
  await replyTicket({
    ticketId: stringFromForm(formData, "ticketId"),
    senderUserId: user.id,
    senderRole: "provider",
    body: stringFromForm(formData, "body"),
    attachmentUrl: stringFromForm(formData, "attachmentUrl"),
    attachmentName: stringFromForm(formData, "attachmentName"),
  });
  revalidatePath(`/providers/${providerId}/tickets`);
  revalidatePath("/admin/tickets");
}

export async function adminReplyTicketAction(formData: FormData) {
  const user = await requireAdminUser("SUPPORT_ADMIN");
  const ticketId = stringFromForm(formData, "ticketId");
  const isInternalNote = stringFromForm(formData, "isInternalNote") === "on";
  const providerId = await replyTicket({
    ticketId, senderUserId: user.id, senderRole: "lsevin_admin", body: stringFromForm(formData, "body"), isInternalNote,
    attachmentUrl: stringFromForm(formData, "attachmentUrl"), attachmentName: stringFromForm(formData, "attachmentName"),
  });
  if (!isInternalNote) await sendTemplateNotification({
    recipientEntityType: "provider", recipientEntityId: providerId, templateKey: "ticket.reply",
    variables: { ticketId, providerId }, sourceModule: "ticketing", sourceEntityType: "ticket", sourceEntityId: ticketId,
  });
  revalidatePath("/admin/tickets");
  revalidatePath(`/providers/${providerId}/tickets`);
  revalidatePath(`/providers/${providerId}/notifications`);
}

export async function updateTicketAdminStateAction(formData: FormData) {
  await requireAdminUser("SUPPORT_ADMIN");
  const status = stringFromForm(formData, "status", "in_progress");
  const priority = priorityFromForm(stringFromForm(formData, "priority", "normal"));
  await updateTicketAdminState({
    ticketId: stringFromForm(formData, "ticketId"),
    assignedToUserId: stringFromForm(formData, "assignedToUserId"),
    status: ["open", "in_progress", "waiting_provider", "waiting_lsevin", "resolved", "closed"].includes(status) ? status : "in_progress",
    priority,
  });
  revalidatePath("/admin/tickets");
}

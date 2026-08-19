"use server";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireProviderPermission } from "@core/auth/permissions";
import { stringFromForm } from "@core/lib/forms";
import { createSupportTicket, updateSupportTicketStatus } from "./repository";

export async function createSupportTicketAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "view");
  await createSupportTicket({
    providerId,
    userId: user.id,
    subject: stringFromForm(formData, "subject"),
    message: stringFromForm(formData, "message"),
    priority: stringFromForm(formData, "priority", "normal"),
  });
  revalidatePath(`/providers/${providerId}/support`);
  revalidatePath("/support");
}

export async function updateSupportTicketStatusAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "view");
  await updateSupportTicketStatus({ providerId, ticketId: stringFromForm(formData, "ticketId"), status: stringFromForm(formData, "status", "open") });
  revalidatePath(`/providers/${providerId}/support`);
}

"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission, requireStaffProfilePermission } from "@core/auth/permissions";
import { booleanFromForm, csvFromForm, stringFromForm, translationsFromForm } from "@core/lib/forms";
import { createInboxNotification, markInboxRead, markRecipientInboxRead, upsertTemplate } from "./repository";

export async function upsertTemplateAction(formData: FormData) {
  await requireAdminUser("PROVIDER_ADMIN");
  await upsertTemplate({
    templateKey: stringFromForm(formData, "templateKey"),
    titleTranslations: translationsFromForm(formData, "title"),
    bodyTranslations: translationsFromForm(formData, "body"),
    channels: csvFromForm(formData, "channels"),
    variables: csvFromForm(formData, "variables"),
    isActive: booleanFromForm(formData, "isActive"),
  });
  revalidatePath("/admin/notifications");
}

export async function testNotificationAction(formData: FormData) {
  await requireAdminUser("PROVIDER_ADMIN");
  await createInboxNotification({
    recipientEntityType: stringFromForm(formData, "recipientEntityType", "provider"),
    recipientEntityId: stringFromForm(formData, "recipientEntityId"),
    title: stringFromForm(formData, "title", "LSevin notification test"),
    body: stringFromForm(formData, "body", "This is a test notification."),
    sourceModule: "notifications-module",
    templateKey: stringFromForm(formData, "templateKey", "manual.test"),
    channel: stringFromForm(formData, "channel", "in_app"),
  });
  revalidatePath("/admin/notifications");
}

export async function markInboxReadAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  if (providerId) await requireProviderPermission(user.id, providerId, "view");
  await markInboxRead(stringFromForm(formData, "inboxItemId"));
  if (providerId) revalidatePath(`/providers/${providerId}/notifications`);
}

export async function markStaffInboxReadAction(formData: FormData) {
  const user=await requireCurrentUser();
  const staffId=stringFromForm(formData,"staffId");
  await requireStaffProfilePermission(user.id,staffId,"viewOwnBookings");
  const recipientEntityType = stringFromForm(formData,"recipientEntityType","user") === "staff" ? "staff" : "user";
  await markRecipientInboxRead({inboxItemId:stringFromForm(formData,"inboxItemId"),recipientEntityType,recipientEntityId:recipientEntityType === "staff" ? staffId : user.id});
  revalidatePath(`/staff/${staffId}/notifications`);
}

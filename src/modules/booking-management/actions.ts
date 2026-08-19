"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission, requireStaffProfilePermission } from "@core/auth/permissions";
import { stringFromForm } from "@core/lib/forms";
import { sendTemplateNotification } from "@core/notifications/capability";
import { addBookingNote, assignBooking, updateBookingStatus } from "./repository";

export async function assignBookingAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageBookings");
  const bookingId = stringFromForm(formData, "bookingId");
  const staffId = stringFromForm(formData, "staffId");
  await assignBooking({
    bookingId,
    providerId,
    staffId,
    resourceId: stringFromForm(formData, "resourceId"),
    note: stringFromForm(formData, "note"),
    assignedByUserId: user.id,
  });
  if (staffId) await sendTemplateNotification({
    recipientEntityType: "staff", recipientEntityId: staffId, templateKey: "booking.staff.assigned",
    variables: { bookingId, providerId, staffId }, sourceModule: "booking-management", sourceEntityType: "booking", sourceEntityId: bookingId,
  });
  revalidatePath(`/providers/${providerId}/booking-management`);
}

export async function updateBookingStatusAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageBookings");
  await updateBookingStatus({
    bookingId: stringFromForm(formData, "bookingId"),
    providerId,
    newStatus: stringFromForm(formData, "newStatus", "Confirmed"),
    note: stringFromForm(formData, "note"),
    changedByUserId: user.id,
  });
  revalidatePath(`/providers/${providerId}/booking-management`);
}

export async function addBookingNoteAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageBookings");
  await addBookingNote({
    bookingId: stringFromForm(formData, "bookingId"),
    providerId,
    note: stringFromForm(formData, "note"),
    visibility: stringFromForm(formData, "visibility", "internal"),
    createdByUserId: user.id,
  });
  revalidatePath(`/providers/${providerId}/booking-management`);
}

export async function addStaffBookingNoteAction(formData: FormData) {
  const user = await requireCurrentUser();
  const staffId = stringFromForm(formData, "staffId");
  await requireStaffProfilePermission(user.id, staffId, "viewOwnBookings");
  await addBookingNote({
    bookingId: stringFromForm(formData, "bookingId"),
    providerId: stringFromForm(formData, "providerId"),
    staffId,
    note: stringFromForm(formData, "note"),
    visibility: "internal",
    createdByUserId: user.id,
  });
  revalidatePath(`/staff/${staffId}/bookings`);
}

export async function adminBookingStatusAction(formData: FormData) {
  const user = await requireAdminUser("PROVIDER_ADMIN");
  const bookingId = stringFromForm(formData, "bookingId");
  const providerId = stringFromForm(formData, "providerId");
  const newStatus = stringFromForm(formData, "newStatus", "ProviderReview");
  await updateBookingStatus({ bookingId, providerId, newStatus, note: stringFromForm(formData, "note"), changedByUserId: user.id });
  await sendTemplateNotification({
    recipientEntityType: "provider", recipientEntityId: providerId, templateKey: "booking.status.changed",
    variables: { bookingId, status: newStatus, providerId }, sourceModule: "booking-management", sourceEntityType: "booking", sourceEntityId: bookingId,
  });
  revalidatePath("/admin/booking-management");
}

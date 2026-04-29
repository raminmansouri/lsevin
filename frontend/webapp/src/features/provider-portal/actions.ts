"use server";

import { revalidatePath } from "next/cache";

import {
  approveApplicationSchema,
  createProviderApplicationSchema,
  createSupportTicketSchema,
  deleteGalleryItemSchema,
  deleteOfferSchema,
  deleteProviderServiceSchema,
  deleteStaffLinkSchema,
  rejectApplicationSchema,
  saveGalleryItemSchema,
  saveOfferSchema,
  saveOperatingHoursSchema,
  savePayoutAccountSchema,
  saveProviderServiceSchema,
  saveStaffSchema,
  updateBookingProviderSchema,
  updateProviderProfileSchema,
  updateSupportTicketSchema,
} from "./schemas";
import {
  approveApplication,
  createProviderApplication,
  createSupportTicket,
  deleteGalleryItem,
  deleteOffer,
  deleteProviderService,
  deleteProviderStaffLink,
  rejectApplication,
  saveGalleryItem,
  saveOffer,
  saveOperatingHours,
  savePayoutAccount,
  saveProviderService,
  saveProviderStaff,
  updateProviderBooking,
  updateProviderProfile,
  updateSupportTicketStatus,
} from "./server/repository";
import { requireCurrentUserId } from "./server/session";
import type { ActionResult } from "./types";

function result<T>(data: T): ActionResult<T> {
  return { ok: true, data };
}

function failure(error: unknown): ActionResult<never> {
  if (error instanceof Error) return { ok: false, error: error.message };
  return { ok: false, error: "Operation failed." };
}

function revalidateProviderPortal(providerId?: string) {
  revalidatePath("/provider-portal");
  if (providerId) revalidatePath(`/provider-portal/providers/${providerId}`);
}

export async function createProviderApplicationAction(input: unknown): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = createProviderApplicationSchema.parse(input);
    const id = await createProviderApplication(userId, parsed);
    revalidatePath("/provider-portal");
    revalidatePath("/provider-portal/applications");
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function updateProviderProfileAction(input: unknown): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = updateProviderProfileSchema.parse(input);
    await updateProviderProfile(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveProviderServiceAction(input: unknown): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveProviderServiceSchema.parse(input);
    const id = await saveProviderService(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteProviderServiceAction(input: unknown): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteProviderServiceSchema.parse(input);
    await deleteProviderService(userId, parsed.providerId, parsed.serviceId);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveStaffAction(input: unknown): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveStaffSchema.parse(input);
    const id = await saveProviderStaff(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteStaffLinkAction(input: unknown): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteStaffLinkSchema.parse(input);
    await deleteProviderStaffLink(userId, parsed.providerId, parsed.providerStaffId);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveOperatingHoursAction(input: unknown): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveOperatingHoursSchema.parse(input);
    await saveOperatingHours(userId, parsed.providerId, parsed.hours as any);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function updateProviderBookingAction(input: unknown): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = updateBookingProviderSchema.parse(input);
    await updateProviderBooking(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveGalleryItemAction(input: unknown): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveGalleryItemSchema.parse(input);
    const id = await saveGalleryItem(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteGalleryItemAction(input: unknown): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteGalleryItemSchema.parse(input);
    await deleteGalleryItem(userId, parsed.providerId, parsed.galleryItemId);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveOfferAction(input: unknown): Promise<ActionResult<number>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveOfferSchema.parse(input);
    const id = await saveOffer(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(Number(id));
  } catch (error) {
    return failure(error);
  }
}

export async function deleteOfferAction(input: unknown): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteOfferSchema.parse(input);
    await deleteOffer(userId, parsed.providerId, parsed.offerId);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function savePayoutAccountAction(input: unknown): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = savePayoutAccountSchema.parse(input);
    const id = await savePayoutAccount(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function createSupportTicketAction(input: unknown): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = createSupportTicketSchema.parse(input);
    const id = await createSupportTicket(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function updateSupportTicketAction(input: unknown): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = updateSupportTicketSchema.parse(input);
    await updateSupportTicketStatus(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function approveProviderApplicationAction(input: unknown): Promise<ActionResult<string>> {
  try {
    const adminUserId = await requireCurrentUserId(true);
    const parsed = approveApplicationSchema.parse(input);
    const providerId = await approveApplication(adminUserId, parsed.applicationId, parsed.reviewNote);
    revalidatePath("/admin/provider-portal/applications");
    revalidatePath("/provider-portal");
    return result(providerId);
  } catch (error) {
    return failure(error);
  }
}

export async function rejectProviderApplicationAction(input: unknown): Promise<ActionResult<boolean>> {
  try {
    const adminUserId = await requireCurrentUserId(true);
    const parsed = rejectApplicationSchema.parse(input);
    await rejectApplication(adminUserId, parsed.applicationId, parsed.reviewReason);
    revalidatePath("/admin/provider-portal/applications");
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

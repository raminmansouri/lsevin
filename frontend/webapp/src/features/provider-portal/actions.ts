"use server";

import { revalidatePath } from "next/cache";

import {
  createProviderApplicationSchema,
  createSupportTicketSchema,
  deleteGalleryItemSchema,
  deleteServiceFaqSchema,
  deleteServiceIncludedSchema,
  deleteServiceProcessSchema,
  deleteOfferSchema,
  deletePayoutAccountSchema,
  deleteProviderCertificationSchema,
  deleteProviderPolicySchema,
  deleteProviderServiceSchema,
  deleteServiceAddonSettingSchema,
  deleteServiceGalleryItemSchema,
  deleteStaffAvailabilitySchema,
  deleteStaffCertificationSchema,
  deleteStaffEducationSchema,
  deleteStaffGalleryItemSchema,
  deleteStaffLinkSchema,
  deleteStaffServiceSchema,
  saveGalleryItemSchema,
  saveServiceFaqSchema,
  saveServiceIncludedSchema,
  saveServiceProcessSchema,
  saveOfferSchema,
  saveOperatingHoursSchema,
  savePayoutAccountSchema,
  saveProviderCertificationSchema,
  saveProviderPolicySchema,
  saveProviderServiceSchema,
  saveServiceAddonSettingSchema,
  saveServiceGalleryItemSchema,
  saveStaffAvailabilitySchema,
  saveStaffCertificationSchema,
  saveStaffEducationSchema,
  saveStaffGalleryItemSchema,
  saveStaffSchema,
  saveStaffServiceSchema,
  updateBookingProviderSchema,
  updateProviderProfileSchema,
  updateSupportTicketSchema,
} from "./schemas";
import {
  createProviderApplication,
  createSupportTicket,
  deleteGalleryItem,
  deleteServiceFaq,
  deleteServiceIncluded,
  deleteServiceProcess,
  deleteOffer,
  deletePayoutAccount,
  deleteProviderCertification,
  deleteProviderPolicy,
  deleteProviderService,
  deleteProviderStaffLink,
  deleteServiceAddonSetting,
  deleteServiceGalleryItem,
  deleteStaffAvailability,
  deleteStaffCertification,
  deleteStaffEducation,
  deleteStaffGalleryItem,
  deleteStaffService,
  saveGalleryItem,
  saveServiceFaq,
  saveServiceIncluded,
  saveServiceProcess,
  saveOffer,
  saveOperatingHours,
  savePayoutAccount,
  saveProviderCertification,
  saveProviderPolicy,
  saveProviderService,
  saveProviderStaff,
  saveServiceAddonSetting,
  saveServiceGalleryItem,
  saveStaffAvailability,
  saveStaffCertification,
  saveStaffEducation,
  saveStaffGalleryItem,
  saveStaffService,
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
  if (providerId) {
    revalidatePath(`/provider-portal/providers/${providerId}`);
    revalidatePath(`/provider-portal/providers/${providerId}/dashboard`);
    revalidatePath(`/provider-portal/providers/${providerId}/profile`);
    revalidatePath(`/provider-portal/providers/${providerId}/services`);
    revalidatePath(`/provider-portal/providers/${providerId}/staff`);
    revalidatePath(`/provider-portal/providers/${providerId}/availability`);
    revalidatePath(`/provider-portal/providers/${providerId}/media`);
    revalidatePath(`/provider-portal/providers/${providerId}/offers`);
    revalidatePath(`/provider-portal/providers/${providerId}/billing`);
    revalidatePath(`/provider-portal/providers/${providerId}/support`);
  }
}

export async function createProviderApplicationAction(
  input: unknown,
): Promise<ActionResult<string>> {
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

export async function updateProviderProfileAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
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

export async function saveProviderCertificationAction(
  input: unknown,
): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveProviderCertificationSchema.parse(input);
    const id = await saveProviderCertification(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteProviderCertificationAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteProviderCertificationSchema.parse(input);
    await deleteProviderCertification(
      userId,
      parsed.providerId,
      parsed.certificationId,
    );
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveProviderPolicyAction(
  input: unknown,
): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveProviderPolicySchema.parse(input);
    const id = await saveProviderPolicy(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteProviderPolicyAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteProviderPolicySchema.parse(input);
    await deleteProviderPolicy(userId, parsed.providerId, parsed.policyId);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveProviderServiceAction(
  input: unknown,
): Promise<ActionResult<string>> {
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

export async function deleteProviderServiceAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
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

export async function saveServiceGalleryItemAction(
  input: unknown,
): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveServiceGalleryItemSchema.parse(input);
    const id = await saveServiceGalleryItem(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteServiceGalleryItemAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteServiceGalleryItemSchema.parse(input);
    await deleteServiceGalleryItem(
      userId,
      parsed.providerId,
      parsed.serviceGalleryItemId,
    );
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveServiceAddonSettingAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveServiceAddonSettingSchema.parse(input);
    await saveServiceAddonSetting(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteServiceAddonSettingAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteServiceAddonSettingSchema.parse(input);
    await deleteServiceAddonSetting(
      userId,
      parsed.providerId,
      parsed.providerServiceId,
      parsed.addonId,
    );
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveServiceIncludedAction(
  input: unknown,
): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveServiceIncludedSchema.parse(input);
    const id = await saveServiceIncluded(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteServiceIncludedAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteServiceIncludedSchema.parse(input);
    await deleteServiceIncluded(userId, parsed.providerId, parsed.includedId);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveServiceProcessAction(
  input: unknown,
): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveServiceProcessSchema.parse(input);
    const id = await saveServiceProcess(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteServiceProcessAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteServiceProcessSchema.parse(input);
    await deleteServiceProcess(userId, parsed.providerId, parsed.processId);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveServiceFaqAction(
  input: unknown,
): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveServiceFaqSchema.parse(input);
    const id = await saveServiceFaq(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteServiceFaqAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteServiceFaqSchema.parse(input);
    await deleteServiceFaq(userId, parsed.providerId, parsed.faqId);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveStaffAction(
  input: unknown,
): Promise<ActionResult<string>> {
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

export async function deleteStaffLinkAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteStaffLinkSchema.parse(input);
    await deleteProviderStaffLink(
      userId,
      parsed.providerId,
      parsed.providerStaffId,
    );
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveStaffCertificationAction(
  input: unknown,
): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveStaffCertificationSchema.parse(input);
    const id = await saveStaffCertification(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteStaffCertificationAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteStaffCertificationSchema.parse(input);
    await deleteStaffCertification(
      userId,
      parsed.providerId,
      parsed.certificationId,
    );
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveStaffEducationAction(
  input: unknown,
): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveStaffEducationSchema.parse(input);
    const id = await saveStaffEducation(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteStaffEducationAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteStaffEducationSchema.parse(input);
    await deleteStaffEducation(userId, parsed.providerId, parsed.educationId);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveStaffAvailabilityAction(
  input: unknown,
): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveStaffAvailabilitySchema.parse(input);
    const id = await saveStaffAvailability(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteStaffAvailabilityAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteStaffAvailabilitySchema.parse(input);
    await deleteStaffAvailability(
      userId,
      parsed.providerId,
      parsed.availabilityId,
    );
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveStaffGalleryItemAction(
  input: unknown,
): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveStaffGalleryItemSchema.parse(input);
    const id = await saveStaffGalleryItem(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteStaffGalleryItemAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteStaffGalleryItemSchema.parse(input);
    await deleteStaffGalleryItem(
      userId,
      parsed.providerId,
      parsed.staffGalleryItemId,
    );
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveStaffServiceAction(
  input: unknown,
): Promise<ActionResult<string>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = saveStaffServiceSchema.parse(input);
    const id = await saveStaffService(userId, parsed);
    revalidateProviderPortal(parsed.providerId);
    return result(id);
  } catch (error) {
    return failure(error);
  }
}

export async function deleteStaffServiceAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deleteStaffServiceSchema.parse(input);
    await deleteStaffService(userId, parsed.providerId, parsed.staffServiceId);
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function saveOperatingHoursAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
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

export async function updateProviderBookingAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
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

export async function saveGalleryItemAction(
  input: unknown,
): Promise<ActionResult<string>> {
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

export async function deleteGalleryItemAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
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

export async function saveOfferAction(
  input: unknown,
): Promise<ActionResult<number>> {
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

export async function deleteOfferAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
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

export async function savePayoutAccountAction(
  input: unknown,
): Promise<ActionResult<string>> {
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

export async function deletePayoutAccountAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
  try {
    const userId = await requireCurrentUserId();
    const parsed = deletePayoutAccountSchema.parse(input);
    await deletePayoutAccount(
      userId,
      parsed.providerId,
      parsed.payoutAccountId,
    );
    revalidateProviderPortal(parsed.providerId);
    return result(true);
  } catch (error) {
    return failure(error);
  }
}

export async function createSupportTicketAction(
  input: unknown,
): Promise<ActionResult<string>> {
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

export async function updateSupportTicketAction(
  input: unknown,
): Promise<ActionResult<boolean>> {
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

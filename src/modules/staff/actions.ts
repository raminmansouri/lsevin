"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission, requireStaffProfilePermission } from "@core/auth/permissions";
import { booleanFromForm, stringFromForm, translationsFromForm } from "@core/lib/forms";
import { assertMediaReferenceAccessible } from "@core/media/repository";
import { createAndLinkStaff, setProviderStaffLinkActiveByAdmin, setStaffActiveByAdmin, unlinkProviderStaff, updateClaimedStaffProfile, updateProviderStaff } from "./repository";

export async function createStaffAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageStaff");
  const profileImageUrl = stringFromForm(formData, "profileImageUrl");
  await assertMediaReferenceAccessible({ userId: user.id, providerId, reference: profileImageUrl });
  await createAndLinkStaff({
    providerId,
    nameTranslations: translationsFromForm(formData, "name"),
    titleTranslations: translationsFromForm(formData, "title"),
    biographyTranslations: translationsFromForm(formData, "biography"),
    profileImageUrl,
    specialty: stringFromForm(formData, "specialty"),
  });
  revalidatePath(`/providers/${providerId}/staff`);
}

export async function updateStaffAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageStaff");
  const profileImageUrl = stringFromForm(formData, "profileImageUrl");
  await assertMediaReferenceAccessible({ userId: user.id, providerId, reference: profileImageUrl });
  await updateProviderStaff({
    providerId,
    providerStaffId: stringFromForm(formData, "providerStaffId"),
    staffId: stringFromForm(formData, "staffId"),
    nameTranslations: translationsFromForm(formData, "name"),
    titleTranslations: translationsFromForm(formData, "title"),
    biographyTranslations: translationsFromForm(formData, "biography"),
    profileImageUrl,
    specialty: stringFromForm(formData, "specialty"),
    isActive: booleanFromForm(formData, "isActive"),
  });
  revalidatePath(`/providers/${providerId}/staff`);
  redirect(`/providers/${providerId}/staff`);
}

export async function unlinkProviderStaffAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageStaff");
  await unlinkProviderStaff(providerId, stringFromForm(formData, "providerStaffId"));
  revalidatePath(`/providers/${providerId}/staff`);
}

export async function updateClaimedStaffProfileAction(formData: FormData) {
  const user = await requireCurrentUser();
  const staffId = stringFromForm(formData, "staffId");
  const claim = await requireStaffProfilePermission(user.id, staffId, "manageOwnProfile");
  const profileImageUrl = stringFromForm(formData, "profileImageUrl");
  if (!claim.serviceProviderId) throw new Error("The approved staff claim is not linked to a provider.");
  await assertMediaReferenceAccessible({ userId: user.id, providerId: claim.serviceProviderId, reference: profileImageUrl });
  await updateClaimedStaffProfile({
    staffId,
    nameTranslations: translationsFromForm(formData, "name"),
    titleTranslations: translationsFromForm(formData, "title"),
    biographyTranslations: translationsFromForm(formData, "biography"),
    profileImageUrl,
    specialty: stringFromForm(formData, "specialty"),
  });
  revalidatePath(`/staff/${staffId}/profile`);
}

export async function setStaffActiveAdminAction(formData: FormData) {
  const user = await requireAdminUser("PROVIDER_ADMIN");
  const value = booleanFromForm(formData, "value");
  const reason = stringFromForm(formData, "reason");
  if (!value && !reason.trim()) throw new Error("A reason is required when deactivating a staff profile.");
  await setStaffActiveByAdmin({ staffId: stringFromForm(formData, "staffId"), value, reason, actorUserId: user.id });
  revalidatePath("/admin/staff");
}

export async function setProviderStaffLinkActiveAdminAction(formData: FormData) {
  const user = await requireAdminUser("PROVIDER_ADMIN");
  const value = booleanFromForm(formData, "value");
  const reason = stringFromForm(formData, "reason");
  if (!value && !reason.trim()) throw new Error("A reason is required when disabling a provider staff link.");
  await setProviderStaffLinkActiveByAdmin({ providerStaffId: stringFromForm(formData, "providerStaffId"), value, reason, actorUserId: user.id });
  revalidatePath("/admin/staff");
}

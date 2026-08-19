"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission, requireStaffProfilePermission } from "@core/auth/permissions";
import { booleanFromForm, numberFromForm, stringFromForm, translationsFromForm } from "@core/lib/forms";
import { deleteProviderService, setProviderServiceAdminFlag, updateAssignedStaffServicePrice, upsertProviderService } from "./repository";
import { assertMediaReferenceAccessible } from "@core/media/repository";

export async function saveProviderServiceAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageServices");
  const imageUrl = stringFromForm(formData, "imageUrl");
  await assertMediaReferenceAccessible({ userId: user.id, providerId, reference: imageUrl });
  await upsertProviderService({
    id: stringFromForm(formData, "serviceId"),
    providerId,
    serviceDefinitionId: stringFromForm(formData, "serviceDefinitionId"),
    displayNameTranslations: translationsFromForm(formData, "displayName"),
    descriptionTranslations: translationsFromForm(formData, "description"),
    isActive: booleanFromForm(formData, "isActive"),
    currency: stringFromForm(formData, "currency", "USD"),
    value: numberFromForm(formData, "value"),
    durationMinutes: numberFromForm(formData, "durationMinutes"),
    slotIntervalMinutes: numberFromForm(formData, "slotIntervalMinutes", 15),
    imageUrl,
    isPopular: booleanFromForm(formData, "isPopular"),
  });
  revalidatePath(`/providers/${providerId}/services`);
  redirect(`/providers/${providerId}/services`);
}

export async function deleteProviderServiceAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageServices");
  await deleteProviderService(providerId, stringFromForm(formData, "serviceId"));
  revalidatePath(`/providers/${providerId}/services`);
}

export async function saveStaffServicePriceAction(formData: FormData) {
  const user = await requireCurrentUser();
  const staffId = stringFromForm(formData, "staffId");
  const claim = await requireStaffProfilePermission(user.id, staffId, "manageOwnProfile");
  if (!claim.serviceProviderId) throw new Error("The approved staff claim is not linked to a provider.");
  const value = numberFromForm(formData, "value", -1);
  if (value < 0) throw new Error("Service price must be zero or greater.");
  await updateAssignedStaffServicePrice({
    staffId,
    providerId: claim.serviceProviderId,
    providerServiceId: stringFromForm(formData, "providerServiceId"),
    currency: stringFromForm(formData, "currency", "IRR"),
    value,
  });
  revalidatePath(`/staff/${staffId}/services/pricing`);
  revalidatePath(`/providers/${claim.serviceProviderId}/services`);
}

async function applyServiceFlag(formData: FormData, flag: "is_active" | "is_popular") {
  const user = await requireAdminUser("PROVIDER_ADMIN");
  const serviceId = stringFromForm(formData, "serviceId");
  const value = booleanFromForm(formData, "value");
  const reason = stringFromForm(formData, "reason");
  if (flag === "is_active" && !value && !reason.trim()) throw new Error("A reason is required when deactivating a service.");
  await setProviderServiceAdminFlag({ serviceId, flag, value, reason, actorUserId: user.id });
  revalidatePath("/admin/services");
}

export async function setProviderServiceActiveAction(formData: FormData) {
  await applyServiceFlag(formData, "is_active");
}

export async function setProviderServicePopularAction(formData: FormData) {
  await applyServiceFlag(formData, "is_popular");
}

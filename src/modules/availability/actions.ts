"use server";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission, requireStaffProfilePermission } from "@core/auth/permissions";
import { booleanFromForm, numberFromForm, stringFromForm, translationsFromForm } from "@core/lib/forms";
import {
  deleteAvailabilityRule,
  deleteStaffAvailabilityRule,
  deleteBookableResource,
  deleteOperatingHour,
  saveOperatingHour,
  setAvailabilityRuleActiveByAdmin,
  setBookableResourceActiveByAdmin,
  setOperatingHourClosedByAdmin,
  upsertAvailabilityRule,
  upsertStaffAvailabilityRule,
  upsertBookableResource,
} from "./repository";

export async function saveOperatingHourAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageAvailability");
  await saveOperatingHour({
    providerId,
    dayOfWeek: numberFromForm(formData, "dayOfWeek", 1),
    opensAt: stringFromForm(formData, "opensAt"),
    closesAt: stringFromForm(formData, "closesAt"),
    isClosed: booleanFromForm(formData, "isClosed"),
    slotIntervalMinutes: numberFromForm(formData, "slotIntervalMinutes", 15),
  });
  revalidatePath(`/providers/${providerId}/availability`);
}

export async function deleteOperatingHourAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageAvailability");
  await deleteOperatingHour(providerId, stringFromForm(formData, "operatingHourId"));
  revalidatePath(`/providers/${providerId}/availability`);
}

export async function saveBookableResourceAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageAvailability");
  await upsertBookableResource({
    id: stringFromForm(formData, "resourceId"),
    providerId,
    providerServiceId: stringFromForm(formData, "providerServiceId"),
    resourceType: stringFromForm(formData, "resourceType", "generic"),
    code: stringFromForm(formData, "code"),
    nameTranslations: translationsFromForm(formData, "name"),
    descriptionTranslations: translationsFromForm(formData, "description"),
    totalCapacity: numberFromForm(formData, "totalCapacity", 1),
    isActive: booleanFromForm(formData, "isActive"),
  });
  revalidatePath(`/providers/${providerId}/availability`);
}

export async function deleteBookableResourceAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageAvailability");
  await deleteBookableResource(providerId, stringFromForm(formData, "resourceId"));
  revalidatePath(`/providers/${providerId}/availability`);
}

export async function saveAvailabilityRuleAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageAvailability");
  await upsertAvailabilityRule({
    id: stringFromForm(formData, "ruleId"),
    providerId,
    targetType: stringFromForm(formData, "targetType", "provider"),
    resourceId: stringFromForm(formData, "resourceId"),
    dayOfWeek: numberFromForm(formData, "dayOfWeek", 0) || undefined,
    specificDate: stringFromForm(formData, "specificDate"),
    startsAt: stringFromForm(formData, "startsAt"),
    endsAt: stringFromForm(formData, "endsAt"),
    isAvailable: booleanFromForm(formData, "isAvailable"),
    capacity: numberFromForm(formData, "capacity", 0) || undefined,
    slotIntervalMinutes: numberFromForm(formData, "slotIntervalMinutes", 0) || undefined,
    isActive: booleanFromForm(formData, "isActive"),
  });
  revalidatePath(`/providers/${providerId}/availability`);
}

export async function deleteAvailabilityRuleAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageAvailability");
  await deleteAvailabilityRule(providerId, stringFromForm(formData, "ruleId"));
  revalidatePath(`/providers/${providerId}/availability`);
}

export async function saveStaffAvailabilityRuleAction(formData: FormData) {
  const user = await requireCurrentUser();
  const staffId = stringFromForm(formData, "staffId");
  const claim = await requireStaffProfilePermission(user.id, staffId, "manageOwnAvailability");
  if (!claim.serviceProviderId) throw new Error("The approved staff claim is not linked to a provider.");
  const dayOfWeek = numberFromForm(formData, "dayOfWeek", 0) || undefined;
  const specificDate = stringFromForm(formData, "specificDate");
  if (!dayOfWeek && !specificDate) throw new Error("Choose a recurring day or a specific date.");
  await upsertStaffAvailabilityRule({
    id: stringFromForm(formData, "ruleId"),
    staffId,
    providerId: claim.serviceProviderId,
    dayOfWeek,
    specificDate,
    startsAt: stringFromForm(formData, "startsAt"),
    endsAt: stringFromForm(formData, "endsAt"),
    isAvailable: booleanFromForm(formData, "isAvailable"),
    slotIntervalMinutes: numberFromForm(formData, "slotIntervalMinutes", 0) || undefined,
    isActive: booleanFromForm(formData, "isActive"),
  });
  revalidatePath(`/staff/${staffId}/availability`);
}

export async function deleteStaffAvailabilityRuleAction(formData: FormData) {
  const user = await requireCurrentUser();
  const staffId = stringFromForm(formData, "staffId");
  const claim = await requireStaffProfilePermission(user.id, staffId, "manageOwnAvailability");
  if (!claim.serviceProviderId) throw new Error("The approved staff claim is not linked to a provider.");
  await deleteStaffAvailabilityRule(staffId, claim.serviceProviderId, stringFromForm(formData, "ruleId"));
  revalidatePath(`/staff/${staffId}/availability`);
}

export async function setAvailabilityRuleActiveAdminAction(formData: FormData) {
  const user = await requireAdminUser("PROVIDER_ADMIN");
  const value = booleanFromForm(formData, "value");
  const reason = stringFromForm(formData, "reason");
  if (!value && !reason.trim()) throw new Error("A reason is required when disabling an availability rule.");
  await setAvailabilityRuleActiveByAdmin({ ruleId: stringFromForm(formData, "ruleId"), value, reason, actorUserId: user.id });
  revalidatePath("/admin/availability");
}

export async function setBookableResourceActiveAdminAction(formData: FormData) {
  const user = await requireAdminUser("PROVIDER_ADMIN");
  const value = booleanFromForm(formData, "value");
  const reason = stringFromForm(formData, "reason");
  if (!value && !reason.trim()) throw new Error("A reason is required when disabling a bookable resource.");
  await setBookableResourceActiveByAdmin({ resourceId: stringFromForm(formData, "resourceId"), value, reason, actorUserId: user.id });
  revalidatePath("/admin/availability");
}

export async function setOperatingHourClosedAdminAction(formData: FormData) {
  const user = await requireAdminUser("PROVIDER_ADMIN");
  const value = booleanFromForm(formData, "value");
  const reason = stringFromForm(formData, "reason");
  if (value && !reason.trim()) throw new Error("A reason is required when closing an operating day.");
  await setOperatingHourClosedByAdmin({ operatingHourId: stringFromForm(formData, "operatingHourId"), value, reason, actorUserId: user.id });
  revalidatePath("/admin/availability");
}

"use server";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission } from "@core/auth/permissions";
import { booleanFromForm, csvFromForm, phoneCountryCodeFromForm, stringFromForm, translationsFromForm } from "@core/lib/forms";
import { setProviderAdminFlag, updateProviderProfile } from "./repository";
import { assertMediaReferenceAccessible } from "@core/media/repository";

export async function updateProviderProfileAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageProfile");
  const imageUrl = stringFromForm(formData, "imageUrl");
  await assertMediaReferenceAccessible({ userId: user.id, providerId, reference: imageUrl });
  await updateProviderProfile({
    id: providerId,
    nameTranslations: translationsFromForm(formData, "name"),
    descriptionTranslations: translationsFromForm(formData, "description"),
    detailTranslations: translationsFromForm(formData, "detail"),
    streetTranslations: translationsFromForm(formData, "street"),
    email: stringFromForm(formData, "email"),
    phoneNumberCountryCode: phoneCountryCodeFromForm(formData, "phoneNumberCountryCode"),
    phoneNumber: stringFromForm(formData, "phoneNumber"),
    country: stringFromForm(formData, "country"),
    city: stringFromForm(formData, "city"),
    zipCode: stringFromForm(formData, "zipCode"),
    latitude: stringFromForm(formData, "latitude"),
    longitude: stringFromForm(formData, "longitude"),
    imageUrl,
    timezoneId: stringFromForm(formData, "timezoneId", "Asia/Tehran"),
    languages: csvFromForm(formData, "languages"),
    specialties: csvFromForm(formData, "specialties"),
  });
  revalidatePath(`/providers/${providerId}/profile`);
}

async function applyProviderFlag(formData: FormData, flag: "is_active" | "accredited" | "is_sponsored") {
  const user = await requireAdminUser("PROVIDER_ADMIN");
  const providerId = stringFromForm(formData, "providerId");
  const value = booleanFromForm(formData, "value");
  const reason = stringFromForm(formData, "reason");
  if (flag === "is_active" && !value && !reason.trim()) throw new Error("A reason is required when deactivating a provider.");
  await setProviderAdminFlag({ providerId, flag, value, reason, actorUserId: user.id });
  revalidatePath("/admin/providers");
  revalidatePath(`/providers/${providerId}/dashboard`);
  revalidatePath(`/providers/${providerId}/profile`);
}

export async function setProviderActiveAction(formData: FormData) {
  await applyProviderFlag(formData, "is_active");
}

export async function setProviderAccreditedAction(formData: FormData) {
  await applyProviderFlag(formData, "accredited");
}

export async function setProviderSponsoredAction(formData: FormData) {
  await applyProviderFlag(formData, "is_sponsored");
}

"use server";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission } from "@core/auth/permissions";
import { booleanFromForm, numberFromForm, stringFromForm, translationsFromForm } from "@core/lib/forms";
import { createOffer, deleteOffer, expireOfferByAdmin, setOfferAdminFlag } from "./repository";

export async function createOfferAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageServices");
  await createOffer({
    providerId,
    providerServiceId: stringFromForm(formData, "providerServiceId"),
    title: stringFromForm(formData, "title"),
    subtitle: stringFromForm(formData, "subtitle"),
    discountPercent: numberFromForm(formData, "discountPercent"),
    validUntil: stringFromForm(formData, "validUntil"),
    code: stringFromForm(formData, "code"),
    usageLimit: numberFromForm(formData, "usageLimit", 0) || undefined,
    isFeatured: booleanFromForm(formData, "isFeatured"),
    descriptionTranslations: translationsFromForm(formData, "description"),
  });
  revalidatePath(`/providers/${providerId}/offers`);
}

export async function deleteOfferAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageServices");
  await deleteOffer(providerId, numberFromForm(formData, "offerId"));
  revalidatePath(`/providers/${providerId}/offers`);
}

async function applyOfferFlag(formData: FormData, flag: "is_active" | "is_featured") {
  const user = await requireAdminUser("CONTENT_ADMIN");
  const value = booleanFromForm(formData, "value");
  const reason = stringFromForm(formData, "reason");
  if (flag === "is_active" && !value && !reason.trim()) throw new Error("A reason is required when deactivating an offer.");
  await setOfferAdminFlag({ offerId: numberFromForm(formData, "offerId"), flag, value, reason, actorUserId: user.id });
  revalidatePath("/admin/offers");
}

export async function setOfferActiveAdminAction(formData: FormData) {
  await applyOfferFlag(formData, "is_active");
}

export async function setOfferFeaturedAdminAction(formData: FormData) {
  await applyOfferFlag(formData, "is_featured");
}

export async function expireOfferAdminAction(formData: FormData) {
  const user = await requireAdminUser("CONTENT_ADMIN");
  const reason = stringFromForm(formData, "reason");
  if (!reason.trim()) throw new Error("A reason is required when expiring an offer.");
  await expireOfferByAdmin({ offerId: numberFromForm(formData, "offerId"), reason, actorUserId: user.id });
  revalidatePath("/admin/offers");
}

"use server";

import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireAdminUser, requireProviderPermission } from "@core/auth/permissions";
import { booleanFromForm, numberFromForm, stringFromForm, translationsFromForm } from "@core/lib/forms";
import { assertMediaReferenceAccessible } from "@core/media/repository";
import { attachMediaToEntity, createMediaAsset, reviewMediaAsset, setMediaPrimary } from "./repository";

export async function createAndAttachMediaAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageMedia");
  const selected = await assertMediaReferenceAccessible({ userId: user.id, providerId, reference: stringFromForm(formData, "mediaReference") });
  if (!selected) throw new Error("Select a provider-owned media file from the LSevin media library.");
  const mediaAssetId = await createMediaAsset({
    originalName: selected.originalName,
    fileUrl: selected.fileUrl,
    mimeType: selected.mimeType,
    mediaKind: selected.mediaType,
    sizeBytes: selected.fileSize,
    titleTranslations: translationsFromForm(formData, "title"),
    altTranslations: translationsFromForm(formData, "alt"),
    createdByUserId: user.id,
    moderationStatus: "pending",
  });
  await attachMediaToEntity({
    mediaAssetId,
    providerId,
    ownerEntityType: stringFromForm(formData, "ownerEntityType", "provider"),
    ownerEntityId: stringFromForm(formData, "ownerEntityId", providerId),
    usageKind: stringFromForm(formData, "usageKind", "gallery"),
    displayOrder: numberFromForm(formData, "displayOrder", 0),
    isPrimary: booleanFromForm(formData, "isPrimary"),
  });
  revalidatePath(`/providers/${providerId}/media-library`);
  revalidatePath("/admin/media-library");
}

export async function setMediaPrimaryAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageMedia");
  await setMediaPrimary({ usageId: stringFromForm(formData, "usageId"), providerId });
  revalidatePath(`/providers/${providerId}/media-library`);
}

export async function reviewMediaAssetAction(formData: FormData) {
  const user = await requireAdminUser("CONTENT_ADMIN");
  const decision = stringFromForm(formData, "decision", "approved") as "approved" | "rejected" | "hidden";
  await reviewMediaAsset({
    mediaAssetId: stringFromForm(formData, "mediaAssetId"),
    decision: ["approved", "rejected", "hidden"].includes(decision) ? decision : "approved",
    reviewerUserId: user.id,
    reason: stringFromForm(formData, "reason"),
  });
  revalidatePath("/admin/media-library");
}

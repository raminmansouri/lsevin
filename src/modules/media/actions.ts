"use server";
import { revalidatePath } from "next/cache";
import { requireCurrentUser } from "@core/auth/session";
import { requireProviderPermission } from "@core/auth/permissions";
import { numberFromForm, stringFromForm, translationsFromForm } from "@core/lib/forms";
import { addGalleryItem, deleteGalleryItem } from "./repository";
import { assertMediaReferenceAccessible } from "@core/media/repository";

export async function addGalleryItemAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageMedia");
  const url = stringFromForm(formData, "url");
  await assertMediaReferenceAccessible({ userId: user.id, providerId, reference: url });
  await addGalleryItem({
    providerId,
    titleTranslations: translationsFromForm(formData, "title"),
    descriptionTranslations: translationsFromForm(formData, "description"),
    url,
    mediaType: stringFromForm(formData, "mediaType", "image"),
    displayOrder: numberFromForm(formData, "displayOrder"),
  });
  revalidatePath(`/providers/${providerId}/media`);
}

export async function deleteGalleryItemAction(formData: FormData) {
  const user = await requireCurrentUser();
  const providerId = stringFromForm(formData, "providerId");
  await requireProviderPermission(user.id, providerId, "manageMedia");
  await deleteGalleryItem(providerId, stringFromForm(formData, "galleryItemId"));
  revalidatePath(`/providers/${providerId}/media`);
}

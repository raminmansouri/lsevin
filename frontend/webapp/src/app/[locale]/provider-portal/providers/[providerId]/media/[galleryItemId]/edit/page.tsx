import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderGallery } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, tr } from "@/features/provider-portal/lib/form-page-utils";

export default async function EditProviderMediaPage({ params }: { params: Promise<{ locale: string; providerId: string; galleryItemId: string }> }) {
  const { locale, providerId, galleryItemId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const item = (await listProviderGallery(userId, providerId, locale)).find((row) => row.id === galleryItemId);
  if (!item) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "galleryItemId", type: "hidden" as const },
    { name: "titleEn", label: "Title English", type: "text" as const },
    { name: "titleFa", label: "Title Persian", type: "text" as const },
    { name: "descriptionEn", label: "Description English", type: "textarea" as const, rows: 4, fullWidth: true },
    { name: "descriptionFa", label: "Description Persian", type: "textarea" as const, rows: 4, fullWidth: true },
    { name: "url", label: "Media URL / media id", type: "text" as const, required: true, fullWidth: true },
    { name: "mediaType", label: "Media type", type: "select" as const, options: [{ value: "image", label: "Image" }, { value: "video", label: "Video" }, { value: "gif", label: "GIF" }, { value: "file", label: "File" }] },
    { name: "displayOrder", label: "Display order", type: "number" as const },
  ];

  return <ProviderRecordForm operation="saveProviderGallery" title="Edit provider media" description="Update this provider gallery item." fields={fields} initialValues={{ providerId, galleryItemId: item.id, titleEn: tr(item.title, "en-US"), titleFa: tr(item.title, "fa-IR"), descriptionEn: tr(item.description, "en-US"), descriptionFa: tr(item.description, "fa-IR"), url: item.url, mediaType: item.mediaType, displayOrder: item.displayOrder }} backHref={providerPortalBack(providerId, "/media")} submitLabel="Save media" successMessage="Media updated." />;
}

import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderStaff, listProviderStaffRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, serviceDefinitionOptions, staffOptions, toDateInput, toTimeInput, tr } from "@/features/provider-portal/lib/form-page-utils";

export default async function EditStaffGalleryItemPage({ params }: { params: Promise<{ locale: string; providerId: string; staffId: string; staffGalleryItemId: string }> }) {
  const { locale, providerId, staffId, staffGalleryItemId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [staff, related] = await Promise.all([
    listProviderStaff(userId, providerId, locale),
    listProviderStaffRelatedRecords(userId, providerId, locale),
  ]);
  const item = related.gallery.find((row) => row.id === staffGalleryItemId && row.staffId === staffId);
  if (!item) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "staffGalleryItemId", type: "hidden" as const },
    { name: "staffId", label: "Staff", type: "select" as const, required: true, options: staffOptions(staff), fullWidth: true },
    { name: "titleEn", label: "Title English", type: "text" as const },
    { name: "titleFa", label: "Title Persian", type: "text" as const },
    { name: "descriptionEn", label: "Description English", type: "textarea" as const, rows: 4, fullWidth: true },
    { name: "descriptionFa", label: "Description Persian", type: "textarea" as const, rows: 4, fullWidth: true },
    { name: "url", label: "Media URL / media id", type: "text" as const, required: true, fullWidth: true },
    { name: "mediaType", label: "Media type", type: "select" as const, options: [{ value: "image", label: "Image" }, { value: "video", label: "Video" }, { value: "gif", label: "GIF" }, { value: "file", label: "File" }] },
    { name: "displayOrder", label: "Display order", type: "number" as const },
    { name: "isPrimary", label: "Primary image", type: "checkbox" as const },
  ];

  return <ProviderRecordForm operation="saveStaffGalleryItem" title="Edit staff gallery item" description="Update this staff gallery item." fields={fields} initialValues={{ providerId, staffGalleryItemId: item.id, staffId: item.staffId, titleEn: tr(item.title, "en-US"), titleFa: tr(item.title, "fa-IR"), descriptionEn: tr(item.description, "en-US"), descriptionFa: tr(item.description, "fa-IR"), url: item.url, mediaType: item.mediaType, displayOrder: item.displayOrder, isPrimary: item.isPrimary }} backHref={providerPortalBack(providerId, `/staff/${staffId}/gallery`)} submitLabel="Save gallery item" successMessage="Gallery item updated." />;
}

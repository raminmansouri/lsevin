import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderStaff, listProviderStaffRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, serviceDefinitionOptions, staffOptions, toDateInput, toTimeInput, tr } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewStaffGalleryItemPage({ params }: { params: Promise<{ locale: string; providerId: string; staffId: string }> }) {
  const { locale, providerId, staffId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const staff = await listProviderStaff(userId, providerId, locale);
  if (!staff.some((item) => item.id === staffId)) notFound();

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

  return <ProviderRecordForm operation="saveStaffGalleryItem" title="Add staff gallery item" description="Add image/video/GIF to this staff profile." fields={fields} initialValues={{ providerId, staffId, mediaType: "image", displayOrder: 0, isPrimary: false }} backHref={providerPortalBack(providerId, `/staff/${staffId}/gallery`)} submitLabel="Save gallery item" successMessage="Gallery item saved." />;
}

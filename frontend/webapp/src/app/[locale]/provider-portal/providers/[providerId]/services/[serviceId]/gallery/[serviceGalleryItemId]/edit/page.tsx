import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import {
  getProviderWorkspace,
  listProviderServiceRelatedRecords,
  listProviderServices,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import {
  addonOptions,
  providerPortalBack,
  providerServiceOptions,
  tr,
} from "@/features/provider-portal/lib/form-page-utils";

export default async function EditServiceGalleryItemPage({
  params,
}: {
  params: Promise<{
    locale: string;
    providerId: string;
    serviceId: string;
    serviceGalleryItemId: string;
  }>;
}) {
  const { locale, providerId, serviceId, serviceGalleryItemId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [services, related] = await Promise.all([
    listProviderServices(userId, providerId, locale),
    listProviderServiceRelatedRecords(userId, providerId, locale),
  ]);
  const item = related.serviceGallery.find(
    (row) =>
      row.id === serviceGalleryItemId && row.providerServiceId === serviceId,
  );
  if (!item) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "serviceGalleryItemId", type: "hidden" as const },
    {
      name: "providerServiceId",
      label: "Service",
      type: "select" as const,
      required: true,
      options: providerServiceOptions(services),
      fullWidth: true,
    },
    { name: "titleEn", label: "Title English", type: "text" as const },
    { name: "titleFa", label: "Title Persian", type: "text" as const },
    {
      name: "descriptionEn",
      label: "Description English",
      type: "textarea" as const,
      rows: 4,
      fullWidth: true,
    },
    {
      name: "descriptionFa",
      label: "Description Persian",
      type: "textarea" as const,
      rows: 4,
      fullWidth: true,
    },
    {
      name: "url",
      label: "Media URL / media id",
      type: "text" as const,
      required: true,
      fullWidth: true,
    },
    {
      name: "mediaType",
      label: "Media type",
      type: "select" as const,
      options: [
        { value: "image", label: "Image" },
        { value: "video", label: "Video" },
        { value: "gif", label: "GIF" },
        { value: "file", label: "File" },
      ],
    },
    { name: "displayOrder", label: "Display order", type: "number" as const },
    { name: "isPrimary", label: "Primary image", type: "checkbox" as const },
  ];

  return (
    <ProviderRecordForm
      operation="saveServiceGalleryItem"
      title="Edit service gallery item"
      description="Update this service media item."
      fields={fields}
      initialValues={{
        providerId,
        serviceGalleryItemId: item.id,
        providerServiceId: item.providerServiceId,
        titleEn: tr(item.title, "en-US"),
        titleFa: tr(item.title, "fa-IR"),
        descriptionEn: tr(item.description, "en-US"),
        descriptionFa: tr(item.description, "fa-IR"),
        url: item.url,
        mediaType: item.mediaType,
        displayOrder: item.displayOrder,
        isPrimary: item.isPrimary,
      }}
      backHref={providerPortalBack(
        providerId,
        `/services/${serviceId}/gallery`,
      )}
      submitLabel="Save gallery item"
      successMessage="Gallery item updated."
    />
  );
}

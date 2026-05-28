import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import {
  getProviderWorkspace,
  listProviderServices,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import {
  providerPortalBack,
  providerServiceOptions,
} from "@/features/provider-portal/lib/form-page-utils";

export default async function NewServiceGalleryItemFromServicesPage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string }>;
}) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const services = await listProviderServices(userId, providerId, locale);

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
      title="Add service gallery item"
      description="Choose a service and attach an image, GIF, video, or file."
      fields={fields}
      initialValues={{
        providerId,
        providerServiceId: services[0]?.id || "",
        mediaType: "image",
        displayOrder: 0,
        isPrimary: false,
      }}
      backHref={providerPortalBack(providerId, "/services/gallery")}
      submitLabel="Save gallery item"
      successMessage="Gallery item saved."
    />
  );
}

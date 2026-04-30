import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderGallery } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, tr } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewProviderMediaPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);

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

  return <ProviderRecordForm operation="saveProviderGallery" title="Add provider media" description="Add images, videos, GIFs, or files to the provider gallery." fields={fields} initialValues={{ providerId, mediaType: "image", displayOrder: 0 }} backHref={providerPortalBack(providerId, "/media")} submitLabel="Save media" successMessage="Media saved." />;
}

import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderStaff, listProviderStaffRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, serviceDefinitionOptions, staffOptions, toDateInput, toTimeInput, tr } from "@/features/provider-portal/lib/form-page-utils";

export default async function EditStaffCertificationPage({ params }: { params: Promise<{ locale: string; providerId: string; staffId: string; certificationId: string }> }) {
  const { locale, providerId, staffId, certificationId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [staff, related] = await Promise.all([
    listProviderStaff(userId, providerId, locale),
    listProviderStaffRelatedRecords(userId, providerId, locale),
  ]);
  const item = related.certifications.find((row) => row.id === certificationId && row.staffId === staffId);
  if (!item) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "certificationId", type: "hidden" as const },
    { name: "staffId", label: "Staff", type: "select" as const, required: true, options: staffOptions(staff), fullWidth: true },
    { name: "name", label: "Certification name", type: "text" as const, required: true },
    { name: "issuer", label: "Issuer", type: "text" as const },
  ];

  return <ProviderRecordForm operation="saveStaffCertification" title="Edit staff certification" description="Update this staff certification." fields={fields} initialValues={{ providerId, certificationId: item.id, staffId: item.staffId, name: item.name, issuer: item.issuer || "" }} backHref={providerPortalBack(providerId, `/staff/${staffId}/certifications`)} submitLabel="Save certification" successMessage="Certification updated." />;
}

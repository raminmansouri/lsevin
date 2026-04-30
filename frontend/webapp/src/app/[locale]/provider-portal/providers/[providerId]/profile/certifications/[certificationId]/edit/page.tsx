import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderProfileRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { policyTypeOptions, providerPortalBack, tr } from "@/features/provider-portal/lib/form-page-utils";

export default async function EditProviderCertificationPage({ params }: { params: Promise<{ locale: string; providerId: string; certificationId: string }> }) {
  const { locale, providerId, certificationId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const related = await listProviderProfileRelatedRecords(userId, providerId, locale);
  const certification = related.certifications.find((item) => item.id === certificationId);
  if (!certification) notFound();
  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "certificationId", type: "hidden" as const },
    { name: "name", label: "Certification name", type: "text" as const, required: true, fullWidth: true },
  ];
  return <ProviderRecordForm operation="saveProviderCertification" title="Edit provider certification" description={certification.isVerified ? "Verified certifications cannot be changed by provider." : "Update this certification."} fields={fields} initialValues={{ providerId, certificationId: certification.id, name: certification.name }} backHref={providerPortalBack(providerId, "/profile/certifications")} submitLabel="Save certification" successMessage="Certification updated." />;
}

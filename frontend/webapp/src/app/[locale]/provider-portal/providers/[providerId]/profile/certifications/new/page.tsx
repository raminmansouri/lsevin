import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderProfileRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { policyTypeOptions, providerPortalBack, tr } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewProviderCertificationPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "certificationId", type: "hidden" as const },
    { name: "name", label: "Certification name", type: "text" as const, required: true, fullWidth: true },
  ];
  return <ProviderRecordForm operation="saveProviderCertification" title="Add provider certification" description="Provider-added certifications are unverified until platform/admin verification." fields={fields} initialValues={{ providerId }} backHref={providerPortalBack(providerId, "/profile/certifications")} submitLabel="Save certification" successMessage="Certification saved." />;
}

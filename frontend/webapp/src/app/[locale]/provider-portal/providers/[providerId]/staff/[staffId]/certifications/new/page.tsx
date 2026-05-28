import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import {
  getProviderWorkspace,
  listProviderStaff,
  listProviderStaffRelatedRecords,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import {
  providerPortalBack,
  serviceDefinitionOptions,
  staffOptions,
  toDateInput,
  toTimeInput,
  tr,
} from "@/features/provider-portal/lib/form-page-utils";

export default async function NewStaffCertificationPage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string; staffId: string }>;
}) {
  const { locale, providerId, staffId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const staff = await listProviderStaff(userId, providerId, locale);
  if (!staff.some((item) => item.id === staffId)) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "certificationId", type: "hidden" as const },
    {
      name: "staffId",
      label: "Staff",
      type: "select" as const,
      required: true,
      options: staffOptions(staff),
      fullWidth: true,
    },
    {
      name: "name",
      label: "Certification name",
      type: "text" as const,
      required: true,
    },
    { name: "issuer", label: "Issuer", type: "text" as const },
  ];

  return (
    <ProviderRecordForm
      operation="saveStaffCertification"
      title="Add staff certification"
      description="Add a certification to this staff/specialist profile."
      fields={fields}
      initialValues={{ providerId, staffId }}
      backHref={providerPortalBack(
        providerId,
        `/staff/${staffId}/certifications`,
      )}
      submitLabel="Save certification"
      successMessage="Certification saved."
    />
  );
}

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import {
  getProviderWorkspace,
  listProviderStaff,
} from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import {
  providerPortalBack,
  staffOptions,
} from "@/features/provider-portal/lib/form-page-utils";

export default async function NewStaffCertificationFromStaffPage({
  params,
}: {
  params: Promise<{ locale: string; providerId: string }>;
}) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const staff = await listProviderStaff(userId, providerId, locale);

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
      description="Choose a staff member and add a certification."
      fields={fields}
      initialValues={{ providerId, staffId: staff[0]?.id || "" }}
      backHref={providerPortalBack(providerId, "/staff/certifications")}
      submitLabel="Save certification"
      successMessage="Certification saved."
    />
  );
}

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

export default async function EditStaffEducationPage({
  params,
}: {
  params: Promise<{
    locale: string;
    providerId: string;
    staffId: string;
    educationId: string;
  }>;
}) {
  const { locale, providerId, staffId, educationId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [staff, related] = await Promise.all([
    listProviderStaff(userId, providerId, locale),
    listProviderStaffRelatedRecords(userId, providerId, locale),
  ]);
  const item = related.education.find(
    (row) => row.id === educationId && row.staffId === staffId,
  );
  if (!item) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "educationId", type: "hidden" as const },
    {
      name: "staffId",
      label: "Staff",
      type: "select" as const,
      required: true,
      options: staffOptions(staff),
      fullWidth: true,
    },
    { name: "degree", label: "Degree", type: "text" as const, required: true },
    {
      name: "institution",
      label: "Institution",
      type: "text" as const,
      required: true,
    },
    {
      name: "year",
      label: "Year",
      type: "number" as const,
      min: 1900,
      max: 2200,
    },
  ];

  return (
    <ProviderRecordForm
      operation="saveStaffEducation"
      title="Edit staff education"
      description="Update this education record."
      fields={fields}
      initialValues={{
        providerId,
        educationId: item.id,
        staffId: item.staffId,
        degree: item.degree,
        institution: item.institution,
        year: item.year || "",
      }}
      backHref={providerPortalBack(providerId, `/staff/${staffId}/education`)}
      submitLabel="Save education"
      successMessage="Education updated."
    />
  );
}

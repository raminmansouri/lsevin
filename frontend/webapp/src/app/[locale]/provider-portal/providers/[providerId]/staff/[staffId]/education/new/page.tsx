import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderStaff, listProviderStaffRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, serviceDefinitionOptions, staffOptions, toDateInput, toTimeInput, tr } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewStaffEducationPage({ params }: { params: Promise<{ locale: string; providerId: string; staffId: string }> }) {
  const { locale, providerId, staffId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const staff = await listProviderStaff(userId, providerId, locale);
  if (!staff.some((item) => item.id === staffId)) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "educationId", type: "hidden" as const },
    { name: "staffId", label: "Staff", type: "select" as const, required: true, options: staffOptions(staff), fullWidth: true },
    { name: "degree", label: "Degree", type: "text" as const, required: true },
    { name: "institution", label: "Institution", type: "text" as const, required: true },
    { name: "year", label: "Year", type: "number" as const, min: 1900, max: 2200 },
  ];

  return <ProviderRecordForm operation="saveStaffEducation" title="Add staff education" description="Add education history to this staff/specialist profile." fields={fields} initialValues={{ providerId, staffId }} backHref={providerPortalBack(providerId, `/staff/${staffId}/education`)} submitLabel="Save education" successMessage="Education saved." />;
}

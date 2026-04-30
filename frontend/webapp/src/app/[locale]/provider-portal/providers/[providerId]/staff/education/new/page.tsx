import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderStaff } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, staffOptions } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewStaffEducationFromStaffPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const staff = await listProviderStaff(userId, providerId, locale);

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "educationId", type: "hidden" as const },
    { name: "staffId", label: "Staff", type: "select" as const, required: true, options: staffOptions(staff), fullWidth: true },
    { name: "degree", label: "Degree", type: "text" as const, required: true },
    { name: "institution", label: "Institution", type: "text" as const, required: true },
    { name: "year", label: "Year", type: "number" as const, min: 1900, max: 2200 },
  ];

  return <ProviderRecordForm operation="saveStaffEducation" title="Add staff education" description="Choose a staff member and add education history." fields={fields} initialValues={{ providerId, staffId: staff[0]?.id || "" }} backHref={providerPortalBack(providerId, "/staff/education")} submitLabel="Save education" successMessage="Education saved." />;
}

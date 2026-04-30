import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderStaff } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, tr } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewProviderStaffPage({ params }: { params: Promise<{ locale: string; providerId: string }> }) {
  const { locale, providerId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "staffId", type: "hidden" as const },
    { name: "providerStaffId", type: "hidden" as const },
    { name: "nameEn", label: "Name English", type: "text" as const, required: true },
    { name: "nameFa", label: "Name Persian", type: "text" as const },
    { name: "titleEn", label: "Title English", type: "text" as const },
    { name: "titleFa", label: "Title Persian", type: "text" as const },
    { name: "biographyEn", label: "Biography English", type: "textarea" as const, rows: 5, fullWidth: true },
    { name: "biographyFa", label: "Biography Persian", type: "textarea" as const, rows: 5, fullWidth: true },
    { name: "profileImageUrl", label: "Profile image URL / media id", type: "text" as const, fullWidth: true },
    { name: "specialty", label: "Specialty", type: "text" as const },
    { name: "experienceYears", label: "Experience years", type: "number" as const, min: 0 },
    { name: "consultationFee", label: "Consultation fee", type: "number" as const, step: "0.01", min: 0 },
    { name: "notesEn", label: "Provider notes English", type: "textarea" as const, rows: 3 },
    { name: "notesFa", label: "Provider notes Persian", type: "textarea" as const, rows: 3 },
    { name: "isActive", label: "Active", type: "checkbox" as const },
  ];

  return (
    <ProviderRecordForm
      operation="saveStaff"
      title="Add staff / specialist"
      description="Create a staff profile and link it to this provider."
      fields={fields}
      initialValues={{ providerId, isActive: true, consultationFee: 0 }}
      backHref={providerPortalBack(providerId, "/staff")}
      submitLabel="Create staff"
      successMessage="Staff created."
    />
  );
}

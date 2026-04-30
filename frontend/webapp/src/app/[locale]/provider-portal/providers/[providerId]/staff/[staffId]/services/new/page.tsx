import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderStaff, listProviderStaffRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, serviceDefinitionOptions, staffOptions, toDateInput, toTimeInput, tr } from "@/features/provider-portal/lib/form-page-utils";

export default async function NewStaffServicePage({ params }: { params: Promise<{ locale: string; providerId: string; staffId: string }> }) {
  const { locale, providerId, staffId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [staff, related] = await Promise.all([
    listProviderStaff(userId, providerId, locale),
    listProviderStaffRelatedRecords(userId, providerId, locale),
  ]);
  if (!staff.some((item) => item.id === staffId)) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "staffServiceId", type: "hidden" as const },
    { name: "staffId", label: "Staff", type: "select" as const, required: true, options: staffOptions(staff), fullWidth: true },
    { name: "serviceDefinitionId", label: "Service definition", type: "select" as const, required: true, options: serviceDefinitionOptions(related.serviceDefinitions), fullWidth: true },
    { name: "notesEn", label: "Notes English", type: "textarea" as const, rows: 3 },
    { name: "notesFa", label: "Notes Persian", type: "textarea" as const, rows: 3 },
    { name: "isActive", label: "Active", type: "checkbox" as const },
  ];

  return <ProviderRecordForm operation="saveStaffService" title="Link staff to service definition" description="Control which service definitions this specialist can perform." fields={fields} initialValues={{ providerId, staffId, serviceDefinitionId: related.serviceDefinitions[0]?.id || "", isActive: true }} backHref={providerPortalBack(providerId, `/staff/${staffId}/services`)} submitLabel="Save service link" successMessage="Service link saved." />;
}

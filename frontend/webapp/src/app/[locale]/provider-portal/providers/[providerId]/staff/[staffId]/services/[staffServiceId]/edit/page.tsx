import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderStaff, listProviderStaffRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, serviceDefinitionOptions, staffOptions, toDateInput, toTimeInput, tr } from "@/features/provider-portal/lib/form-page-utils";

export default async function EditStaffServicePage({ params }: { params: Promise<{ locale: string; providerId: string; staffId: string; staffServiceId: string }> }) {
  const { locale, providerId, staffId, staffServiceId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [staff, related] = await Promise.all([
    listProviderStaff(userId, providerId, locale),
    listProviderStaffRelatedRecords(userId, providerId, locale),
  ]);
  const item = related.services.find((row) => row.id === staffServiceId && row.staffId === staffId);
  if (!item) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "staffServiceId", type: "hidden" as const },
    { name: "staffId", label: "Staff", type: "select" as const, required: true, options: staffOptions(staff), fullWidth: true },
    { name: "serviceDefinitionId", label: "Service definition", type: "select" as const, required: true, options: serviceDefinitionOptions(related.serviceDefinitions), fullWidth: true },
    { name: "notesEn", label: "Notes English", type: "textarea" as const, rows: 3 },
    { name: "notesFa", label: "Notes Persian", type: "textarea" as const, rows: 3 },
    { name: "isActive", label: "Active", type: "checkbox" as const },
  ];

  return <ProviderRecordForm operation="saveStaffService" title="Edit staff service link" description="Update this staff-to-service definition link." fields={fields} initialValues={{ providerId, staffServiceId: item.id, staffId: item.staffId, serviceDefinitionId: item.serviceDefinitionId, notesEn: tr(item.notes, "en-US"), notesFa: tr(item.notes, "fa-IR"), isActive: item.isActive }} backHref={providerPortalBack(providerId, `/staff/${staffId}/services`)} submitLabel="Save service link" successMessage="Service link updated." />;
}

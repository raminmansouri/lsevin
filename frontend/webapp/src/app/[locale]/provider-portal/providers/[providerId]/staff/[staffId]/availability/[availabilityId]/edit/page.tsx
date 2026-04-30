import { notFound } from "next/navigation";

import { ProviderRecordForm } from "@/features/provider-portal/components/provider-record-form";
import { getProviderWorkspace, listProviderStaff, listProviderStaffRelatedRecords } from "@/features/provider-portal/server/repository";
import { requireCurrentUserId } from "@/features/provider-portal/server/session";
import { providerPortalBack, serviceDefinitionOptions, staffOptions, toDateInput, toTimeInput, tr } from "@/features/provider-portal/lib/form-page-utils";

export default async function EditStaffAvailabilityPage({ params }: { params: Promise<{ locale: string; providerId: string; staffId: string; availabilityId: string }> }) {
  const { locale, providerId, staffId, availabilityId } = await params;
  const userId = await requireCurrentUserId();
  await getProviderWorkspace(userId, providerId, locale);
  const [staff, related] = await Promise.all([
    listProviderStaff(userId, providerId, locale),
    listProviderStaffRelatedRecords(userId, providerId, locale),
  ]);
  const item = related.availability.find((row) => row.id === availabilityId && row.staffId === staffId);
  if (!item) notFound();

  const fields = [
    { name: "providerId", type: "hidden" as const },
    { name: "availabilityId", type: "hidden" as const },
    { name: "staffId", label: "Staff", type: "select" as const, required: true, options: staffOptions(staff), fullWidth: true },
    { name: "dayOfWeek", label: "Day of week", type: "select" as const, required: true, options: [{ value: 1, label: "Monday" }, { value: 2, label: "Tuesday" }, { value: 3, label: "Wednesday" }, { value: 4, label: "Thursday" }, { value: 5, label: "Friday" }, { value: 6, label: "Saturday" }, { value: 7, label: "Sunday" }] },
    { name: "startTime", label: "Start time", type: "time" as const, required: true },
    { name: "endTime", label: "End time", type: "time" as const, required: true },
    { name: "availabilityStatusId", label: "Status id", type: "number" as const, min: 1 },
    { name: "specificDate", label: "Specific date", type: "date" as const, helpText: "Optional. Leave empty for recurring weekly availability." },
    { name: "isRecurring", label: "Recurring weekly", type: "checkbox" as const },
  ];

  return <ProviderRecordForm operation="saveStaffAvailability" title="Edit staff availability" description="Update this staff availability block." fields={fields} initialValues={{ providerId, availabilityId: item.id, staffId: item.staffId, dayOfWeek: item.dayOfWeek, startTime: toTimeInput(item.startTime), endTime: toTimeInput(item.endTime), isRecurring: item.isRecurring, availabilityStatusId: item.availabilityStatusId, specificDate: toDateInput(item.specificDate) }} backHref={providerPortalBack(providerId, `/staff/${staffId}/availability`)} submitLabel="Save availability" successMessage="Availability updated." />;
}

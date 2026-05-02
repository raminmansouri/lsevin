import { AvailabilityAdminDashboard } from "@/features/booking-pro/admin/components/availability-admin-dashboard";
import { listGenericAvailabilityAdminData } from "@/features/booking-pro/server/generic-availability-admin.repository";

type Props = {
  params: Promise<{ locale: string }> | { locale: string };
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminAvailabilityPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const locale = resolvedParams.locale || "en-US";

  const search = {
    q: one(resolvedSearch?.q) || null,
    targetType: one(resolvedSearch?.targetType) || null,
    targetId: one(resolvedSearch?.targetId) || null,
    serviceProviderId: one(resolvedSearch?.serviceProviderId) || null,
    providerServiceId: one(resolvedSearch?.providerServiceId) || null,
    resourceId: one(resolvedSearch?.resourceId) || null,
  };

  const data = await listGenericAvailabilityAdminData({ locale, ...search });
  return <AvailabilityAdminDashboard {...data} locale={locale} search={search} />;
}

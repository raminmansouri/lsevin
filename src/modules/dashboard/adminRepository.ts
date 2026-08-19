import "server-only";
import { sql } from "@core/db/client";

export type AdminDashboardMetrics = {
  applicationsPending: number;
  providersTotal: number;
  providersActive: number;
  servicesTotal: number;
  servicesActive: number;
  staffTotal: number;
  staffActive: number;
  availabilityRules: number;
};

export async function getAdminDashboardMetrics(): Promise<AdminDashboardMetrics> {
  const rows = await sql<AdminDashboardMetrics[]>`
    select
      (select count(*)::int from provider_portal.onboarding_applications where status in ('submitted','in_review')) as "applicationsPending",
      (select count(*)::int from category.service_providers) as "providersTotal",
      (select count(*)::int from category.service_providers where is_active = true) as "providersActive",
      (select count(*)::int from category.provider_services) as "servicesTotal",
      (select count(*)::int from category.provider_services where is_active = true) as "servicesActive",
      (select count(*)::int from category.staff) as "staffTotal",
      (select count(*)::int from category.staff where is_active = true) as "staffActive",
      (select count(*)::int from provider_portal.generic_availability_rules where is_active = true) as "availabilityRules"
  `;
  return rows[0] ?? {
    applicationsPending: 0,
    providersTotal: 0,
    providersActive: 0,
    servicesTotal: 0,
    servicesActive: 0,
    staffTotal: 0,
    staffActive: 0,
    availabilityRules: 0,
  };
}

import "server-only";
import { sql } from "@core/db/client";
import type { ProviderManagementSnapshot } from "./types";

export async function getProviderManagementSnapshot(providerId: string) {
  const rows = await sql<ProviderManagementSnapshot[]>`
    select
      ${providerId}::text as "providerId",
      (select count(*)::int from category.provider_services where service_provider_id = ${providerId}::uuid) as services,
      (select count(*)::int from category.provider_services where service_provider_id = ${providerId}::uuid and is_active = true) as "activeServices",
      (select count(*)::int from category.provider_staffs where service_provider_id = ${providerId}::uuid) as staff,
      (select count(*)::int from category.provider_gallery_items where service_provider_id = ${providerId}::uuid) as gallery,
      (select count(*)::int from provider_portal.provider_operating_hours where service_provider_id = ${providerId}::uuid) as "operatingHours",
      (select count(*)::int from provider_portal.bookable_resources where service_provider_id = ${providerId}::uuid) as resources,
      (select count(*)::int from booking.bookings where provider_id = ${providerId}::uuid) as bookings,
      (select count(*)::int from booking.bookings where provider_id = ${providerId}::uuid and booking_status not in ('Completed','Cancelled')) as "openBookings",
      (select count(*)::int from category.service_provider_comments where service_provider_id = ${providerId}::uuid) as reviews,
      (select count(*)::int from provider_portal.payout_accounts where service_provider_id = ${providerId}::uuid) as "payoutAccounts",
      (select count(*)::int from provider_portal.provider_members where service_provider_id = ${providerId}::uuid) as members
  `;
  return rows[0];
}

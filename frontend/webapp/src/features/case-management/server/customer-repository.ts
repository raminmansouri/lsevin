import "server-only";

import { db } from "@/features/booking-admin-shared/server/db";

export type CustomerJourney = {
  id: string;
  bookingId: string;
  status: string;
  providerName: string;
  serviceName: string;
  currentStep: string | null;
  completedSteps: number;
  totalSteps: number;
  plannedStartAt: string | null;
};

export async function listCustomerJourneys(userId: string, locale: string): Promise<CustomerJourney[]> {
  await db`
    select case_management.ensure_case_for_booking(b.id)
    from booking.bookings b
    where b.user_id = ${userId}::uuid
      and lower(coalesce(b.booking_status, '')) not in ('cancelled', 'canceled', 'rejected', 'failed', 'no_show')
  `;

  return db<CustomerJourney[]>`
    select
      c.id::text,
      c.booking_id::text as "bookingId",
      c.status,
      coalesce(nullif(common.get_translation_t(p.name_translations, ${locale}, 'fa-IR'), ''), '-') as "providerName",
      coalesce(nullif(common.get_translation_t(ps.display_name_translations, ${locale}, 'fa-IR'), ''), '-') as "serviceName",
      coalesce(nullif(common.get_translation_t(current_step.title_translations, ${locale}, 'fa-IR'), ''), current_step.legacy_title, current_step.step_key) as "currentStep",
      count(case when steps.status in ('completed', 'skipped') then 1 end)::int as "completedSteps",
      count(steps.id)::int as "totalSteps",
      min(steps.planned_start_at) filter (where steps.status not in ('completed', 'skipped', 'cancelled'))::text as "plannedStartAt"
    from case_management.cases c
    join category.service_providers p on p.id = c.provider_id
    join category.provider_services ps on ps.id = c.provider_service_id
    left join case_management.case_steps current_step on current_step.id = c.current_step_id
    left join case_management.case_steps steps on steps.case_id = c.id and steps.customer_visible
    where c.customer_user_id = ${userId}::uuid
    group by c.id, p.id, ps.id, current_step.id
    order by case c.status when 'active' then 0 when 'scheduled' then 1 else 2 end, c.last_modified_date desc
  `;
}

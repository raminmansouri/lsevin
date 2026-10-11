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
      current_step.title as "currentStep",
      count(case when steps.status in ('completed', 'skipped') then 1 end)::int as "completedSteps",
      count(steps.id)::int as "totalSteps",
      min(steps.planned_start_at) filter (where steps.status not in ('completed', 'skipped', 'cancelled'))::text as "plannedStartAt"
    from case_management.cases c
    join category.service_providers p on p.id = c.provider_id
    join category.provider_services ps on ps.id = c.provider_service_id
    left join lateral (
      -- The step a case is "at" is derived from its schedule, not from
      -- cases.current_step_id: that pointer is set to the first step when the case
      -- is created and only moves on a manual admin update, so every case kept
      -- showing its first step ("3 days before treatment") forever.
      select
        coalesce(nullif(common.get_translation_t(cs.title_translations, ${locale}, 'fa-IR'), ''), cs.legacy_title, cs.step_key) as title,
        cs.planned_start_at
      from case_management.case_steps cs
      where cs.case_id = c.id
        and cs.status not in ('completed', 'skipped', 'cancelled')
      order by
        (cs.status = 'in_progress') desc,
        (cs.planned_start_at is not null and cs.planned_start_at <= now()) desc,
        case when cs.planned_start_at <= now() then cs.planned_start_at end desc nulls last,
        cs.display_order
      limit 1
    ) current_step on true
    left join case_management.case_steps steps on steps.case_id = c.id and steps.customer_visible
    where c.customer_user_id = ${userId}::uuid
    group by c.id, p.id, ps.id, current_step.title
    order by case c.status when 'active' then 0 when 'scheduled' then 1 else 2 end, c.last_modified_date desc
  `;
}

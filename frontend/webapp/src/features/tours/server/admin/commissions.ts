import "server-only";

import db from "@/config/database/db";

import { addDaysIso } from "../../domain/calendar";
import { audit } from "../platform/booking";
import { fail, mapDbError } from "../platform/errors";
import type { Actor } from "../platform/roles";

import { assertAdminActor, calendarDate, numberIn, optionalUuid } from "./guard";

type Tx = typeof db;

/**
 * Effective-dated commission agreements (M-017).
 *
 *   * An agreement may start today or later, never in the past.
 *   * The open-ended agreement it supersedes (same provider, or the platform
 *     default when provider is null) is closed the day before.
 *   * Overlapping ranges are refused.
 *   * Reservations snapshot their commission at booking time
 *     (tour.bookings.commission_percent, trigger in 0081) and that snapshot is
 *     immutable — so no agreement change can alter a past reservation.
 */
export async function createAgreement(actor: Actor, input: {
  serviceProviderId?: string | null; percent: number | string; effectiveFrom: string; effectiveTo?: string | null; calendar?: string;
}) {
  assertAdminActor(actor);
  const providerId = optionalUuid(input.serviceProviderId, "provider_not_found");
  const percent = numberIn(input.percent, 0, 100, "invalid_percent");
  const from = calendarDate(input.effectiveFrom, input.calendar);
  if (!from) throw fail.validation("effective_from_required");
  const to = calendarDate(input.effectiveTo, input.calendar);
  if (to && to < from) throw fail.validation("invalid_range");
  try {
    return await db.begin(async (tx) => {
      const [today] = await tx<{ d: string }[]>`select current_date::text as d`;
      if (from < today.d) throw fail.validation("effective_from_in_past");
      if (providerId) {
        const [p] = await tx<any[]>`select 1 from category.service_providers where id = ${providerId}::uuid`;
        if (!p) throw fail.notFound("provider_not_found");
      }
      // Serialize agreement changes per provider scope.
      await tx`select pg_advisory_xact_lock(hashtext(${`tour_commission:${providerId ?? "platform"}`}))`;
      const closed = await tx<any[]>`
        update tour.commission_agreements set effective_to = ${addDaysIso(from, -1)}::date
         where service_provider_id is not distinct from ${providerId}::uuid and effective_to is null and effective_from < ${from}::date
        returning id::text`;
      const [overlap] = await tx<any[]>`
        select id::text from tour.commission_agreements
         where service_provider_id is not distinct from ${providerId}::uuid
           and daterange(effective_from, coalesce(effective_to, 'infinity'::date), '[]') && daterange(${from}::date, coalesce(${to}::date, 'infinity'::date), '[]')
         limit 1`;
      if (overlap) throw fail.conflict("agreement_overlap", { agreementId: overlap.id });
      const [row] = await tx<any[]>`
        insert into tour.commission_agreements (service_provider_id, commission_percent, effective_from, effective_to, created_by)
        values (${providerId}::uuid, ${percent}, ${from}::date, ${to}::date, ${actor.userId}::uuid) returning id::text`;
      await audit(tx as unknown as Tx, actor, providerId, "commission_agreement", row.id, "created",
        { percent, from, to, closed: closed.map((c) => c.id) });
      return { id: row.id as string, from, to };
    });
  } catch (e) {
    throw mapDbError(e, "createAgreement");
  }
}

export async function listAgreements(actor: Actor) {
  assertAdminActor(actor);
  const rows = await db<any[]>`
    select a.id::text, a.service_provider_id::text, a.commission_percent, a.effective_from::text, a.effective_to::text, a.created_at,
           coalesce(sp.name_translations->>'en-US', sp.name_translations->>'fa-IR') as provider_name,
           (a.effective_from <= current_date and (a.effective_to is null or a.effective_to >= current_date)) as current,
           (select count(*)::int from tour.bookings b where b.commission_agreement_id = a.id) as bookings
      from tour.commission_agreements a left join category.service_providers sp on sp.id = a.service_provider_id
     order by a.service_provider_id nulls first, a.effective_from desc`;
  return rows.map((r) => ({ ...r, commission_percent: Number(r.commission_percent), created_at: new Date(r.created_at).toISOString() }));
}

export async function effectiveCommission(providerId: string, onIsoDate: string) {
  const [r] = await db<any[]>`select agreement_id::text, percent from tour.effective_commission(${providerId}::uuid, ${onIsoDate}::date)`;
  return { agreementId: r?.agreement_id ?? null, percent: Number(r?.percent ?? 0) };
}

import "server-only";

import db from "@/config/database/db";

import { audit } from "../platform/booking";
import { fail, logUnexpected, mapDbError } from "../platform/errors";
import type { Actor } from "../platform/roles";

import { assertAdminActor, requireReason, requireUuid } from "./guard";

type Tx = typeof db;

/**
 * Cancellation / refund-exception / chargeback / complaint cases (M-018).
 *
 * Approval hierarchy: agent → manager → finance. Each case gets a REQUIRED
 * level when it is opened:
 *   * chargeback                                  → finance
 *   * no amount (complaint, policy cancellation)  → agent
 *   * amount ≤ 25 % of the booking total          → agent
 *   * amount ≤ 75 % of the booking total          → manager
 *   * anything larger                             → finance
 * An admin's own level comes from tour.admin_roles (default agent); platform
 * super admins and finance admins act at finance level. Approving below the
 * required level escalates the case to the next level instead of deciding it.
 * Every step is recorded in tour.dispute_decisions and tour.audit_log.
 * Approval of a case with an amount hands the money side to the platform
 * refund workflow (commercial.refund_requests), never a direct wallet credit.
 */
export const LEVELS = ["agent", "manager", "finance"] as const;
export type Level = (typeof LEVELS)[number];
const rank = (l: string) => LEVELS.indexOf(l as Level);

export const DISPUTE_KINDS = ["cancellation", "refund_exception", "chargeback", "complaint"] as const;
export const REASON_CODES = [
  "operator_cancelled", "weather", "no_show_dispute", "service_not_as_described", "safety_incident", "duplicate_charge",
  "medical_emergency", "goodwill", "fraud_suspected", "other",
] as const;

export function requiredLevelFor(kind: string, amount: number | null, bookingTotal: number): Level {
  if (kind === "chargeback") return "finance";
  if (amount == null || amount <= 0) return "agent";
  if (bookingTotal <= 0) return "finance";
  const share = amount / bookingTotal;
  if (share <= 0.25) return "agent";
  if (share <= 0.75) return "manager";
  return "finance";
}

export async function adminLevelOf(actor: Actor): Promise<Level> {
  if (!actor.userId) return "agent";
  if (actor.roles.includes("superadmin") || actor.roles.includes("financeadmin")) return "finance";
  const [r] = await db<{ role: Level }[]>`select role from tour.admin_roles where user_id = ${actor.userId}::uuid`;
  return r?.role ?? "agent";
}

export async function setAdminRole(actor: Actor, input: { userId: string; role: string }) {
  assertAdminActor(actor);
  const userId = requireUuid(input.userId, "user_not_found");
  if (!(LEVELS as readonly string[]).includes(input.role)) throw fail.validation("invalid_role");
  if ((await adminLevelOf(actor)) !== "finance") throw fail.forbidden("finance_level_required");
  await db.begin(async (tx) => {
    await tx`insert into tour.admin_roles (user_id, role, granted_by) values (${userId}::uuid, ${input.role}, ${actor.userId}::uuid)
             on conflict (user_id) do update set role = excluded.role, granted_by = excluded.granted_by, updated_at = now()`;
    await audit(tx as unknown as Tx, actor, null, "admin_role", userId, "granted", { role: input.role });
  });
}

export async function openDispute(actor: Actor, input: { bookingId: string; kind: string; reasonCode: string; amount?: number | string | null; notes: string }) {
  assertAdminActor(actor);
  const bookingId = requireUuid(input.bookingId, "booking_not_found");
  if (!(DISPUTE_KINDS as readonly string[]).includes(input.kind)) throw fail.validation("invalid_kind");
  if (!(REASON_CODES as readonly string[]).includes(input.reasonCode)) throw fail.validation("invalid_reason_code");
  const notes = requireReason(input.notes);
  const amount = input.amount == null || input.amount === "" ? null : Number(input.amount);
  if (amount != null && (!Number.isFinite(amount) || amount < 0)) throw fail.validation("invalid_amount");
  try {
    return await db.begin(async (tx) => {
      const [b] = await tx<any[]>`
        select tb.service_provider_id::text, tb.total_amount, tb.currency_code, coalesce(bb.paid_amount, 0) as paid
          from tour.bookings tb join booking.bookings bb on bb.id = tb.booking_id where tb.booking_id = ${bookingId}::uuid`;
      if (!b) throw fail.notFound("booking_not_found");
      if (amount != null && amount > Number(b.total_amount)) throw fail.validation("amount_exceeds_total");
      const required = requiredLevelFor(input.kind, amount, Number(b.total_amount));
      const [d] = await tx<any[]>`
        insert into tour.disputes (booking_id, kind, reason_code, status, amount, approval_level, required_level, currency_code, notes, opened_by)
        values (${bookingId}::uuid, ${input.kind}, ${input.reasonCode}, 'open', ${amount}, 'agent', ${required}, ${b.currency_code}, ${notes}, ${actor.userId}::uuid)
        returning id::text`;
      await audit(tx as unknown as Tx, actor, b.service_provider_id, "dispute", d.id, "opened",
        { bookingId, kind: input.kind, reasonCode: input.reasonCode, amount, requiredLevel: required });
      return { id: d.id as string, requiredLevel: required };
    });
  } catch (e) {
    throw mapDbError(e, "openDispute");
  }
}

export type DisputeDecisionResult = { status: string; approvalLevel: Level; refundRequestId: string | null };

export async function decideDispute(actor: Actor, input: { disputeId: string; decision: "approve" | "reject"; note: string }): Promise<DisputeDecisionResult> {
  assertAdminActor(actor);
  const disputeId = requireUuid(input.disputeId, "dispute_not_found");
  if (input.decision !== "approve" && input.decision !== "reject") throw fail.validation("invalid_decision");
  const note = requireReason(input.note);
  const level = await adminLevelOf(actor);
  let result: DisputeDecisionResult & { refund?: { bookingId: string; userId: string; amount: number; currency: string; total: number } };
  try {
    result = await db.begin(async (tx) => {
      const [d] = await tx<any[]>`
        select d.id::text, d.status, d.approval_level, d.required_level, d.amount, d.kind, d.currency_code, d.booking_id::text,
               tb.service_provider_id::text, tb.user_id::text, tb.total_amount
          from tour.disputes d join tour.bookings tb on tb.booking_id = d.booking_id
         where d.id = ${disputeId}::uuid for update of d`;
      if (!d) throw fail.notFound("dispute_not_found");
      if (!["open", "pending_approval"].includes(d.status)) throw fail.conflict("dispute_closed", { status: d.status });
      if (rank(level) < rank(d.approval_level)) throw fail.forbidden("approval_level_required");
      const required: Level = (d.required_level ?? "agent") as Level;
      let status: string;
      let nextLevel: Level = d.approval_level;
      let decision: "approve" | "reject" | "escalate" = input.decision;
      if (input.decision === "reject") {
        status = "rejected";
      } else if (rank(level) >= rank(required)) {
        status = "approved";
      } else {
        decision = "escalate";
        status = "pending_approval";
        nextLevel = LEVELS[rank(level) + 1];
      }
      await tx`insert into tour.dispute_decisions (dispute_id, level, decision, note, decided_by)
               values (${disputeId}::uuid, ${level}, ${decision}, ${note}, ${actor.userId}::uuid)`;
      await tx`
        update tour.disputes
           set status = ${status}, approval_level = ${nextLevel}, updated_at = now(),
               decided_by = case when ${status} in ('approved','rejected') then ${actor.userId}::uuid else decided_by end,
               decided_at = case when ${status} in ('approved','rejected') then now() else decided_at end,
               decision_note = case when ${status} in ('approved','rejected') then ${note} else decision_note end
         where id = ${disputeId}::uuid`;
      await audit(tx as unknown as Tx, actor, d.service_provider_id, "dispute", disputeId, `dispute_${decision}`,
        { level, requiredLevel: required, status, note, bookingId: d.booking_id });
      const amount = d.amount == null ? 0 : Number(d.amount);
      return {
        status, approvalLevel: nextLevel, refundRequestId: null,
        refund: status === "approved" && amount > 0 && d.kind !== "complaint"
          ? { bookingId: d.booking_id, userId: d.user_id, amount, currency: d.currency_code, total: Number(d.total_amount) }
          : undefined,
      };
    });
  } catch (e) {
    throw mapDbError(e, "decideDispute");
  }
  if (result.refund) {
    // The money side goes through the platform refund workflow after commit; a
    // failure there is logged and visible (refund state stays empty), never hidden.
    const r = result.refund;
    const { requestBookingRefund } = await import("@/features/refunds/server/repository");
    const res = await requestBookingRefund({
      bookingId: r.bookingId, userId: r.userId, reason: "tour_dispute",
      customerNote: `Dispute ${disputeId}: ${r.amount} ${r.currency}`,
      refundScope: r.amount >= r.total ? "full" : "partial",
    }).catch((e) => { logUnexpected("decideDispute.requestBookingRefund", e); return null; });
    result.refundRequestId = res?.refundRequestId ?? null;
  }
  return { status: result.status, approvalLevel: result.approvalLevel, refundRequestId: result.refundRequestId };
}

export async function listDisputes(actor: Actor, opts: { status?: string } = {}) {
  assertAdminActor(actor);
  const status = opts.status && ["open", "pending_approval", "approved", "rejected", "closed", "active"].includes(opts.status) ? opts.status : "active";
  const rows = await db<any[]>`
    select d.id::text, d.booking_id::text, d.kind, d.reason_code, d.status, d.amount, d.currency_code, d.approval_level, d.required_level,
           d.notes, d.decision_note, d.created_at, d.decided_at, tb.voucher_code, t.slug,
           coalesce((select json_agg(json_build_object('level', x.level, 'decision', x.decision, 'note', x.note, 'decidedBy', x.decided_by, 'at', x.created_at) order by x.created_at)
                       from tour.dispute_decisions x where x.dispute_id = d.id), '[]') as decisions
      from tour.disputes d join tour.bookings tb on tb.booking_id = d.booking_id join tour.tours t on t.id = tb.tour_id
     where (${status} = 'active' and d.status in ('open','pending_approval')) or d.status = ${status}
     order by d.created_at desc limit 200`;
  return rows.map((r) => ({
    ...r, amount: r.amount == null ? null : Number(r.amount),
    created_at: new Date(r.created_at).toISOString(), decided_at: r.decided_at ? new Date(r.decided_at).toISOString() : null,
  }));
}

export async function listAdminRoles(actor: Actor) {
  assertAdminActor(actor);
  return db<{ user_id: string; role: string; name: string | null }[]>`
    select r.user_id::text, r.role, nullif(trim(coalesce(u.first_name, '') || ' ' || coalesce(u.last_name, '')), '') as name
      from tour.admin_roles r left join identity.asp_net_users u on u.id::text = r.user_id::text
     order by r.role desc, r.created_at`;
}

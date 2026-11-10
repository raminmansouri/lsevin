import "server-only";

import db from "@/config/database/db";

import { CANCEL_REFUND_HOURS, RECEIPT_REVIEW_HOLD_HOURS } from "../patient-booking-types";
import { occupying } from "./patient-booking-repository";

/**
 * What can still happen to a booked consultation (migration 0087): the patient cancelling it,
 * the patient choosing a refund or a new time when the doctor side cancelled or never joined,
 * paying by uploading a bank receipt, and an admin approving receipts and settling refunds.
 * Everything that moves a session runs under the same per-doctor lock as booking and payment.
 */

const lockKey = (doctorId: string) => `video-session:${doctorId}`;

export type SessionChangeRow = {
  status: string;
  doctorId: string;
  scheduledAt: Date;
  durationMinutes: number;
  priceCurrency: string;
  cancelledBy: string | null;
  cancelResolution: string | null;
  /** The doctor was in the call room during this booking's window. */
  doctorJoined: boolean;
  /** The clinic cancelled it in the provider portal. */
  portalCancelled: boolean;
  /** 'succeeded', 'needs_refund' or 'refunded' when money was taken; null when not. */
  paidStatus: string | null;
  /** The latest uploaded receipt still waiting or turned down. */
  receiptStatus: string | null;
  receiptNote: string | null;
};

/** The patient's own session with what deciding the next step needs, or null. */
export async function getSessionChangeState(
  userId: string,
  sessionId: string
): Promise<SessionChangeRow | null> {
  const rows = await db<SessionChangeRow[]>`
    select s.status, s.doctor_id::text as "doctorId", s.scheduled_at as "scheduledAt",
           s.duration_minutes as "durationMinutes", s.price_currency as "priceCurrency",
           s.cancelled_by as "cancelledBy", s.cancel_resolution as "cancelResolution",
           exists (
             select 1 from consultation.video_session_attendance a
             where a.session_id = s.id and a.role = 'doctor'
               and a.joined_at >= s.scheduled_at - make_interval(mins => s.duration_minutes)
           ) as "doctorJoined",
           exists (
             select 1 from consultation.video_session_payments p
             where p.session_id = s.id and p.raw ? 'doctorCancellation'
           ) as "portalCancelled",
           (
             select p.status from consultation.video_session_payments p
             where p.session_id = s.id and p.status in ('succeeded', 'needs_refund', 'refunded')
             order by p.created_at desc limit 1
           ) as "paidStatus",
           r.status as "receiptStatus", r.review_note as "receiptNote"
    from consultation.video_sessions s
    left join lateral (
      select p.status, p.review_note
      from consultation.video_session_payments p
      where p.session_id = s.id and p.gateway = 'receipt' and p.status in ('awaiting_review', 'rejected')
      order by p.created_at desc limit 1
    ) r on true
    where s.id = ${sessionId}::uuid and s.patient_user_id = ${userId}::uuid
  `;
  return rows[0] ?? null;
}

export type PatientCancelOutcome =
  | { ok: true; refunded: boolean }
  | { ok: false; error: "notFound" | "notCancellable" };

/**
 * The patient cancels their own consultation before it starts. A paid one is refunded when
 * cancelled at least CANCEL_REFUND_HOURS before the start; later, the fee is kept. An unpaid
 * request just lets its time go (a receipt waiting for review is flagged for a refund check).
 */
export async function cancelSessionByPatient(
  userId: string,
  sessionId: string
): Promise<PatientCancelOutcome> {
  return db.begin(async (tx) => {
    const [owned] = await tx<{ doctorId: string }[]>`
      select doctor_id::text as "doctorId" from consultation.video_sessions
      where id = ${sessionId}::uuid and patient_user_id = ${userId}::uuid
    `;
    if (!owned) return { ok: false, error: "notFound" } as const;
    await tx`select pg_advisory_xact_lock(hashtext(${lockKey(owned.doctorId)}))`;

    const [session] = await tx<{ status: string; refundable: boolean; started: boolean }[]>`
      select status,
             scheduled_at - now() >= make_interval(hours => ${CANCEL_REFUND_HOURS}) as refundable,
             scheduled_at <= now() as started
      from consultation.video_sessions
      where id = ${sessionId}::uuid
      for update
    `;
    const cancellable =
      session.status === "awaiting_payment" || (session.status === "scheduled" && !session.started);
    if (!cancellable) return { ok: false, error: "notCancellable" } as const;

    await tx`
      update consultation.video_sessions
         set status = 'cancelled', cancelled_by = 'patient', cancelled_at = now()
       where id = ${sessionId}::uuid
    `;
    const refund = session.status === "awaiting_payment" || session.refundable;
    let refunded = false;
    if (refund) {
      const rows = await tx`
        update consultation.video_session_payments
           set status = 'needs_refund',
               raw = raw || ${tx.json({ patientCancellation: { at: new Date().toISOString() } } as never)}
         where session_id = ${sessionId}::uuid and status in ('succeeded', 'awaiting_review')
        returning id
      `;
      refunded = rows.length > 0;
    }
    await tx`
      update consultation.video_session_payments
         set status = 'cancelled', failure_reason = 'The patient cancelled the consultation.'
       where session_id = ${sessionId}::uuid and status = 'pending'
    `;
    return { ok: true, refunded } as const;
  });
}

export type ResolveOutcome =
  | { ok: true }
  | { ok: false; error: "notFound" | "notResolvable" | "slotTaken" };

/**
 * The patient's choice after the doctor side cancelled or the doctor never joined: their money
 * back, or the same consultation at a new free time with the same doctor (the payment carries over).
 * `kind` is what getSessionChangeState showed; it is checked again here under the lock.
 */
export async function resolveDoctorIssue(args: {
  userId: string;
  sessionId: string;
  kind: "missed" | "cancelled";
  choice: "refund" | "reschedule";
  newStart?: string;
}): Promise<ResolveOutcome> {
  return db.begin(async (tx) => {
    const [owned] = await tx<{ doctorId: string }[]>`
      select doctor_id::text as "doctorId" from consultation.video_sessions
      where id = ${args.sessionId}::uuid and patient_user_id = ${args.userId}::uuid
    `;
    if (!owned) return { ok: false, error: "notFound" } as const;
    await tx`select pg_advisory_xact_lock(hashtext(${lockKey(owned.doctorId)}))`;

    const [state] = await tx<{ issue: string | null; durationMinutes: number }[]>`
      select
        case
          when s.status = 'scheduled'
               and now() > s.scheduled_at + make_interval(mins => 2 * s.duration_minutes)
               and not exists (
                 select 1 from consultation.video_session_attendance a
                 where a.session_id = s.id and a.role = 'doctor'
                   and a.joined_at >= s.scheduled_at - make_interval(mins => s.duration_minutes)
               )
               and exists (
                 select 1 from consultation.video_session_payments p
                 where p.session_id = s.id and p.status = 'succeeded'
               )
            then 'missed'
          when s.status = 'cancelled'
               and (
                 s.cancelled_by = 'doctor'
                 or (s.cancelled_by is null and exists (
                   select 1 from consultation.video_session_payments p
                   where p.session_id = s.id and p.raw ? 'doctorCancellation'
                 ))
               )
               and s.cancel_resolution is distinct from 'refund'
               and exists (
                 select 1 from consultation.video_session_payments p
                 where p.session_id = s.id and p.status = 'needs_refund'
               )
            then 'cancelled'
        end as issue,
        s.duration_minutes as "durationMinutes"
      from consultation.video_sessions s
      where s.id = ${args.sessionId}::uuid
      for update
    `;
    if (!state?.issue || state.issue !== args.kind) return { ok: false, error: "notResolvable" } as const;

    if (args.choice === "refund") {
      await tx`
        update consultation.video_sessions
           set status = 'cancelled',
               cancelled_by = coalesce(cancelled_by, 'doctor'),
               cancelled_at = coalesce(cancelled_at, now()),
               cancel_resolution = 'refund',
               cancel_resolution_at = now()
         where id = ${args.sessionId}::uuid
      `;
      await tx`
        update consultation.video_session_payments
           set status = 'needs_refund',
               raw = raw || ${tx.json({ doctorMissed: args.kind === "missed", refundChosenAt: new Date().toISOString() } as never)}
         where session_id = ${args.sessionId}::uuid and status = 'succeeded'
      `;
      return { ok: true } as const;
    }

    if (!args.newStart) return { ok: false, error: "slotTaken" } as const;
    const [free] = await tx<{ free: boolean }[]>`
      select not exists (
        select 1 from consultation.video_sessions vs
        where vs.doctor_id = ${owned.doctorId}::uuid
          and vs.id <> ${args.sessionId}::uuid
          and ${occupying()}
          and tstzrange(vs.scheduled_at, vs.scheduled_at + make_interval(mins => vs.duration_minutes))
           && tstzrange(${args.newStart}::timestamptz,
                        ${args.newStart}::timestamptz + make_interval(mins => ${state.durationMinutes}))
      ) as free
    `;
    if (!free?.free) return { ok: false, error: "slotTaken" } as const;

    await tx`
      update consultation.video_sessions
         set status = 'scheduled',
             scheduled_at = ${args.newStart}::timestamptz,
             started_at = null,
             cancelled_by = null,
             cancelled_at = null,
             cancel_resolution = 'reschedule',
             cancel_resolution_at = now()
       where id = ${args.sessionId}::uuid
    `;
    if (args.kind === "cancelled") {
      // The money stays with the consultation instead of going back.
      await tx`
        update consultation.video_session_payments
           set status = 'succeeded',
               raw = raw || ${tx.json({ rescheduledAt: new Date().toISOString() } as never)}
         where session_id = ${args.sessionId}::uuid and status = 'needs_refund'
      `;
    }
    return { ok: true } as const;
  });
}

export type ReceiptOutcome =
  | { ok: true }
  | { ok: false; error: "notFound" | "alreadyPaid" | "expired" | "receiptNotAllowed" };

/**
 * A patient outside Iran sends the receipt of their bank transfer. While an admin checks it, the
 * request keeps its time for RECEIPT_REVIEW_HOLD_HOURS, never past the start; an earlier receipt
 * still waiting is replaced.
 */
export async function submitReceipt(args: {
  userId: string;
  sessionId: string;
  /** Null for a manual method that asks for no file; the admin checks the transfer itself. */
  mediaId: string | null;
  /** The shop.payment_methods code the patient chose (bank_receipt, ...), kept for the admin. */
  methodCode?: string | null;
}): Promise<ReceiptOutcome> {
  return db.begin(async (tx) => {
    const [owned] = await tx<{ doctorId: string }[]>`
      select doctor_id::text as "doctorId" from consultation.video_sessions
      where id = ${args.sessionId}::uuid and patient_user_id = ${args.userId}::uuid
    `;
    if (!owned) return { ok: false, error: "notFound" } as const;
    await tx`select pg_advisory_xact_lock(hashtext(${lockKey(owned.doctorId)}))`;

    const [session] = await tx<
      { status: string; expired: boolean; priceAmount: number; priceCurrency: string }[]
    >`
      select status, (status = 'awaiting_payment' and hold_expires_at <= now()) as expired,
             price_amount::float8 as "priceAmount", price_currency as "priceCurrency"
      from consultation.video_sessions
      where id = ${args.sessionId}::uuid
      for update
    `;
    if (session.priceCurrency === "IRT" || session.priceCurrency === "IRR") {
      return { ok: false, error: "receiptNotAllowed" } as const;
    }
    if (session.status !== "awaiting_payment") return { ok: false, error: "alreadyPaid" } as const;
    if (session.expired) return { ok: false, error: "expired" } as const;

    await tx`
      update consultation.video_session_payments
         set status = 'cancelled', failure_reason = 'Replaced by a newer receipt.'
       where session_id = ${args.sessionId}::uuid and gateway = 'receipt' and status = 'awaiting_review'
    `;
    await tx`
      insert into consultation.video_session_payments (
        session_id, user_id, gateway, status, amount, currency, gateway_amount, gateway_currency,
        receipt_media_id, raw
      ) values (
        ${args.sessionId}::uuid, ${args.userId}::uuid, 'receipt', 'awaiting_review',
        ${session.priceAmount}, ${session.priceCurrency}, ${session.priceAmount}, ${session.priceCurrency},
        ${args.mediaId}, ${tx.json({ stage: "receipt_uploaded", methodCode: args.methodCode ?? "consultation_receipt" } as never)}
      )
    `;
    // Keep the time while the receipt is checked, but never past the start.
    await tx`
      update consultation.video_sessions
         set hold_expires_at = greatest(
               hold_expires_at,
               least(scheduled_at, now() + make_interval(hours => ${RECEIPT_REVIEW_HOLD_HOURS}))
             )
       where id = ${args.sessionId}::uuid
    `;
    return { ok: true } as const;
  });
}

// ---------------------------------------------------------------------------
// Admin: receipts to check and refunds to pay
// ---------------------------------------------------------------------------

/** Whether migration 0087 is applied (receipts and refunds need its columns). */
export async function receiptsReady(): Promise<boolean> {
  const rows = await db<{ ready: boolean }[]>`
    select exists (
      select 1 from information_schema.columns
      where table_schema = 'consultation' and table_name = 'video_session_payments'
        and column_name = 'receipt_media_id'
    ) as ready
  `;
  return Boolean(rows[0]?.ready);
}

export type AdminPaymentRow = {
  id: string;
  sessionId: string;
  status: "awaiting_review" | "needs_refund";
  gateway: string;
  amount: number;
  currency: string;
  referenceId: string | null;
  cardPan: string | null;
  receiptUrl: string | null;
  receiptName: string | null;
  createdAt: string;
  scheduledAt: string;
  sessionStatus: string;
  cancelledBy: string | null;
  /** Why a refund is owed: 'patient', 'doctor', 'missed' or 'slotLost' (paid after the time was given away). */
  refundReason: string | null;
  doctorCancelReason: string | null;
  patientName: string | null;
  patientPhone: string | null;
  patientEmail: string | null;
  doctorName: string;
  /** The payment-settings method a foreign patient chose (bank receipt, ...), by its name. */
  methodName: string | null;
};

export async function listAdminPayments(): Promise<AdminPaymentRow[]> {
  return db<AdminPaymentRow[]>`
    select p.id::text as id, p.session_id::text as "sessionId", p.status, p.gateway,
           p.amount::float8 as amount, p.currency, p.reference_id as "referenceId", p.card_pan as "cardPan",
           m.file_url as "receiptUrl", m.original_name as "receiptName",
           to_json(p.created_at)#>>'{}' as "createdAt",
           to_json(s.scheduled_at)#>>'{}' as "scheduledAt",
           s.status as "sessionStatus", s.cancelled_by as "cancelledBy",
           case
             when p.status <> 'needs_refund' then null
             when p.raw ? 'patientCancellation' then 'patient'
             when p.raw ? 'doctorCancellation' then 'doctor'
             when (p.raw ->> 'doctorMissed') = 'true' then 'missed'
             else 'slotLost'
           end as "refundReason",
           p.raw -> 'doctorCancellation' ->> 'reason' as "doctorCancelReason",
           coalesce(nullif(s.patient_name, ''), nullif(btrim(concat_ws(' ', u.first_name, u.last_name)), '')) as "patientName",
           case when u.phone_number is null then null
                else coalesce(u.phone_number_country_code, '') || ' ' || u.phone_number end as "patientPhone",
           u.email as "patientEmail",
           vd.name_fa as "doctorName",
           coalesce(pm.name_translations ->> 'fa-IR', pm.name_translations ->> 'en-US', p.raw ->> 'methodCode') as "methodName"
    from consultation.video_session_payments p
    join consultation.video_sessions s on s.id = p.session_id
    join consultation.video_doctors vd on vd.id = s.doctor_id
    left join identity.asp_net_users u on u.id = s.patient_user_id
    left join media.media_library m on m.id::text = nullif(p.receipt_media_id, '')
    left join shop.payment_methods pm on pm.code = p.raw ->> 'methodCode'
    where p.status in ('awaiting_review', 'needs_refund')
    order by (p.status = 'awaiting_review') desc, p.created_at asc
    limit 200
  `;
}

/** The receipt waiting for review, for approving it; null when it isn't waiting any more. */
export async function getReceiptForReview(paymentId: string) {
  const rows = await db<{ id: string; sessionId: string }[]>`
    select id::text as id, session_id::text as "sessionId"
    from consultation.video_session_payments
    where id = ${paymentId}::uuid and gateway = 'receipt' and status = 'awaiting_review'
  `;
  return rows[0] ?? null;
}

export async function markReceiptReviewed(paymentId: string, adminUserId: string | null) {
  await db`
    update consultation.video_session_payments
       set reviewed_by = ${adminUserId}::uuid, reviewed_at = now()
     where id = ${paymentId}::uuid
  `;
}

/**
 * Turns a receipt down with a note for the patient. The request keeps its time a while longer
 * (never past the start) so the patient can send a correct receipt.
 */
export async function rejectReceipt(paymentId: string, note: string, adminUserId: string | null) {
  return db.begin(async (tx) => {
    const rows = await tx<{ sessionId: string }[]>`
      update consultation.video_session_payments
         set status = 'rejected', review_note = ${note}, reviewed_by = ${adminUserId}::uuid, reviewed_at = now()
       where id = ${paymentId}::uuid and gateway = 'receipt' and status = 'awaiting_review'
      returning session_id::text as "sessionId"
    `;
    if (!rows.length) return false;
    await tx`
      update consultation.video_sessions
         set hold_expires_at = greatest(
               now(),
               least(scheduled_at, now() + make_interval(hours => ${RECEIPT_REVIEW_HOLD_HOURS}))
             )
       where id = ${rows[0].sessionId}::uuid and status = 'awaiting_payment'
    `;
    return true;
  });
}

/** The admin paid the money back outside the app (bank or gateway panel). */
export async function markRefunded(paymentId: string, adminUserId: string | null): Promise<boolean> {
  const rows = await db`
    update consultation.video_session_payments
       set status = 'refunded', refunded_at = now(), refunded_by = ${adminUserId}::uuid
     where id = ${paymentId}::uuid and status = 'needs_refund'
    returning id
  `;
  return rows.length > 0;
}

// ---------------------------------------------------------------------------
// Receipt instructions (consultation.settings)
// ---------------------------------------------------------------------------

const RECEIPT_INSTRUCTIONS_KEY = "video.receipt_instructions";

/** Where patients outside Iran send the money (account, IBAN, card…), as the admin wrote it. */
export async function getReceiptInstructions(): Promise<string | null> {
  const rows = await db<{ value: unknown }[]>`
    select value from consultation.settings where key = ${RECEIPT_INSTRUCTIONS_KEY}
  `;
  const value = rows[0]?.value;
  return typeof value === "string" && value.trim() ? value : null;
}

export async function saveReceiptInstructions(text: string | null, actorUserId: string | null) {
  const value = text?.trim() ? db.json(text.trim() as never) : db`'null'::jsonb`;
  await db`
    insert into consultation.settings (key, value, updated_by)
    values (${RECEIPT_INSTRUCTIONS_KEY}, ${value}, ${actorUserId}::uuid)
    on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by
  `;
}

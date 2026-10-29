import "server-only";

import db from "@/config/database/db";

import { occupying, UNPAID_HOLD_MINUTES } from "./patient-booking-repository";

export type PaymentStatus = "pending" | "succeeded" | "failed" | "cancelled" | "needs_refund";

export type SessionForPayment = {
  id: string;
  status: string;
  expired: boolean;
  doctorId: string;
  priceAmount: number;
  priceCurrency: string;
  patientPhone: string | null;
  patientEmail: string | null;
};

/** The patient's own session with what paying for it needs, or null. */
export async function getSessionForPayment(
  userId: string,
  sessionId: string
): Promise<SessionForPayment | null> {
  const rows = await db<SessionForPayment[]>`
    select s.id::text as id, s.status,
           (s.status = 'awaiting_payment' and s.hold_expires_at <= now()) as expired,
           s.doctor_id::text as "doctorId",
           s.price_amount::float8 as "priceAmount", s.price_currency as "priceCurrency",
           case when u.phone_number is null then null
                else coalesce(u.phone_number_country_code, '') || u.phone_number end as "patientPhone", u.email as "patientEmail"
    from consultation.video_sessions s
    left join identity.asp_net_users u on u.id = s.patient_user_id
    where s.id = ${sessionId}::uuid and s.patient_user_id = ${userId}::uuid
  `;
  return rows[0] ?? null;
}

/**
 * Keeps the slot held while the patient is on the gateway's page. Returns
 * false when the hold already ran out, so the time may belong to someone else.
 */
export async function extendPaymentHold(sessionId: string): Promise<boolean> {
  const rows = await db`
    update consultation.video_sessions
       set hold_expires_at = greatest(hold_expires_at, now() + make_interval(mins => ${UNPAID_HOLD_MINUTES}))
     where id = ${sessionId}::uuid
       and status = 'awaiting_payment'
       and hold_expires_at > now()
    returning id
  `;
  return rows.length > 0;
}

export async function createSessionPayment(args: {
  sessionId: string;
  userId: string;
  gateway: string;
  amount: number;
  currency: string;
  gatewayAmount: number;
  gatewayCurrency: string;
  raw: Record<string, unknown>;
}): Promise<string> {
  const rows = await db<{ id: string }[]>`
    insert into consultation.video_session_payments (
      session_id, user_id, gateway, amount, currency, gateway_amount, gateway_currency, raw
    ) values (
      ${args.sessionId}::uuid, ${args.userId}::uuid, ${args.gateway}, ${args.amount},
      ${args.currency}, ${args.gatewayAmount}, ${args.gatewayCurrency}, ${db.json(args.raw as never)}
    )
    returning id::text as id
  `;
  return rows[0].id;
}

export async function attachPaymentAuthority(paymentId: string, authority: string): Promise<void> {
  await db`
    update consultation.video_session_payments
       set authority = ${authority}
     where id = ${paymentId}::uuid
  `;
}

/** Closes an attempt that didn't go through. A settled one is left alone. */
export async function closeSessionPayment(
  paymentId: string,
  status: "failed" | "cancelled",
  reason: string,
  raw?: unknown
): Promise<void> {
  await db`
    update consultation.video_session_payments
       set status = ${status},
           failure_reason = ${reason},
           raw = raw || ${db.json({ closed: raw ?? null } as never)}
     where id = ${paymentId}::uuid and status = 'pending'
  `;
}

export type PaymentRow = {
  id: string;
  sessionId: string;
  status: PaymentStatus;
  gatewayAmount: number;
  gatewayCurrency: string;
};

export async function findPaymentByAuthority(
  gateway: string,
  authority: string
): Promise<PaymentRow | null> {
  const rows = await db<PaymentRow[]>`
    select id::text as id, session_id::text as "sessionId", status,
           gateway_amount::float8 as "gatewayAmount", gateway_currency as "gatewayCurrency"
    from consultation.video_session_payments
    where gateway = ${gateway} and authority = ${authority}
  `;
  return rows[0] ?? null;
}

export type SettleOutcome =
  /** This call confirmed the session. */
  | "confirmed"
  /** An earlier call already confirmed it with this payment. */
  | "alreadyConfirmed"
  /** Money was taken but the session can't be confirmed; refund it. */
  | "needsRefund";

/**
 * Records a verified payment and confirms the session, once. Runs under the
 * same per-doctor lock as booking, so a time given away after the hold ran
 * out is never booked twice: that payment is marked for a refund instead.
 */
export async function settleSessionPayment(args: {
  paymentId: string;
  referenceId: string | null;
  cardPan: string | null;
  raw: unknown;
}): Promise<SettleOutcome> {
  return db.begin(async (tx) => {
    const [payment] = await tx<{ status: PaymentStatus; sessionId: string; doctorId: string }[]>`
      select p.status, p.session_id::text as "sessionId", s.doctor_id::text as "doctorId"
      from consultation.video_session_payments p
      join consultation.video_sessions s on s.id = p.session_id
      where p.id = ${args.paymentId}::uuid
    `;
    if (!payment) throw new Error("Payment not found.");
    await tx`select pg_advisory_xact_lock(hashtext(${`video-session:${payment.doctorId}`}))`;

    const [current] = await tx<{ status: PaymentStatus }[]>`
      select status from consultation.video_session_payments
      where id = ${args.paymentId}::uuid
      for update
    `;
    if (current.status === "succeeded") return "alreadyConfirmed";
    if (current.status === "needs_refund") return "needsRefund";

    const [session] = await tx<{ status: string; free: boolean }[]>`
      select s.status,
             not exists (
               select 1 from consultation.video_sessions vs
               where vs.doctor_id = s.doctor_id
                 and vs.id <> s.id
                 and ${occupying()}
                 and tstzrange(vs.scheduled_at, vs.scheduled_at + make_interval(mins => vs.duration_minutes))
                  && tstzrange(s.scheduled_at, s.scheduled_at + make_interval(mins => s.duration_minutes))
             ) as free
      from consultation.video_sessions s
      where s.id = ${payment.sessionId}::uuid
      for update
    `;

    const confirmable = session.status === "awaiting_payment" && session.free;
    await tx`
      update consultation.video_session_payments
         set status = ${confirmable ? "succeeded" : "needs_refund"},
             reference_id = ${args.referenceId},
             card_pan = ${args.cardPan},
             verified_at = now(),
             raw = raw || ${tx.json({ verification: args.raw ?? null } as never)}
       where id = ${args.paymentId}::uuid
    `;
    if (!confirmable) return "needsRefund";

    await tx`
      update consultation.video_sessions
         set status = 'scheduled', paid_at = now()
       where id = ${payment.sessionId}::uuid
    `;
    return "confirmed";
  });
}

/** Who to tell once a session is confirmed. */
export async function getConfirmationRecipients(sessionId: string) {
  const rows = await db<
    {
      scheduledAt: Date;
      patientUserId: string | null;
      patientName: string | null;
      doctorUserId: string | null;
      doctorNameFa: string;
      doctorNameEn: string | null;
    }[]
  >`
    select s.scheduled_at as "scheduledAt", s.patient_user_id::text as "patientUserId",
           s.patient_name as "patientName", vd.user_id::text as "doctorUserId",
           vd.name_fa as "doctorNameFa", vd.name_en as "doctorNameEn"
    from consultation.video_sessions s
    join consultation.video_doctors vd on vd.id = s.doctor_id
    where s.id = ${sessionId}::uuid
  `;
  return rows[0] ?? null;
}

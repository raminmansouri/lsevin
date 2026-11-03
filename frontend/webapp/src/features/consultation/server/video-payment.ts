import "server-only";

import db from "@/config/database/db";
import { createNotificationFromTemplate } from "@/app/[locale]/n/app/mobile/notifications/notification-service";
import { seoOrigin } from "@/lib/seo/origin";
import { getPaymentProvider } from "@/payment/providers";
import {
  getEnabledPaymentGatewayConfig,
  getPaymentGatewayConfig,
} from "@/payment/server/payment-gateway.repository";

import { PANEL_TIME_ZONE } from "../doctor-panel-types";
import {
  attachPaymentAuthority,
  closeSessionPayment,
  createSessionPayment,
  extendPaymentHold,
  findPaymentByAuthority,
  getConfirmationRecipients,
  getSessionForPayment,
  settleSessionPayment,
} from "./video-payment-repository";

/**
 * Paying for a video consultation. Like the shop, this adds no payment engine
 * of its own: it maps a consultation.video_sessions row onto the platform's
 * gateway adapters (@/payment) and records each attempt in
 * consultation.video_session_payments. Iranian cards go through Zarinpal, the
 * only gateway wired here for now.
 */
const GATEWAY = "zarinpal" as const;

export type StartPaymentError = "notFound" | "alreadyPaid" | "expired" | "paymentUnavailable";

function callbackUrl(locale: string): string {
  return `${seoOrigin()}/${locale}/api/consultation/payments/${GATEWAY}/callback`;
}

/** Converts the session's price into the gateway's currency (Rial or Toman). */
async function toGatewayAmount(amount: number, currency: string, target: "IRR" | "IRT") {
  const source = currency.toUpperCase();
  if (source === target) return Math.round(amount);
  if (source === "IRT" && target === "IRR") return Math.round(amount * 10);
  if (source === "IRR" && target === "IRT") return Math.round(amount / 10);

  const [row] = await db<{ amount: string }[]>`
    select target_amount::text as amount
    from finance.convert_money(${amount}, ${source}, ${target}, 'standard')
    limit 1
  `;
  const converted = Math.round(Number(row?.amount));
  if (!Number.isFinite(converted) || converted <= 0) {
    throw new Error(`No exchange rate from ${source} to ${target}. Add it in Finance → Exchange Rates.`);
  }
  return converted;
}

/**
 * Sends the patient to the gateway for one of their own unpaid requests. The
 * slot's hold is extended first, so it can't be given away mid-payment.
 */
export async function startVideoSessionPayment(input: {
  sessionId: string;
  userId: string;
  locale: string;
}): Promise<{ redirectUrl: string } | { error: StartPaymentError }> {
  const session = await getSessionForPayment(input.userId, input.sessionId);
  if (!session) return { error: "notFound" };
  if (session.status !== "awaiting_payment") return { error: "alreadyPaid" };
  if (session.expired || !(await extendPaymentHold(session.id))) return { error: "expired" };

  let gatewayConfig;
  try {
    gatewayConfig = await getEnabledPaymentGatewayConfig({ code: GATEWAY });
  } catch (error) {
    console.error("[consultation] payment gateway unavailable", error);
    return { error: "paymentUnavailable" };
  }

  const gatewayCurrency =
    String(gatewayConfig.settings.currency || "IRR").toUpperCase() === "IRT" ? "IRT" : "IRR";
  const gatewayAmount = await toGatewayAmount(session.priceAmount, session.priceCurrency, gatewayCurrency);

  const paymentId = await createSessionPayment({
    sessionId: session.id,
    userId: input.userId,
    gateway: GATEWAY,
    amount: session.priceAmount,
    currency: session.priceCurrency,
    gatewayAmount,
    gatewayCurrency,
    raw: { stage: "created" },
  });

  try {
    const result = await getPaymentProvider(GATEWAY).initiate(
      {
        payment: {
          paymentId,
          bookingId: session.id, // opaque reference field on the shared PaymentAttempt type
          userId: input.userId,
          amount: gatewayAmount,
          currency: gatewayCurrency,
          sourceAmount: session.priceAmount,
          sourceCurrency: session.priceCurrency,
          description: `LSevin video consultation ${session.id.slice(0, 8)}`,
          customer: { mobile: session.patientPhone, email: session.patientEmail },
          metadata: { kind: "video_consultation", sessionId: session.id },
        },
        locale: input.locale,
        callbackUrl: callbackUrl(input.locale),
      },
      gatewayConfig
    );
    if (!result.authority) throw new Error("The gateway returned no authority.");
    await attachPaymentAuthority(paymentId, result.authority);
    return { redirectUrl: result.redirectUrl };
  } catch (error) {
    console.error("[consultation] payment initiation failed", error);
    await closeSessionPayment(
      paymentId,
      "failed",
      error instanceof Error ? error.message : "Payment initiation failed."
    );
    return { error: "paymentUnavailable" };
  }
}

/**
 * The test payment: confirms a request without the gateway, for testing and
 * debugging. On in development, or wherever CONSULTATION_TEST_PAYMENT=true is
 * set (a staging server). Never set that variable in production.
 */
export async function testPaymentEnabled(): Promise<boolean> {
  return (
    process.env.NODE_ENV === "development" || process.env.CONSULTATION_TEST_PAYMENT === "true"
  );
}

/** Confirms one of the patient's own unpaid requests as if it had been paid. */
export async function payVideoSessionForTest(input: {
  sessionId: string;
  userId: string;
  locale: string;
}): Promise<{ outcome: PaymentOutcome } | { error: StartPaymentError }> {
  if (!(await testPaymentEnabled())) return { error: "paymentUnavailable" };
  const session = await getSessionForPayment(input.userId, input.sessionId);
  if (!session) return { error: "notFound" };
  if (session.status !== "awaiting_payment") return { error: "alreadyPaid" };
  if (session.expired || !(await extendPaymentHold(session.id))) return { error: "expired" };

  const paymentId = await createSessionPayment({
    sessionId: session.id,
    userId: input.userId,
    gateway: "test",
    amount: session.priceAmount,
    currency: session.priceCurrency,
    gatewayAmount: session.priceAmount,
    gatewayCurrency: session.priceCurrency,
    raw: { stage: "created", test: true },
  });
  const settled = await settleSessionPayment({
    paymentId,
    referenceId: `TEST-${paymentId.slice(0, 8)}`,
    cardPan: null,
    raw: { test: true },
  });
  if (settled === "needsRefund") return { outcome: "refund" };
  if (settled === "confirmed") await notifyConfirmed(session.id, input.locale);
  return { outcome: "paid" };
}

export type PaymentOutcome = "paid" | "cancelled" | "failed" | "refund";

/**
 * The gateway's return. Success is checked server to server with the gateway,
 * so a browser can't fake it, and settling is idempotent, so a refresh or a
 * retried callback is harmless.
 */
export async function verifyVideoSessionPayment(input: {
  gateway: string;
  authority: string;
  status: string;
  locale: string;
}): Promise<{ sessionId: string | null; outcome: PaymentOutcome }> {
  if (input.gateway !== GATEWAY || !input.authority) return { sessionId: null, outcome: "failed" };
  const payment = await findPaymentByAuthority(GATEWAY, input.authority);
  if (!payment) return { sessionId: null, outcome: "failed" };
  const sessionId = payment.sessionId;

  if (payment.status === "succeeded") return { sessionId, outcome: "paid" };
  if (payment.status === "needs_refund") return { sessionId, outcome: "refund" };

  if (input.status.toUpperCase() !== "OK") {
    await closeSessionPayment(payment.id, "cancelled", "The patient cancelled at the gateway.", {
      status: input.status,
    });
    return { sessionId, outcome: "cancelled" };
  }

  const gatewayConfig = await getPaymentGatewayConfig({ code: GATEWAY, includeSecrets: true });
  if (!gatewayConfig) return { sessionId, outcome: "failed" };

  const verification = await getPaymentProvider(GATEWAY).verify(
    {
      authority: input.authority,
      status: input.status,
      amount: payment.gatewayAmount,
      currency: payment.gatewayCurrency,
    },
    gatewayConfig
  );
  if (!verification.success) {
    await closeSessionPayment(
      payment.id,
      "failed",
      verification.message || "Verification failed.",
      verification.raw
    );
    return { sessionId, outcome: "failed" };
  }

  const settled = await settleSessionPayment({
    paymentId: payment.id,
    referenceId: verification.referenceId != null ? String(verification.referenceId) : null,
    cardPan: verification.cardPan ?? null,
    raw: verification.raw ?? { code: verification.code },
  });
  if (settled === "needsRefund") {
    console.error(`[consultation] payment ${payment.id} was taken but its slot was lost; refund it`);
    return { sessionId, outcome: "refund" };
  }
  if (settled === "confirmed") await notifyConfirmed(sessionId, input.locale);
  return { sessionId, outcome: "paid" };
}

let templatesEnsured = false;

/** Same upsert-once-per-process idea as the consultation admin template. */
async function ensureConfirmationTemplates(): Promise<boolean> {
  if (templatesEnsured) return true;
  const [row] = await db<{ exists: boolean }[]>`
    select to_regclass('notify.notification_templates') is not null as exists
  `;
  if (!row?.exists) return false;

  const templates = [
    {
      key: "consultation.video.confirmed.patient",
      name: "Video consultation confirmed (patient)",
      title: { "fa-IR": "مشاوره ویدیویی شما قطعی شد", "en-US": "Your video consultation is confirmed" },
      body: {
        "fa-IR": "پرداخت انجام شد. مشاوره با {{doctorName}} در {{when}} (به وقت تهران).",
        "en-US": "Payment received. Your consultation with {{doctorName}} is on {{when}} (Tehran time).",
      },
    },
    {
      key: "consultation.video.confirmed.doctor",
      name: "Video consultation booked (doctor)",
      title: { "fa-IR": "مشاوره ویدیویی جدید", "en-US": "New video consultation" },
      body: {
        "fa-IR": "{{patientName}} برای {{when}} مشاوره رزرو و پرداخت کرد.",
        "en-US": "{{patientName}} booked and paid for a consultation on {{when}}.",
      },
    },
  ];
  for (const template of templates) {
    await db`
      insert into notify.notification_templates (
        template_key, name, notification_type, default_channels,
        title_translations, body_translations
      ) values (
        ${template.key}, ${template.name}, 'consultation', array['in_app'],
        ${db.json(template.title as never)}, ${db.json(template.body as never)}
      )
      on conflict (template_key) do update set
        title_translations = excluded.title_translations,
        body_translations = excluded.body_translations
    `;
  }
  templatesEnsured = true;
  return true;
}

function formatWhen(date: Date, persian: boolean): string {
  return new Intl.DateTimeFormat(persian ? "fa-IR-u-ca-persian" : "en-GB", {
    timeZone: PANEL_TIME_ZONE,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

/** Best effort: an in-app note to the patient and to the GP. */
async function notifyConfirmed(sessionId: string, locale: string): Promise<void> {
  try {
    const info = await getConfirmationRecipients(sessionId);
    if (!info || !(await ensureConfirmationTemplates())) return;
    const patientPersian = locale.toLowerCase().startsWith("fa");
    const sends = [];
    if (info.patientUserId) {
      sends.push(
        createNotificationFromTemplate({
          templateKey: "consultation.video.confirmed.patient",
          locale: patientPersian ? "fa-IR" : "en-US",
          recipientUserId: info.patientUserId,
          entityType: "video_consultation",
          entityId: sessionId,
          channels: ["in_app"],
          variables: {
            doctorName: (patientPersian ? info.doctorNameFa : info.doctorNameEn || info.doctorNameFa) ?? "",
            when: formatWhen(new Date(info.scheduledAt), patientPersian),
          },
          data: { url: `/n/app/mobile/consultation/sessions/${sessionId}` },
        })
      );
    }
    if (info.doctorUserId) {
      sends.push(
        createNotificationFromTemplate({
          templateKey: "consultation.video.confirmed.doctor",
          locale: "fa-IR",
          recipientUserId: info.doctorUserId,
          entityType: "video_consultation",
          entityId: sessionId,
          channels: ["in_app"],
          variables: {
            patientName: info.patientName ?? "",
            when: formatWhen(new Date(info.scheduledAt), true),
          },
          data: { url: `/n/app/mobile/consultation/doctor/sessions/${sessionId}` },
        })
      );
    }
    const results = await Promise.allSettled(sends);
    for (const result of results) {
      if (result.status === "rejected") console.error("[consultation] confirmation notice failed", result.reason);
    }
  } catch (error) {
    console.error("[consultation] confirmation notices threw", error);
  }
}

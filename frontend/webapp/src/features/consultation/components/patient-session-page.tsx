"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  Clock,
  CreditCard,
  FileText,
  FlaskConical,
  Loader2,
  Paperclip,
  Receipt,
  RotateCcw,
  User,
  Video,
  XCircle,
} from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { ImageWithFallback } from "@/components/ui/image-with-fallback";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";
import { PaymentMethodsPanel } from "@/features/booking-pro/components/PaymentMethodsPanel";
import { Link } from "@/i18n/navigation";

import { canJoinSession, sessionCallWindow } from "../doctor-panel-types";
import { CANCEL_REFUND_HOURS, type PatientVideoSession } from "../patient-booking-types";
import {
  cancelMyVideoSessionAction,
  getMyVideoSessionAction,
  getRescheduleSlotsAction,
  payMyVideoSessionAction,
  resolveMyDoctorIssueAction,
  startForeignVideoPaymentAction,
  testPayMyVideoSessionAction,
} from "../server/patient-booking";
import { formatSessionDate, formatSessionTime } from "./doctor-panel/panel-format";
import { SessionStatusBadge } from "./doctor-panel/session-status-badge";
import { useNow } from "./doctor-panel/use-now";

const PAYMENT_OUTCOMES = ["paid", "pending", "cancelled", "failed", "refund"] as const;
type PaymentOutcome = (typeof PAYMENT_OUTCOMES)[number];

/**
 * The patient's view of one video consultation: who, when, the price with the
 * pay button, the call room's hours with the join button, what they sent, and
 * the GP's summary. The gateway sends the patient back here with ?payment=.
 */
export function PatientSessionPage({
  sessionId,
  payment,
}: {
  sessionId: string;
  /** ?payment= from the gateway's return. */
  payment?: string;
}) {
  const t = useTranslations("Consultation.booking");
  const locale = useLocale();
  const [session, setSession] = useState<PatientVideoSession | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = useNow(15_000);
  const paymentOutcome = PAYMENT_OUTCOMES.find((value) => value === payment) as
    | PaymentOutcome
    | undefined;
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const pay = async () => {
    setPaying(true);
    setPayError(null);
    try {
      const result = await payMyVideoSessionAction(sessionId);
      if (result.ok && result.data) {
        window.location.assign(result.data.redirectUrl);
        return;
      }
      setPayError(t(`errors.${result.error ?? "paymentUnavailable"}`));
    } catch {
      setPayError(t("errors.paymentUnavailable"));
    }
    setPaying(false);
  };

  // Test payment: confirms without the gateway, then reloads like a gateway return.
  const payForTest = async () => {
    setPaying(true);
    setPayError(null);
    try {
      const result = await testPayMyVideoSessionAction(sessionId);
      if (result.ok && result.data) {
        window.location.assign(`${window.location.pathname}?payment=${result.data.outcome}`);
        return;
      }
      setPayError(t(`errors.${result.error ?? "paymentUnavailable"}`));
    } catch {
      setPayError(t("errors.paymentUnavailable"));
    }
    setPaying(false);
  };

  const load = useCallback(() => {
    getMyVideoSessionAction(sessionId)
      .then((result) => {
        if (result.ok && result.data) setSession(result.data);
        else setError(t(`errors.${result.error ?? "loadFailed"}`));
      })
      .catch(() => setError(t("errors.loadFailed")));
  }, [sessionId, t]);

  useEffect(() => {
    load();
  }, [load]);

  const [cancelling, setCancelling] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const cancel = async () => {
    if (!session) return;
    const warning = session.status === "awaiting_payment"
      ? t("cancel.confirmUnpaid")
      : session.cancel.refundable
        ? t("cancel.confirmRefund", { hours: CANCEL_REFUND_HOURS })
        : t("cancel.confirmNoRefund", { hours: CANCEL_REFUND_HOURS });
    if (!window.confirm(warning)) return;
    setCancelling(true);
    setNotice(null);
    try {
      const result = await cancelMyVideoSessionAction(sessionId);
      if (result.ok && result.data) {
        setNotice(result.data.refunded ? t("cancel.doneRefund") : t("cancel.done"));
        load();
      } else {
        setNotice(t(`errors.${result.error ?? "loadFailed"}`));
      }
    } catch {
      setNotice(t("errors.loadFailed"));
    }
    setCancelling(false);
  };

  const imageUrl = resolveHomeMediaUrl(session?.doctor.imageUrl ?? null);
  const callWindow = session ? sessionCallWindow(session) : null;
  const joinable = session ? canJoinSession(session, now) : false;
  const unpaid = session?.status === "awaiting_payment";

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="sticky top-0 z-40 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 px-5 pt-3 pb-4">
          <Link
            href="/n/app/mobile/bookings"
            aria-label={t("back")}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ChevronLeft size={24} className="text-gray-700 rtl:rotate-180" />
          </Link>
          <h1 className="min-w-0 flex-1 truncate text-xl font-bold text-gray-900">
            {t("sessionTitle")}
          </h1>
        </div>
      </div>

      {error && <p className="px-5 py-16 text-center text-sm text-gray-600">{error}</p>}
      {!error && !session && (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-[#083f30]" aria-hidden />
        </div>
      )}

      {session && callWindow && (
        <div className="space-y-4 px-5 pt-4">
          {paymentOutcome && (
            <div
              className={`flex items-start gap-3 rounded-2xl p-4 ${
                paymentOutcome === "paid" ? "bg-emerald-50 text-emerald-900" : "bg-amber-50 text-amber-900"
              }`}
            >
              {paymentOutcome === "paid" ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              ) : (
                <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              )}
              <p className="text-sm">{t(`paymentResult.${paymentOutcome}`)}</p>
            </div>
          )}
          {unpaid && session.expired && (
            <div className="flex items-start gap-3 rounded-2xl bg-red-50 p-4 text-red-900">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p className="text-sm">{t("expired")}</p>
            </div>
          )}
          {notice && (
            <div className="flex items-start gap-3 rounded-2xl bg-gray-100 p-4 text-gray-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <p className="text-sm">{notice}</p>
            </div>
          )}
          {session.doctorIssue ? (
            <DoctorIssueCard session={session} onDone={(message) => {
              setNotice(message);
              load();
            }} />
          ) : (
            session.status === "cancelled" && (
              <div className="flex items-start gap-3 rounded-2xl bg-gray-100 p-4 text-gray-800">
                <XCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
                <div className="text-sm">
                  <p className="font-bold">
                    {t(session.cancelledBy === "patient" ? "cancel.byPatient" : session.cancelledBy === "doctor" ? "cancel.byDoctor" : "cancel.cancelled")}
                  </p>
                  {session.refund && <p className="mt-1">{t(`refund.${session.refund}`)}</p>}
                </div>
              </div>
            )
          )}
          {unpaid && !session.expired && !paymentOutcome && !session.receipt && (
            <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
              <div>
                <p className="font-bold">{t("requestSent")}</p>
                <p className="mt-1 text-sm">{t("payNext")}</p>
              </div>
            </div>
          )}

          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-[#083f30]/5">
                {imageUrl ? (
                  <ImageWithFallback
                    width={112}
                    height={112}
                    src={imageUrl}
                    alt={session.doctor.name}
                    className="h-full w-full object-cover"
                    fallbackIcon={<User className="h-6 w-6 text-[#083f30]/40" />}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-6 w-6 text-[#083f30]/40" aria-hidden />
                  </div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-gray-900">{session.doctor.name}</p>
                <p className="text-xs text-gray-500">{t("generalPractitioner")}</p>
              </div>
              <SessionStatusBadge status={session.status} />
            </div>

            <dl className="mt-4 space-y-2 text-sm">
              <Row label={t("when")}>
                {formatSessionDate(locale, session.scheduledAt)} ·{" "}
                <span dir="ltr">{formatSessionTime(locale, session.scheduledAt)}</span>
              </Row>
              <Row label={t("length")}>{t("minutes", { minutes: session.durationMinutes })}</Row>
              <Row label={t("price")}>{session.priceLabel}</Row>
            </dl>

            <p className="mt-4 flex items-start gap-2 rounded-xl bg-gray-50 p-3 text-xs text-gray-600">
              <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              {t(now > callWindow.closesAt ? "callWindowClosed" : "callWindow", {
                from: formatSessionTime(locale, new Date(callWindow.opensAt).toISOString()),
                to: formatSessionTime(locale, new Date(callWindow.closesAt).toISOString()),
              })}
            </p>

            {!unpaid && session.status !== "cancelled" && session.status !== "no_show" && (
              joinable ? (
                <Link
                  href={`/n/app/mobile/consultation/sessions/${session.id}/call`}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#083f30] py-3 text-sm font-bold text-white"
                >
                  <Video className="h-4 w-4" aria-hidden />
                  {t("joinCall")}
                </Link>
              ) : (
                now < callWindow.opensAt && (
                  <p className="mt-3 rounded-2xl bg-gray-100 py-3 text-center text-sm text-gray-500">
                    {t("joinLater")}
                  </p>
                )
              )
            )}
            {unpaid && !session.expired && (
              <>
                {session.payMethod === "receipt" ? (
                  <ReceiptPayment session={session} onSent={load} />
                ) : (
                <button
                  type="button"
                  onClick={pay}
                  disabled={paying}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#083f30] py-3 text-sm font-bold text-white disabled:opacity-60"
                >
                  {paying ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <CreditCard className="h-4 w-4" aria-hidden />
                  )}
                  {paying ? t("paying") : t("payNow", { price: session.priceLabel })}
                </button>
                )}
                {session.testPayment && (
                  <button
                    type="button"
                    onClick={payForTest}
                    disabled={paying}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-amber-400 bg-amber-50 py-3 text-sm font-bold text-amber-800 disabled:opacity-60"
                  >
                    <FlaskConical className="h-4 w-4" aria-hidden />
                    {t("testPay")}
                  </button>
                )}
                {payError && <p className="mt-2 text-center text-sm text-red-600">{payError}</p>}
                <p className="mt-2 text-center text-xs text-gray-500">{t("joinAfterPayment")}</p>
              </>
            )}

            {session.cancel.allowed && (
              <div className="mt-4 border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={cancel}
                  disabled={cancelling}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 py-2.5 text-sm font-bold text-red-700 disabled:opacity-60"
                >
                  {cancelling ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <XCircle className="h-4 w-4" aria-hidden />}
                  {t("cancel.button")}
                </button>
                {session.status === "scheduled" && (
                  <p className="mt-2 text-center text-xs text-gray-500">
                    {t(session.cancel.refundable ? "cancel.ruleRefundable" : "cancel.ruleLate", { hours: CANCEL_REFUND_HOURS })}
                  </p>
                )}
              </div>
            )}
          </div>

          {session.summary && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#083f30]" aria-hidden />
                <p className="font-bold text-gray-900">{t("doctorSummary")}</p>
              </div>
              {(
                [
                  ["summaryAdvice", session.summary.advice],
                  ["summaryNextSteps", session.summary.nextSteps],
                  ["summarySuggestion", session.summary.suggestion],
                ] as const
              )
                .filter(([, text]) => text)
                .map(([key, text]) => (
                  <div key={key} className="mt-3">
                    <p className="text-sm font-medium text-gray-800">{t(key)}</p>
                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">{text}</p>
                  </div>
                ))}
            </div>
          )}

          {session.patientNote && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-900">{t("yourNote")}</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-gray-700">
                {session.patientNote}
              </p>
              {session.attachments.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {session.attachments.map((file) => (
                    <a
                      key={file.id}
                      href={file.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex max-w-full items-center gap-1.5 rounded-xl bg-gray-50 px-3 py-2 text-xs text-gray-700"
                    >
                      <Paperclip className="h-3.5 w-3.5 shrink-0" aria-hidden />
                      <span className="truncate">{file.name}</span>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium text-gray-900">{children}</dd>
    </div>
  );
}

/** Paying from outside Iran: transfer the money as the admin describes, then send the receipt. */
/** Methods a video call cannot use: paying in place, and the wallet until consultations reach the ledger. */
const VIDEO_EXCLUDED_METHODS = ["pay_on_delivery", "cash_on_delivery", "wallet"] as const;
const ONLINE_METHODS = ["card", "gateway_card", "online_card", "crypto", "btcpay", "zarinpal"];

/**
 * A patient outside Iran pays with the same methods a service booking offers them (the payment
 * settings for international patients): online card through BTCPay, or a bank receipt / other
 * manual method that waits for an admin in the consultation payments queue.
 */
function ReceiptPayment({ session, onSent }: { session: PatientVideoSession; onSent: () => void }) {
  const t = useTranslations("Consultation.booking");
  const [method, setMethod] = useState("gateway_card");
  const [file, setFile] = useState<File | null>(null);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (session.receipt?.status === "awaiting_review") {
    return (
      <p className="mt-3 flex items-start gap-2 rounded-2xl bg-sky-50 p-3 text-sm text-sky-900">
        <Receipt className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        {t("receipt.underReview")}
      </p>
    );
  }

  const online = ONLINE_METHODS.includes(method);

  const send = async () => {
    setSending(true);
    setError(null);
    try {
      if (online) {
        const result = await startForeignVideoPaymentAction({ sessionId: session.id, methodCode: method });
        if (result.ok && result.data) {
          window.location.assign(result.data.redirectUrl);
          return;
        }
        setError(t(`errors.${result.error ?? "paymentUnavailable"}`));
      } else {
        if (method === "bank_receipt" && !file) {
          setError(t("errors.receiptMissing"));
          setSending(false);
          return;
        }
        const body = new FormData();
        body.append("methodCode", method);
        if (file) body.append("receipt", file);
        const response = await fetch(`/api/consultation/sessions/${session.id}/payment`, { method: "POST", body });
        const answer = (await response.json().catch(() => ({}))) as { error?: string };
        if (response.ok) {
          onSent();
          return;
        }
        setError(t(`errors.${answer.error ?? "loadFailed"}`));
      }
    } catch {
      setError(t("errors.loadFailed"));
    }
    setSending(false);
  };

  return (
    <div className="mt-3 space-y-3">
      {session.receipt?.status === "rejected" && (
        <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-900">
          {t("receipt.rejected")}
          {session.receipt.note ? ` ${session.receipt.note}` : ""}
        </p>
      )}
      <div className="rounded-2xl bg-gray-50 p-3">
        <p className="mb-2 text-sm font-bold text-gray-900">{t("receipt.methodsTitle", { price: session.priceLabel })}</p>
        <PaymentMethodsPanel
          selected={method}
          onChange={setMethod}
          billingCurrency={session.priceCurrency}
          receiptFile={file}
          onReceiptFileChange={setFile}
          onReadyChange={setReady}
          excludeCodes={VIDEO_EXCLUDED_METHODS}
        />
      </div>
      <button
        type="button"
        onClick={send}
        disabled={sending || !ready}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#083f30] py-3 text-sm font-bold text-white disabled:opacity-60"
      >
        {sending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : online ? (
          <CreditCard className="h-4 w-4" aria-hidden />
        ) : (
          <Receipt className="h-4 w-4" aria-hidden />
        )}
        {online ? t("payNow", { price: session.priceLabel }) : method === "bank_receipt" ? t("receipt.send") : t("receipt.submitManual")}
      </button>
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
    </div>
  );
}

/**
 * The doctor side cancelled, or the doctor never joined: the patient picks their money back or
 * the same consultation at a new free time with the same doctor.
 */
function DoctorIssueCard({
  session,
  onDone,
}: {
  session: PatientVideoSession;
  onDone: (message: string) => void;
}) {
  const t = useTranslations("Consultation.booking");
  const locale = useLocale();
  const issue = session.doctorIssue!;
  const [slots, setSlots] = useState<string[] | null>(null);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dayOf = (iso: string) => formatSessionDate(locale, iso);
  const days = slots ? [...new Set(slots.map(dayOf))] : [];
  const daySlots = slots && day ? slots.filter((iso) => dayOf(iso) === day) : [];

  const openPicker = async () => {
    setBusy(true);
    setError(null);
    try {
      const result = await getRescheduleSlotsAction(session.id);
      if (result.ok && result.data) {
        setSlots(result.data.slots);
        setDay(result.data.slots[0] ? dayOf(result.data.slots[0]) : null);
      } else {
        setError(t(`errors.${result.error ?? "loadFailed"}`));
      }
    } catch {
      setError(t("errors.loadFailed"));
    }
    setBusy(false);
  };

  const choose = async (choice: "refund" | "reschedule") => {
    if (choice === "refund" && !window.confirm(t("doctorIssue.confirmRefund"))) return;
    if (choice === "reschedule" && !slot) return;
    setBusy(true);
    setError(null);
    try {
      const result = await resolveMyDoctorIssueAction(
        choice === "refund"
          ? { sessionId: session.id, choice }
          : { sessionId: session.id, choice, scheduledAt: slot! }
      );
      if (result.ok) {
        onDone(t(choice === "refund" ? "doctorIssue.refundChosen" : "doctorIssue.rescheduled"));
        return;
      }
      setError(t(`errors.${result.error ?? "loadFailed"}`));
      if (result.error === "slotTaken") void openPicker();
    } catch {
      setError(t("errors.loadFailed"));
    }
    setBusy(false);
  };

  return (
    <div className="space-y-3 rounded-2xl bg-amber-50 p-4 text-amber-950">
      <div className="flex items-start gap-3">
        <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden />
        <div className="text-sm">
          <p className="font-bold">{t(issue.kind === "missed" ? "doctorIssue.missed" : "doctorIssue.cancelled")}</p>
          <p className="mt-1">{t("doctorIssue.choose")}</p>
        </div>
      </div>

      {slots === null ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => choose("refund")}
            disabled={busy}
            className="flex items-center justify-center gap-2 rounded-2xl border border-amber-300 bg-white py-3 text-sm font-bold disabled:opacity-60"
          >
            <RotateCcw className="h-4 w-4" aria-hidden />
            {t("doctorIssue.refund")}
          </button>
          {issue.canReschedule && (
            <button
              type="button"
              onClick={openPicker}
              disabled={busy}
              className="flex items-center justify-center gap-2 rounded-2xl bg-[#083f30] py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <CalendarClock className="h-4 w-4" aria-hidden />}
              {t("doctorIssue.reschedule")}
            </button>
          )}
        </div>
      ) : slots.length === 0 ? (
        <p className="text-sm">{t("doctorIssue.noSlots")}</p>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2 overflow-x-auto pb-1">
            {days.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  setDay(label);
                  setSlot(null);
                }}
                className={`shrink-0 rounded-xl px-3 py-2 text-xs font-bold ${
                  label === day ? "bg-[#083f30] text-white" : "bg-white text-gray-700"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {daySlots.map((iso) => (
              <button
                key={iso}
                type="button"
                dir="ltr"
                onClick={() => setSlot(iso)}
                className={`rounded-xl px-3 py-2 text-xs font-bold ${
                  iso === slot ? "bg-[#083f30] text-white" : "bg-white text-gray-700"
                }`}
              >
                {formatSessionTime(locale, iso)}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => choose("reschedule")}
              disabled={busy || !slot}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#083f30] py-3 text-sm font-bold text-white disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {t("doctorIssue.confirmTime")}
            </button>
            <button
              type="button"
              onClick={() => setSlots(null)}
              disabled={busy}
              className="rounded-2xl border border-amber-300 bg-white px-4 text-sm font-bold"
            >
              {t("doctorIssue.back")}
            </button>
          </div>
        </div>
      )}
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}

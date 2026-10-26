"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "@/i18n/navigation";

import { formatInstant, formatIsoDate, isCalendarId, type CalendarId } from "../../domain/calendar";
import { decideBookingRequestAction, openDisputeAction, rebookAction, rebookTargetsAction, revealContactAction } from "../../server/admin/actions";
import type { SupportBooking } from "../../server/admin/support";

import { Field, formatAmount, NativeSelect, ReasonAction, Section, StatusBadge, useAdminAction } from "./primitives";
import { TOURS_PLATFORM_BASE } from "./paths";

const REASON_CODES = ["operator_cancelled", "weather", "no_show_dispute", "service_not_as_described", "safety_incident", "duplicate_charge", "medical_emergency", "goodwill", "fraud_suspected", "other"];

/** Support view of one booking (M-016, M-020): masked by default, reveal requires an audited reason. */
export function BookingSupportView({ booking: b }: { booking: SupportBooking }) {
  const t = useTranslations("TourAdmin.booking");
  const ts = useTranslations("TourShared");
  const locale = useLocale();
  const { run, pending } = useAdminAction();
  const cal: CalendarId = isCalendarId(b.displayCalendar) ? b.displayCalendar : "gregory";
  const [revealed, setRevealed] = useState<null | { buyer: { firstName: string; lastName: string; email: string | null; phone: string | null }; participants: { position: number; firstName: string; lastName: string; documentLast4: string | null; assistance: string | null }[] }>(null);
  const [targets, setTargets] = useState<{ id: string; starts_on: string; local_start_time: string | null; timezone: string; remaining: number }[] | null>(null);
  const [target, setTarget] = useState("");
  const [dispute, setDispute] = useState({ kind: "refund_exception", reasonCode: "goodwill", amount: "", notes: "" });
  const when = (iso: string | null) => (iso ? formatInstant(iso, { locale, calendar: cal, timeZone: b.departure.timezone }) : "—");
  const live = ["pending_payment", "requested", "confirmed"].includes(b.status);
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <Link href={`${TOURS_PLATFORM_BASE}/bookings`} className="text-muted-foreground text-sm hover:underline">← {t("back")}</Link>
        <h1 className="text-xl font-semibold"><span dir="ltr" className="font-mono">{b.voucher}</span></h1>
        <div className="flex flex-wrap gap-2 text-sm">
          <StatusBadge status={b.status} label={ts(`bookingStatus.${b.status}`)} />
          <span>{t("payment")}: {b.payment.status}</span>
          <span>· {t("refund")}: {b.refunds[0]?.status ?? "—"}</span>
          <span>· {t("payout")}: {b.payouts.map((p) => `${p.entry_type}:${p.status}`).join(", ") || "—"}</span>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Section id="trip" title={t("trip")}>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            <dt className="text-muted-foreground">{t("tour")}</dt><dd><Link href={`${TOURS_PLATFORM_BASE}/tours/${b.tour.id}`} className="hover:underline">{b.tour.title ?? b.tour.slug}</Link></dd>
            <dt className="text-muted-foreground">{t("departure")}</dt>
            <dd data-testid="booking-departure" data-departure-id={b.departure.id}>{b.departure.localDate ? formatIsoDate(b.departure.localDate, { locale, calendar: cal, style: "full" }) : "—"} <span dir="ltr">{b.departure.localTime}</span> ({b.departure.timezone})</dd>
            <dt className="text-muted-foreground">{t("seats")}</dt><dd>{b.seats}</dd>
            <dt className="text-muted-foreground">{t("total")}</dt><dd>{formatAmount(b.total, b.currency, locale)} · {t("paid")} {formatAmount(b.payment.paid, b.currency, locale)}</dd>
            <dt className="text-muted-foreground">{t("commission")}</dt><dd>{b.commissionPercent == null ? "—" : `${b.commissionPercent}%`}</dd>
            <dt className="text-muted-foreground">{t("policy")}</dt><dd>v{b.policy.version} · <span dir="ltr">{b.policy.locale}</span> · {when(b.policy.acceptedAt)}</dd>
            <dt className="text-muted-foreground">{t("prefs")}</dt><dd dir="ltr">{b.uiLocale} · {b.displayCalendar}</dd>
            <dt className="text-muted-foreground">{t("created")}</dt><dd>{when(b.createdAt)}</dd>
            {b.cancelledAt ? <><dt className="text-muted-foreground">{t("cancelled")}</dt><dd>{when(b.cancelledAt)} · {b.cancelReason}</dd></> : null}
          </dl>
        </Section>

        <Section id="people" title={t("people")} description={t("maskedHint")}>
          <div className="space-y-2 text-sm" data-testid="contact">
            <p><strong>{t("buyer")}:</strong> {revealed ? `${revealed.buyer.firstName} ${revealed.buyer.lastName}` : b.buyer.name}</p>
            <p dir="ltr" data-testid="buyer-phone">{revealed ? revealed.buyer.phone : b.buyer.phone}</p>
            <p dir="ltr">{revealed ? revealed.buyer.email : b.buyer.email}</p>
            <ul className="space-y-1">
              {b.participants.map((p) => {
                const r = revealed?.participants.find((x) => x.position === p.position);
                return (
                  <li key={p.position} className="rounded border px-2 py-1">
                    {p.position}. {r ? `${r.firstName} ${r.lastName}` : `${p.firstName} ${p.lastName}`} · {ts(`traveler.${p.travelerClass}`)}{p.age != null ? ` · ${p.age}` : ""}{p.nationality ? ` · ${p.nationality}` : ""}
                    {p.hasDocument ? <span className="text-muted-foreground"> · {t("document")}: {r?.documentLast4 ? <span dir="ltr">…{r.documentLast4}</span> : "••••"}</span> : null}
                    {p.hasAssistance ? <div className="text-xs text-amber-800">{t("assistance")}: {r?.assistance ?? t("hidden")}</div> : null}
                  </li>
                );
              })}
            </ul>
            {!revealed ? (
              <ReasonAction label={t("reveal")} minLength={10} reasonLabel={t("revealReason")} testId="reveal"
                onConfirm={async (reason) => { const r = await run(() => revealContactAction({ bookingId: b.bookingId, reason }), { refresh: false, success: t("revealed") }); if (r) setRevealed(r); }} />
            ) : <p className="text-muted-foreground text-xs">{t("revealAudited")}</p>}
          </div>
        </Section>
      </div>

      {b.status === "requested" ? (
        <Section id="request" title={t("request")}>
          <div className="flex gap-2">
            <Button type="button" size="sm" disabled={pending} onClick={() => run(() => decideBookingRequestAction(b.bookingId, "accept"))}>{t("accept")}</Button>
            <ReasonAction label={t("decline")} variant="destructive" onConfirm={(reason) => run(() => decideBookingRequestAction(b.bookingId, "decline", reason))} />
          </div>
        </Section>
      ) : null}

      {live ? (
        <Section id="rebook" title={t("rebook")} description={t("rebookHint")}>
          {targets === null ? (
            <Button type="button" size="sm" variant="outline" disabled={pending} data-testid="load-targets"
              onClick={async () => { const r = await run(() => rebookTargetsAction(b.bookingId), { refresh: false, success: t("targetsLoaded") }); setTargets(r ?? []); }}>{t("findTargets")}</Button>
          ) : targets.length === 0 ? <p className="text-sm">{t("noTargets")}</p> : (
            <div className="space-y-2">
              <Field label={t("targetDeparture")} htmlFor="rb-target">
                <NativeSelect id="rb-target" value={target} onChange={(e) => setTarget(e.target.value)}>
                  <option value="" />
                  {targets.map((d) => <option key={d.id} value={d.id}>{formatIsoDate(d.starts_on, { locale, calendar: cal })} {d.local_start_time?.slice(0, 5)} · {t("free", { n: d.remaining })}</option>)}
                </NativeSelect>
              </Field>
              {target ? <ReasonAction label={t("rebookConfirm")} testId="rebook" onConfirm={(reason) => run(() => rebookAction({ bookingId: b.bookingId, targetDepartureId: target, reason }), { success: t("rebooked") })} /> : null}
            </div>
          )}
        </Section>
      ) : null}

      <Section id="disputes" title={t("disputes")} description={t("disputesHint")}>
        <ul className="space-y-1 text-sm">
          {b.disputes.map((d) => (
            <li key={d.id} className="rounded border px-2 py-1">{t(`disputeKind.${d.kind}`)} · {d.reason_code} · <StatusBadge status={d.status} label={t(`disputeStatus.${d.status}`)} /> · {d.amount != null ? formatAmount(d.amount, b.currency, locale) : "—"} · {t("level")}: {d.approval_level}/{d.required_level}</li>
          ))}
        </ul>
        <form className="grid gap-2 md:grid-cols-4" onSubmit={(e) => { e.preventDefault(); run(() => openDisputeAction({ bookingId: b.bookingId, ...dispute, amount: dispute.amount || null }), { success: t("disputeOpened"), onSuccess: () => setDispute({ ...dispute, amount: "", notes: "" }) }); }}>
          <Field label={t("kind")} htmlFor="dp-kind">
            <NativeSelect id="dp-kind" value={dispute.kind} onChange={(e) => setDispute({ ...dispute, kind: e.target.value })}>
              {["cancellation", "refund_exception", "chargeback", "complaint"].map((k) => <option key={k} value={k}>{t(`disputeKind.${k}`)}</option>)}
            </NativeSelect>
          </Field>
          <Field label={t("reasonCode")} htmlFor="dp-reason">
            <NativeSelect id="dp-reason" value={dispute.reasonCode} onChange={(e) => setDispute({ ...dispute, reasonCode: e.target.value })}>
              {REASON_CODES.map((r) => <option key={r} value={r}>{t(`reasonCodes.${r}`)}</option>)}
            </NativeSelect>
          </Field>
          <Field label={t("amountIn", { currency: b.currency })} htmlFor="dp-amount"><Input id="dp-amount" dir="ltr" value={dispute.amount} onChange={(e) => setDispute({ ...dispute, amount: e.target.value })} /></Field>
          <Field label={t("notes")} htmlFor="dp-notes"><Textarea id="dp-notes" rows={2} required value={dispute.notes} onChange={(e) => setDispute({ ...dispute, notes: e.target.value })} /></Field>
          <div><Button type="submit" size="sm" disabled={pending || dispute.notes.trim().length < 5}>{t("openDispute")}</Button></div>
        </form>
      </Section>

      <Section id="timeline" title={t("timeline")}>
        <ul className="space-y-0.5 text-sm">
          {b.events.map((e, i) => <li key={i}>{when(e.at)} · <span className="font-mono" dir="ltr">{e.type}</span></li>)}
          {b.payments.map((p, i) => <li key={`p${i}`}>{when(p.created_at)} · {t("paymentRow", { status: p.status, gateway: p.gateway ?? "—" })} {formatAmount(p.amount, p.currency, locale)}</li>)}
          {b.checkins.map((c, i) => <li key={`c${i}`}>{when(c.scanned_at)} · {t("checkinRow", { result: c.result, seats: c.seats })}</li>)}
        </ul>
      </Section>
    </div>
  );
}

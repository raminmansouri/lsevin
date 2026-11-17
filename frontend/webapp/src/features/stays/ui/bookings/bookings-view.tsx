"use client";

import { useState, useTransition } from "react";
import { CalendarDays, Copy, MapPin, Navigation, Phone, Printer, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatInstant } from "@/features/tours/domain/calendar";
import { useToursPrefs } from "@/features/tours/ui/customer/prefs-context";
import { formatMoney, intlLocale } from "@/features/tours/ui/shared/format";
import { QrCode } from "@/features/tours/ui/shared/qr-code";
import { Link, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { cancelStayAction, quoteStayCancellationAction, submitStayReviewAction } from "../../server/actions/customer";
import type { MyStayBooking } from "../../types";
import { Money, StayImage, useClock, useStayDate } from "../common";

import { StayPaymentPanel } from "./payment-panel";

const STATUS_STYLE: Record<string, string> = {
  pending_payment: "bg-amber-100 text-amber-900",
  requested: "bg-sky-100 text-sky-900",
  confirmed: "bg-emerald-100 text-emerald-900",
  completed: "bg-slate-200 text-slate-800",
  cancelled: "bg-red-100 text-red-800",
  declined: "bg-red-100 text-red-800",
  expired: "bg-slate-200 text-slate-700",
  no_show: "bg-slate-200 text-slate-700",
};

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations("StayApp.bookings.status");
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold", STATUS_STYLE[status] ?? "bg-slate-100")} data-testid="stay-booking-status" data-status={status}>
      {t(status as never)}
    </span>
  );
}

export function BookingsList({ groups }: { groups: { upcoming: MyStayBooking[]; past: MyStayBooking[]; cancelled: MyStayBooking[] } }) {
  const t = useTranslations("StayApp.bookings");
  const fmtDate = useStayDate();
  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");
  const items = groups[tab];
  return (
    <div className="px-4 py-4 sm:px-6">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      <div role="tablist" aria-label={t("title")} className="mt-3 flex gap-2">
        {(["upcoming", "past", "cancelled"] as const).map((k) => (
          <button
            key={k}
            role="tab"
            type="button"
            aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={cn("min-h-11 rounded-full px-4 text-sm font-semibold", tab === k ? "bg-emerald-700 text-white" : "bg-white ring-1 ring-slate-300")}
            data-testid={`stay-bookings-tab-${k}`}
          >
            {t(k)} ({groups[k].length})
          </button>
        ))}
      </div>
      {items.length === 0 ? (
        <div className="mt-6 rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200" role="tabpanel">
          <p className="text-slate-600">{t("empty")}</p>
          <Link href="/stays/explore" className="mt-3 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-5 text-sm font-bold text-white">
            {t("emptyCta")}
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-3" role="tabpanel" data-testid="stay-bookings-list">
          {items.map((b) => (
            <li key={b.bookingId}>
              <Link href={`/stays/bookings/${b.bookingId}`} className="flex gap-3 rounded-2xl bg-white p-3 ring-1 ring-slate-200 hover:shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none" data-testid="stay-booking-item">
                <StayImage src={b.coverUrl} alt={b.propertyName} className="size-20 shrink-0 rounded-xl" sizes="80px" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={b.status} />
                    <span className="text-xs text-slate-500">{t("voucher", { code: b.voucherCode })}</span>
                  </div>
                  <p className="mt-1 truncate font-bold">{b.propertyName}</p>
                  <p className="flex items-center gap-1 text-xs text-slate-600">
                    <CalendarDays className="size-3.5" aria-hidden="true" />
                    {fmtDate(b.checkIn)} – {fmtDate(b.checkOut)}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function BookingDetail({ booking, justCreated }: { booking: MyStayBooking; justCreated: boolean }) {
  const t = useTranslations("StayApp.bookings");
  const tBook = useTranslations("StayApp.book");
  const tMeals = useTranslations("StayApp.meals");
  const tDetail = useTranslations("StayApp.detail");
  const locale = useLocale();
  const router = useRouter();
  const { calendar } = useToursPrefs();
  const fmtDate = useStayDate();
  const clock = useClock();
  const instant = (iso: string | null) => (iso ? formatInstant(iso, { locale: intlLocale(locale), calendar, timeZone: booking.timezone }) : "");
  const b = booking;
  const live = ["pending_payment", "requested", "confirmed"].includes(b.status);
  const showVoucher = b.status === "confirmed" || b.status === "completed";

  return (
    <div className="space-y-4 px-4 py-4 sm:px-6 print:p-0" data-testid="stay-booking-detail">
      {justCreated && b.status === "requested" ? (
        <div role="status" className="rounded-2xl bg-sky-50 p-4 text-sky-900 ring-1 ring-sky-200" data-testid="stay-request-sent">
          <p className="font-bold">{tBook("requestSent")}</p>
          <p className="mt-1 text-sm">{tBook("requestSentText", { time: instant(b.requestExpiresAt) })}</p>
        </div>
      ) : null}
      {justCreated && b.status === "confirmed" ? (
        <div role="status" className="rounded-2xl bg-emerald-50 p-4 font-bold text-emerald-900 ring-1 ring-emerald-200" data-testid="stay-confirmed-banner">
          {tBook("confirmedTitle")}
        </div>
      ) : null}

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <StatusBadge status={b.status} />
          <h1 className="mt-2 text-2xl font-extrabold">{b.propertyName}</h1>
          <p className="text-sm text-slate-600">
            {b.roomName} · {tMeals(b.mealPlan as never)}
          </p>
        </div>
        {showVoucher ? (
          <button type="button" onClick={() => window.print()} className="inline-flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-semibold ring-1 ring-slate-300 print:hidden">
            <Printer className="size-4" aria-hidden="true" />
            {t("print")}
          </button>
        ) : null}
      </header>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-slate-500">{t("bookingRef")}</dt>
                <dd className="flex items-center gap-2 font-mono font-bold" dir="ltr" data-testid="stay-voucher-code">
                  {b.voucherCode}
                  <button type="button" aria-label="copy" onClick={() => void navigator.clipboard?.writeText(b.voucherCode)} className="print:hidden">
                    <Copy className="size-4 text-slate-500" aria-hidden="true" />
                  </button>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t("stayDates")}</dt>
                <dd className="font-semibold">
                  {fmtDate(b.checkIn)} – {fmtDate(b.checkOut)} · {tBook("nightsRooms", { nights: b.nights, rooms: b.rooms })}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{tDetail("checkIn")}</dt>
                <dd>{tDetail("checkInFrom", { time: clock(b.checkInTime) })}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{tDetail("checkOut")}</dt>
                <dd>{tDetail("checkOutUntil", { time: clock(b.checkOutTime) })}</dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t("guests")}</dt>
                <dd>
                  {tBook("guestsLine", { adults: b.adults, children: b.childAges.length })}
                  <ul className="mt-1 text-xs text-slate-600">
                    {b.guests.map((g, i) => (
                      <li key={i}>
                        {g.firstName} {g.lastName}
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
              <div>
                <dt className="text-xs text-slate-500">{t("contact")}</dt>
                <dd>
                  {b.buyer.firstName} {b.buyer.lastName}
                  <span className="block text-xs text-slate-600" dir="ltr">
                    {b.buyer.phone}
                  </span>
                </dd>
              </div>
            </dl>
          </section>

          <section className="rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="stay-booking-address">
            <h2 className="font-bold">{t("address")}</h2>
            {b.address || b.location || b.contactPhone ? (
              <div className="mt-2 space-y-2 text-sm">
                {b.address ? (
                  <p className="flex items-start gap-1.5">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-emerald-700" aria-hidden="true" />
                    {b.address}
                  </p>
                ) : null}
                {b.contactPhone ? (
                  <a href={`tel:${b.contactPhone}`} className="flex items-center gap-1.5 font-semibold text-emerald-800" dir="ltr">
                    <Phone className="size-4" aria-hidden="true" />
                    {b.contactPhone}
                  </a>
                ) : null}
                {b.location ? (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${b.location.latitude},${b.location.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 font-semibold ring-1 ring-slate-300 print:hidden"
                  >
                    <Navigation className="size-4" aria-hidden="true" />
                    {t("directions")}
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="mt-2 text-sm text-slate-600">{t("addressAfterConfirm")}</p>
            )}
          </section>

          {b.specialRequests ? (
            <section className="rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200">
              <h2 className="font-bold">{tBook("specialRequests")}</h2>
              <p className="mt-1 whitespace-pre-line text-slate-700">{b.specialRequests}</p>
            </section>
          ) : null}

          <section className="rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200">
            <h2 className="font-bold">{tDetail("cancellation")}</h2>
            {b.refundable && b.policy.rules.length ? (
              <ul className="mt-2 space-y-1 text-slate-700">
                {b.policy.rules.map((r) => (
                  <li key={r.hoursBefore}>{tDetail("cancellationRule", { percent: r.refundPercent, hours: r.hoursBefore })}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-slate-700">{tDetail("cancellationNone")}</p>
            )}
            {b.cancelledAt ? <p className="mt-2 text-red-700">{t("cancelled_note", { date: fmtDate(b.cancelledAt.slice(0, 10)) })}</p> : null}
            {b.refundQuote && b.refundQuote.refundAmount > 0 ? (
              <p className="mt-1 text-emerald-800" data-testid="stay-refund-note">
                {t("refund", { amount: formatMoney(b.refundQuote.refundAmount, b.currency, locale) })}
              </p>
            ) : null}
            {live ? <CancelBooking booking={b} onDone={() => router.refresh()} /> : null}
          </section>

          {b.canReview ? <ReviewForm bookingId={b.bookingId} /> : b.reviewed ? <p className="text-sm text-slate-600">{t("review.already")}</p> : null}
        </div>

        <div className="space-y-4">
          {b.status === "requested" && b.requestExpiresAt ? (
            <p className="rounded-2xl bg-sky-50 p-4 text-sm text-sky-900">{t("requestDeadline", { time: instant(b.requestExpiresAt) })}</p>
          ) : null}
          {b.status === "pending_payment" ? (
            <StayPaymentPanel bookingId={b.bookingId} amount={b.totalAmount - b.paidAmount} currency={b.currency} deadlineLabel={instant(b.paymentDeadlineAt)} onPaid={() => router.refresh()} />
          ) : null}
          {showVoucher ? (
            <section className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center ring-1 ring-slate-200" data-testid="stay-voucher">
              <h2 className="font-bold">{t("voucherTitle")}</h2>
              <QrCode value={`LSEVIN-STAY:${b.voucherCode}`} size={160} label={b.voucherCode} />
              <p className="text-xs text-slate-600">{t("voucherNote")}</p>
            </section>
          ) : null}
          <section className="rounded-2xl bg-white p-4 text-sm ring-1 ring-slate-200">
            <h2 className="font-bold">{t("payment")}</h2>
            <div className="mt-2 space-y-1">
              {b.priceSnapshot?.nightly?.length ? (
                <div className="flex justify-between gap-2 text-slate-700">
                  <span>{tBook("lines.rooms", { count: b.rooms, nights: b.nights })}</span>
                  <Money amount={b.priceSnapshot.nightly.reduce((sum, n) => sum + n.amount, 0)} currency={b.currency} />
                </div>
              ) : null}
              {b.priceSnapshot?.lines
                ?.filter((l) => l.kind !== "room_night")
                .map((l, i) => (
                  <div key={i} className="flex justify-between gap-2 text-slate-700">
                    <span>{tBook(`lines.${l.kind}` as never)}</span>
                    <Money amount={l.amount} currency={b.currency} />
                  </div>
                ))}
              <div className="flex justify-between gap-2 border-t border-slate-100 pt-2 font-bold">
                <span>{t("total")}</span>
                <Money amount={b.totalAmount} currency={b.currency} testId="stay-booking-detail-total" />
              </div>
              {b.paidAmount > 0 ? <p className="text-emerald-800">{t("paid", { amount: formatMoney(b.paidAmount, b.currency, locale) })}</p> : null}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function CancelBooking({ booking, onDone }: { booking: MyStayBooking; onDone: () => void }) {
  const t = useTranslations("StayApp.bookings");
  const tErr = useTranslations("StayApp.errors");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [quote, setQuote] = useState<{ refundAmount: number; refundPercent: number } | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function openDialog() {
    setOpen(true);
    setError(null);
    setQuote(null);
    start(async () => {
      const r = await quoteStayCancellationAction({ bookingId: booking.bookingId }).catch(() => null);
      if (r?.ok) setQuote({ refundAmount: r.data.quote.refundAmount, refundPercent: r.data.quote.refundPercent });
      else setError(r ? r.error.code : "service_unavailable");
    });
  }

  return (
    <>
      <button type="button" onClick={openDialog} className="mt-3 min-h-11 rounded-full px-4 text-sm font-semibold text-red-700 ring-1 ring-red-200 hover:bg-red-50 print:hidden" data-testid="stay-cancel-open">
        {t("cancel")}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent data-testid="stay-cancel-dialog">
          <DialogHeader>
            <DialogTitle>{t("cancelTitle")}</DialogTitle>
            <DialogDescription data-testid="stay-cancel-quote">
              {quote == null
                ? "…"
                : booking.paidAmount <= 0
                  ? t("cancelQuoteNothingPaid")
                  : quote.refundAmount > 0
                    ? t("cancelQuote", { amount: formatMoney(quote.refundAmount, booking.currency, locale), percent: quote.refundPercent })
                    : t("cancelNoRefund")}
            </DialogDescription>
          </DialogHeader>
          <label className="block text-sm font-medium">
            {t("cancelReason")}
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={3} maxLength={500} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" data-testid="stay-cancel-reason" />
          </label>
          {error ? (
            <p role="alert" className="text-sm text-red-700">
              {tErr.has(error as never) ? tErr(error as never) : tErr("generic")}
            </p>
          ) : null}
          <DialogFooter className="gap-2">
            <button type="button" onClick={() => setOpen(false)} className="min-h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-slate-300">
              {t("cancelKeep")}
            </button>
            <button
              type="button"
              disabled={pending || reason.trim().length < 3 || quote == null}
              onClick={() =>
                start(async () => {
                  const r = await cancelStayAction({ bookingId: booking.bookingId, reason }).catch(() => null);
                  if (r?.ok) {
                    setOpen(false);
                    onDone();
                  } else setError(r ? r.error.code : "service_unavailable");
                })
              }
              className="min-h-11 rounded-full bg-red-600 px-5 text-sm font-bold text-white disabled:opacity-50"
              data-testid="stay-cancel-confirm"
            >
              {t("cancelConfirm")}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ReviewForm({ bookingId }: { bookingId: string }) {
  const t = useTranslations("StayApp.bookings.review");
  const tScores = useTranslations("StayApp.detail.scores");
  const tErr = useTranslations("StayApp.errors");
  const locale = useLocale();
  const [rating, setRating] = useState(0);
  const [scores, setScores] = useState<Record<string, number | null>>({ cleanliness: null, location: null, staff: null, value: null });
  const [body, setBody] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [state, setState] = useState<"idle" | "done" | string>("idle");
  const [pending, start] = useTransition();
  if (state === "done") {
    return (
      <p role="status" className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900" data-testid="stay-review-thanks">
        {t("thanks")}
      </p>
    );
  }
  const stars = (value: number, onChange: (v: number) => void, label: string, testId: string) => (
    <div role="radiogroup" aria-label={label} className="flex gap-1" data-testid={testId}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" role="radio" aria-checked={value === n} aria-label={`${n}`} onClick={() => onChange(n)} className="p-1">
          <Star className={cn("size-6", n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300")} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
  return (
    <section className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="stay-review-form">
      <h2 className="font-bold">{t("title")}</h2>
      <div>
        <p className="text-sm font-semibold">{t("overall")}</p>
        {stars(rating, setRating, t("overall"), "stay-review-overall")}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(["cleanliness", "location", "staff", "value"] as const).map((k) => (
          <div key={k}>
            <p className="text-xs text-slate-600">{tScores(k)}</p>
            {stars(scores[k] ?? 0, (v) => setScores((s) => ({ ...s, [k]: v })), tScores(k), `stay-review-${k}`)}
          </div>
        ))}
      </div>
      <label className="block text-sm">
        {t("body")}
        <textarea value={body} onChange={(e) => setBody(e.target.value)} maxLength={3000} rows={4} className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2" data-testid="stay-review-body" />
      </label>
      <label className="block text-sm">
        {t("authorName")}
        <input value={authorName} onChange={(e) => setAuthorName(e.target.value)} maxLength={60} className="mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3" />
      </label>
      {state !== "idle" ? (
        <p role="alert" className="text-sm text-red-700">
          {tErr.has(state as never) ? tErr(state as never) : tErr("generic")}
        </p>
      ) : null}
      <button
        type="button"
        disabled={rating === 0 || pending}
        onClick={() =>
          start(async () => {
            const r = await submitStayReviewAction({ bookingId, rating, ...scores, body: body || null, authorName: authorName || null, locale }).catch(() => null);
            setState(r?.ok ? "done" : r ? r.error.code : "service_unavailable");
          })
        }
        className="min-h-11 rounded-full bg-emerald-700 px-5 text-sm font-bold text-white disabled:opacity-50"
        data-testid="stay-review-submit"
      >
        {t("submit")}
      </button>
    </section>
  );
}

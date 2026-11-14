"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Clock, Loader2, LogIn, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatInstant } from "@/features/tours/domain/calendar";
import { directionOf } from "@/features/tours/domain/content";
import { useToursPrefs } from "@/features/tours/ui/customer/prefs-context";
import { formatMoney, intlLocale } from "@/features/tours/ui/shared/format";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { StayQuote } from "../../domain/pricing";
import { confirmStayCheckoutAction, startStayCheckoutAction } from "../../server/actions/customer";
import { Money, useStayDate } from "../common";

export type BookingContext = {
  propertyId: string;
  propertySlug: string;
  propertyName: string;
  roomTypeId: string;
  roomName: string;
  ratePlanId: string;
  mealPlan: string;
  refundable: boolean;
  checkIn: string;
  checkOut: string;
  occupancy: { rooms: number; adults: number; childAges: number[] };
  confirmationMode: "instant" | "request";
  requestTimeoutHours: number;
  timezone: string;
  coverUrl: string | null;
  policy: { version: number; rules: { hoursBefore: number; refundPercent: number }[]; noShowRefundPercent: number; text: string | null };
  houseRules: string[];
};

type Hold = { holdId: string; expiresAt: string; quote: StayQuote; policyVersion: number; confirmationMode: "instant" | "request" };
type Details = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  guests: { firstName: string; lastName: string }[];
  specialRequests: string;
  arrivalTime: string;
};

function newKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 32);
}

/**
 * Stay checkout (H05–H08): hold → guest details → review & consent → confirm.
 * The selection lives in the URL; guest details live in sessionStorage keyed by
 * the selection (they survive refresh, sign-in and language change, and never
 * appear in a URL). Idempotency keys are per selection, so a double click or a
 * retried request returns the same hold / booking instead of creating another.
 */
export function StayBookingFlow({ ctx, signedIn, initialQuote }: { ctx: BookingContext; signedIn: boolean; initialQuote: StayQuote | null }) {
  const t = useTranslations("StayApp.book");
  const tErr = useTranslations("StayApp.errors");
  const tMeals = useTranslations("StayApp.meals");
  const tDetail = useTranslations("StayApp.detail");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { calendar } = useToursPrefs();
  const fmtDate = useStayDate();
  const rtl = directionOf(locale) === "rtl";
  const Back = rtl ? ArrowRight : ArrowLeft;
  const selKey = `stays:checkout:${ctx.ratePlanId}:${ctx.checkIn}:${ctx.checkOut}:${ctx.occupancy.rooms}:${ctx.occupancy.adults}:${ctx.occupancy.childAges.join(".")}`;

  const [step, setStep] = useState<"details" | "review">("details");
  const [hold, setHold] = useState<Hold | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [details, setDetails] = useState<Details>(() => ({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    guests: Array.from({ length: ctx.occupancy.rooms }, () => ({ firstName: "", lastName: "" })),
    specialRequests: "",
    arrivalTime: "",
  }));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ code: string; details?: Record<string, unknown> } | null>(null);
  const keys = useRef<{ hold: string; confirm: string } | null>(null);
  const restored = useRef(false);

  // Restore draft + idempotency keys (client only).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(selKey);
      if (raw) {
        const saved = JSON.parse(raw) as { details?: Details; keys?: { hold: string; confirm: string } };
        if (saved.details && saved.details.guests?.length === ctx.occupancy.rooms) setDetails(saved.details);
        if (saved.keys) keys.current = saved.keys;
      }
    } catch {
      /* storage unavailable: start fresh */
    }
    if (!keys.current) keys.current = { hold: newKey(), confirm: newKey() };
    restored.current = true;
  }, [selKey, ctx.occupancy.rooms]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      sessionStorage.setItem(selKey, JSON.stringify({ details, keys: keys.current }));
    } catch {
      /* ignore */
    }
  }, [details, selKey]);

  const placeHold = useCallback(async () => {
    if (!keys.current) keys.current = { hold: newKey(), confirm: newKey() };
    setHoldError(null);
    setExpired(false);
    const res = await startStayCheckoutAction({
      propertyId: ctx.propertyId,
      roomTypeId: ctx.roomTypeId,
      ratePlanId: ctx.ratePlanId,
      checkIn: ctx.checkIn,
      checkOut: ctx.checkOut,
      occupancy: ctx.occupancy,
      idempotencyKey: keys.current.hold,
    }).catch(() => null);
    if (!res) return setHoldError("service_unavailable");
    if (!res.ok) return setHoldError(res.error.code);
    setHold({ holdId: res.data.holdId, expiresAt: res.data.expiresAt, quote: res.data.quote, policyVersion: res.data.policy.version, confirmationMode: res.data.confirmationMode });
  }, [ctx]);

  useEffect(() => {
    if (signedIn) void placeHold();
  }, [signedIn, placeHold]);

  // Hold countdown → expired state (the server is the authority; this is a visible hint).
  useEffect(() => {
    if (!hold) return;
    const ms = new Date(hold.expiresAt).getTime() - Date.now();
    if (ms <= 0) return setExpired(true);
    const id = setTimeout(() => setExpired(true), ms);
    return () => clearTimeout(id);
  }, [hold]);

  function restart() {
    keys.current = { hold: newKey(), confirm: newKey() };
    try {
      sessionStorage.setItem(selKey, JSON.stringify({ details, keys: keys.current }));
    } catch {
      /* ignore */
    }
    setHold(null);
    void placeHold();
  }

  function validateDetails(): boolean {
    const e: Record<string, string> = {};
    const name = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,79}$/u;
    if (!name.test(details.firstName.trim())) e["buyer.firstName"] = details.firstName.trim() ? "invalid" : "required";
    if (!name.test(details.lastName.trim())) e["buyer.lastName"] = details.lastName.trim() ? "invalid" : "required";
    const phone = details.phone.replace(/[\s-]/g, "");
    if (!/^\+?\d{7,15}$/.test(phone)) e["buyer.phone"] = phone ? "invalid" : "required";
    if (details.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) e["buyer.email"] = "invalid";
    details.guests.forEach((g, i) => {
      if (!name.test(g.firstName.trim())) e[`guests.${i}.firstName`] = g.firstName.trim() ? "invalid" : "required";
      if (!name.test(g.lastName.trim())) e[`guests.${i}.lastName`] = g.lastName.trim() ? "invalid" : "required";
    });
    if (details.specialRequests.length > 1000) e.specialRequests = "too_long";
    setFieldErrors(e);
    if (Object.keys(e).length) {
      const first = Object.keys(e)[0];
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-field="${first}"]`)?.focus());
      return false;
    }
    return true;
  }

  async function confirm() {
    if (!hold || !keys.current) return;
    if (!consent) {
      setConsentError(true);
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    const res = await confirmStayCheckoutAction({
      propertyId: ctx.propertyId,
      roomTypeId: ctx.roomTypeId,
      ratePlanId: ctx.ratePlanId,
      checkIn: ctx.checkIn,
      checkOut: ctx.checkOut,
      occupancy: ctx.occupancy,
      holdId: hold.holdId,
      idempotencyKey: keys.current.confirm,
      expectedTotal: hold.quote.total,
      acceptedPolicyVersion: hold.policyVersion,
      uiLocale: locale,
      displayCalendar: calendar,
      buyer: { firstName: details.firstName.trim(), lastName: details.lastName.trim(), phone: details.phone.trim(), email: details.email.trim() || null },
      guests: details.guests.map((g) => ({ firstName: g.firstName.trim(), lastName: g.lastName.trim() })),
      specialRequests: details.specialRequests.trim() || null,
      arrivalTime: details.arrivalTime || null,
      policyAccepted: true,
    }).catch(() => null);
    if (!res) {
      setSubmitting(false);
      setSubmitError({ code: "service_unavailable" });
      return;
    }
    if (!res.ok) {
      setSubmitting(false);
      setSubmitError(res.error);
      const fields = (res.error.details?.fields ?? {}) as Record<string, string>;
      if (Object.keys(fields).length) {
        setFieldErrors(fields);
        setStep("details");
      }
      if (res.error.code === "price_changed" && typeof res.error.details?.total === "number") {
        setHold((h) => (h ? { ...h, quote: { ...h.quote, total: res.error.details!.total as number } } : h));
      }
      if (res.error.code === "hold_expired" || res.error.code === "hold_not_found") setExpired(true);
      return;
    }
    try {
      sessionStorage.removeItem(selKey);
    } catch {
      /* ignore */
    }
    router.replace(`/stays/bookings/${res.data.bookingId}?new=1`);
  }

  const quote = hold?.quote ?? initialQuote;
  const nights = quote?.nights ?? 0;
  const children = ctx.occupancy.childAges.length;
  const holdTime = hold ? formatInstant(hold.expiresAt, { locale: intlLocale(locale), calendar, timeZone: ctx.timezone }).split(/[,،]\s*/).pop() : "";
  const err = (k: string) => (fieldErrors[k] ? t(`fieldErrors.${fieldErrors[k] === "required" ? "required" : fieldErrors[k] === "too_long" ? "too_long" : "invalid"}`) : null);

  const summary = useMemo(
    () => (
      <aside className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200" aria-labelledby="stay-summary-title" data-testid="stay-booking-summary">
        <h2 id="stay-summary-title" className="font-bold">
          {t("summary")}
        </h2>
        <div>
          <p className="font-semibold">{ctx.propertyName}</p>
          <p className="text-sm text-slate-600">{ctx.roomName} · {tMeals(ctx.mealPlan as never)}</p>
        </div>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <dt className="text-xs text-slate-500">{tDetail("checkIn")}</dt>
            <dd className="font-semibold" data-testid="stay-summary-checkin">{fmtDate(ctx.checkIn)}</dd>
          </div>
          <div>
            <dt className="text-xs text-slate-500">{tDetail("checkOut")}</dt>
            <dd className="font-semibold" data-testid="stay-summary-checkout">{fmtDate(ctx.checkOut)}</dd>
          </div>
        </dl>
        <p className="text-sm text-slate-700">
          {t("nightsRooms", { nights, rooms: ctx.occupancy.rooms })} · {t("guestsLine", { adults: ctx.occupancy.adults, children })}
        </p>
        {quote ? (
          <div className="space-y-1 border-t border-slate-100 pt-3 text-sm">
            <div className="flex justify-between gap-2">
              <span>{t("lines.rooms", { count: quote.rooms, nights: quote.nights })}</span>
              <Money amount={quote.nightly.reduce((a, n) => a + n.amount, 0)} currency={quote.currency} />
            </div>
            {quote.lines
              .filter((l) => l.kind !== "room_night")
              .map((l, i) => (
                <div key={i} className="flex justify-between gap-2" data-testid={`stay-line-${l.kind}`}>
                  <span>{t(`lines.${l.kind}` as never)}</span>
                  <Money amount={l.amount} currency={quote.currency} />
                </div>
              ))}
            <div className="flex items-baseline justify-between gap-2 border-t border-slate-100 pt-2 text-base font-extrabold">
              <span>{t("total")}</span>
              <Money amount={quote.total} currency={quote.currency} testId="stay-booking-total" />
            </div>
            <p className="text-xs text-slate-500">{t("chargedIn", { currency: quote.currency })}</p>
          </div>
        ) : null}
      </aside>
    ),
    [ctx, quote, nights, children, t, tMeals, tDetail, fmtDate],
  );

  if (!signedIn) {
    return (
      <div className="grid gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_360px]">
        <section className="rounded-2xl bg-white p-6 ring-1 ring-slate-200" data-testid="stay-booking-signin">
          <h1 className="text-xl font-bold">{t("signInTitle")}</h1>
          <p className="mt-2 text-sm text-slate-600">{t("signInText")}</p>
          <Link
            href={`/sign-in?redirectTo=${encodeURIComponent(`${pathname}${typeof window !== "undefined" ? window.location.search : ""}`)}`}
            className="mt-4 inline-flex min-h-12 items-center gap-2 rounded-full bg-emerald-700 px-6 text-sm font-bold text-white"
          >
            <LogIn className="size-4" aria-hidden="true" />
            {t("signIn")}
          </Link>
        </section>
        {summary}
      </div>
    );
  }

  const input = "mt-1 min-h-11 w-full rounded-xl border px-3 text-sm focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none";
  const field = (key: string, label: string, value: string, onChange: (v: string) => void, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="block text-sm font-medium text-slate-800">
      {label}
      <input
        {...extra}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        data-field={key}
        data-testid={`stay-field-${key}`}
        aria-invalid={Boolean(fieldErrors[key])}
        aria-describedby={fieldErrors[key] ? `${key}-err` : undefined}
        className={cn(input, fieldErrors[key] ? "border-red-500" : "border-slate-300")}
      />
      {fieldErrors[key] ? (
        <span id={`${key}-err`} className="mt-1 block text-xs font-medium text-red-700">
          {err(key)}
        </span>
      ) : null}
    </label>
  );

  return (
    <div className="px-4 py-4 sm:px-6">
      <Link href={`/stays/p/${ctx.propertySlug}?in=${ctx.checkIn}&out=${ctx.checkOut}&adults=${ctx.occupancy.adults}&rooms=${ctx.occupancy.rooms}${children ? `&ages=${ctx.occupancy.childAges.join(",")}` : ""}`} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900">
        <Back className="size-4" aria-hidden="true" />
        {t("back")}
      </Link>
      <h1 className="mt-1 text-2xl font-extrabold">{t("title")}</h1>
      <ol className="mt-3 flex gap-2 text-xs" aria-label={t("stepOf", { n: step === "details" ? 1 : 2, total: 3 })}>
        {(["details", "review", "pay"] as const).map((s, i) => (
          <li key={s} aria-current={s === step ? "step" : undefined} className={cn("rounded-full px-3 py-1 font-semibold", s === step ? "bg-emerald-700 text-white" : "bg-slate-200 text-slate-700")}>
            {i + 1}. {t(`steps.${s}`)}
          </li>
        ))}
      </ol>

      <div className="mt-4 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {holdError ? (
            <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200" data-testid="stay-hold-error">
              <p className="font-semibold">{tErr(holdError as never)}</p>
              <Link href={`/stays/p/${ctx.propertySlug}`} className="mt-2 inline-flex min-h-11 items-center font-semibold underline">
                {t("restart")}
              </Link>
            </div>
          ) : !hold ? (
            <p className="flex items-center gap-2 text-sm text-slate-600" role="status" data-testid="stay-holding">
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {t("holding")}
            </p>
          ) : expired ? (
            <div role="alert" className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-amber-200" data-testid="stay-hold-expired">
              <p className="font-semibold">{t("holdExpired")}</p>
              <button type="button" onClick={restart} className="mt-2 min-h-11 rounded-full bg-amber-600 px-4 font-semibold text-white">
                {t("restart")}
              </button>
            </div>
          ) : (
            <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm text-emerald-900" data-testid="stay-hold-active">
              <Clock className="size-4" aria-hidden="true" />
              {t("heldUntil", { rooms: ctx.occupancy.rooms, time: holdTime ?? "" })}
            </p>
          )}

          {step === "details" ? (
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                if (validateDetails()) {
                  setStep("review");
                  window.scrollTo({ top: 0 });
                }
              }}
              className="space-y-4"
              data-testid="stay-details-form"
            >
              <fieldset className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <legend className="px-1 font-bold">{t("contact")}</legend>
                <p className="text-xs text-slate-500">{t("contactHint")}</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {field("buyer.firstName", t("firstName"), details.firstName, (v) => setDetails((d) => ({ ...d, firstName: v })), { autoComplete: "given-name", required: true })}
                  {field("buyer.lastName", t("lastName"), details.lastName, (v) => setDetails((d) => ({ ...d, lastName: v })), { autoComplete: "family-name", required: true })}
                  {field("buyer.phone", t("phone"), details.phone, (v) => setDetails((d) => ({ ...d, phone: v })), { autoComplete: "tel", inputMode: "tel", dir: "ltr", required: true })}
                  {field("buyer.email", t("email"), details.email, (v) => setDetails((d) => ({ ...d, email: v })), { autoComplete: "email", inputMode: "email", dir: "ltr", type: "email" })}
                </div>
              </fieldset>
              <fieldset className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <legend className="px-1 font-bold">{t("guestsTitle")}</legend>
                {details.guests.map((g, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold">{t("leadGuest", { n: i + 1 })}</p>
                      {i === 0 ? (
                        <button
                          type="button"
                          className="min-h-9 rounded-full px-3 text-xs font-semibold text-emerald-800 hover:bg-emerald-50"
                          onClick={() => setDetails((d) => ({ ...d, guests: d.guests.map((x, j) => (j === 0 ? { firstName: d.firstName, lastName: d.lastName } : x)) }))}
                          data-testid="stay-same-as-contact"
                        >
                          {t("sameAsContact")}
                        </button>
                      ) : null}
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {field(`guests.${i}.firstName`, t("firstName"), g.firstName, (v) => setDetails((d) => ({ ...d, guests: d.guests.map((x, j) => (j === i ? { ...x, firstName: v } : x)) })))}
                      {field(`guests.${i}.lastName`, t("lastName"), g.lastName, (v) => setDetails((d) => ({ ...d, guests: d.guests.map((x, j) => (j === i ? { ...x, lastName: v } : x)) })))}
                    </div>
                  </div>
                ))}
              </fieldset>
              <fieldset className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <label className="block text-sm font-medium text-slate-800">
                  {t("specialRequests")}
                  <textarea
                    value={details.specialRequests}
                    maxLength={1000}
                    rows={3}
                    onChange={(e) => setDetails((d) => ({ ...d, specialRequests: e.target.value }))}
                    className="mt-1 w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                    data-testid="stay-field-specialRequests"
                  />
                  <span className="mt-1 block text-xs text-slate-500">{t("specialRequestsHint")}</span>
                </label>
                <label className="block text-sm font-medium text-slate-800">
                  {t("arrivalTime")}
                  <input type="time" value={details.arrivalTime} onChange={(e) => setDetails((d) => ({ ...d, arrivalTime: e.target.value }))} dir="ltr" className="mt-1 min-h-11 rounded-xl border border-slate-300 px-3 text-sm" data-testid="stay-field-arrivalTime" />
                </label>
              </fieldset>
              <button type="submit" disabled={!hold || expired} className="min-h-12 w-full rounded-full bg-emerald-700 text-base font-bold text-white disabled:opacity-50 sm:w-auto sm:px-10" data-testid="stay-details-continue">
                {t("continue")}
              </button>
            </form>
          ) : (
            <section className="space-y-4" data-testid="stay-review-step">
              <div className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
                <h2 className="font-bold">{t("policyTitle")}</h2>
                {ctx.refundable && ctx.policy.rules.length ? (
                  <ul className="mt-2 space-y-1 text-sm text-slate-700">
                    {ctx.policy.rules.map((r) => (
                      <li key={r.hoursBefore}>{tDetail("cancellationRule", { percent: r.refundPercent, hours: r.hoursBefore })}</li>
                    ))}
                    <li className="text-slate-500">{tDetail("cancellationLate")}</li>
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-700">{tDetail("cancellationNone")}</p>
                )}
                {ctx.policy.text ? <p className="mt-2 text-sm whitespace-pre-line text-slate-700">{ctx.policy.text}</p> : null}
                {ctx.houseRules.length ? (
                  <ul className="mt-3 list-inside list-disc space-y-1 text-sm text-slate-700">
                    {ctx.houseRules.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                ) : null}
                <label className={cn("mt-4 flex items-start gap-3 rounded-xl p-3 text-sm", consentError ? "bg-red-50 ring-1 ring-red-300" : "bg-slate-50")}>
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => {
                      setConsent(e.target.checked);
                      setConsentError(false);
                    }}
                    className="mt-0.5 size-5 accent-emerald-700"
                    aria-invalid={consentError}
                    data-testid="stay-consent"
                  />
                  <span>{t("consent")}</span>
                </label>
                {consentError ? (
                  <p role="alert" className="mt-1 text-xs font-medium text-red-700">
                    {t("consentRequired")}
                  </p>
                ) : null}
              </div>
              {ctx.confirmationMode === "request" ? (
                <p className="flex items-start gap-2 rounded-2xl bg-sky-50 p-3 text-sm text-sky-900">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                  {t("requestNote", { hours: ctx.requestTimeoutHours })}
                </p>
              ) : null}
              {submitError ? (
                <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200" data-testid="stay-submit-error">
                  {submitError.code === "price_changed" && hold ? (
                    <PriceChanged total={hold.quote.total} currency={hold.quote.currency} />
                  ) : submitError.code === "policy_changed" ? (
                    t("policyChanged")
                  ) : (
                    tErr.has(submitError.code as never) ? tErr(submitError.code as never) : tErr("generic")
                  )}
                </div>
              ) : null}
              <div className="flex flex-wrap gap-3">
                <button type="button" onClick={() => setStep("details")} className="min-h-12 rounded-full px-6 text-sm font-semibold ring-1 ring-slate-300">
                  {t("steps.details")}
                </button>
                <button
                  type="button"
                  disabled={!hold || expired || submitting}
                  onClick={confirm}
                  className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-base font-bold text-white hover:bg-orange-600 disabled:opacity-50 sm:flex-none"
                  data-testid="stay-confirm"
                >
                  {submitting ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
                  {submitting ? t("submitting") : ctx.confirmationMode === "request" ? t("confirmRequest") : (quote?.total ?? 0) <= 0 ? t("confirmFree") : t("confirmInstant")}
                </button>
              </div>
            </section>
          )}
        </div>
        <div className="lg:sticky lg:top-20 lg:self-start">{summary}</div>
      </div>
    </div>
  );
}

function PriceChanged({ total, currency }: { total: number; currency: string }) {
  const t = useTranslations("StayApp.book");
  const locale = useLocale();
  return <>{t("priceChanged", { total: formatMoney(total, currency, locale) })}</>;
}

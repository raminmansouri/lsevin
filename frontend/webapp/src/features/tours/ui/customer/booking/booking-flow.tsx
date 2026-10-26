"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Minus, Plus, Timer, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { calendarDisplayName } from "../../../domain/calendar";
import { contentLocaleFor, directionOf } from "../../../domain/content";
import { TRAVELER_CLASSES, type Quote, type TravelerClass } from "../../../domain/pricing";
import {
  confirmCheckoutAction,
  joinWaitlistAction,
  quoteAction,
  releaseHoldAction,
  startCheckoutAction,
} from "../../../server/actions/customer";
import type { DepartureView, TourDetail } from "../../../server/platform/catalog";
import { CalendarPicker, type DayInfo } from "../../shared/calendar-picker";
import { CalendarSwitcher } from "../../shared/calendar-switcher";
import { ToursErrorAlert, useToursErrorMessage, type ToursActionError } from "../../shared/error-alert";
import { formatClock, formatMoney, formatNumber, intlLocale, languageName } from "../../shared/format";
import { LocalizedText } from "../../shared/localized-text";
import { TourPrice, useTourDateFormat } from "../common";
import { useToursPrefs } from "../prefs-context";

import { DetailsStep, validateDetails } from "./details-step";
import {
  clearDraft,
  emptyBuyer,
  newKey,
  readDraft,
  selectionKey,
  toAscii,
  writeDraft,
  type BookingDraft,
  type BookingStep,
  type DraftParticipant,
} from "./draft";
import { PaymentPanel } from "./payment-panel";
import { PriceSummary } from "./price-summary";
import { ReviewStep } from "./review-step";

type Option = TourDetail["options"][number];
type ActionError = ToursActionError;

const STEPS: BookingStep[] = ["date", "travelers", "details", "review", "result"];
const STEP_LABEL: Record<BookingStep, string> = { date: "date", travelers: "travelers", details: "details", review: "review", result: "payment" };

function LoadingDots({ label }: { label: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-col items-center justify-center gap-3 py-10" data-testid="booking-loading">
      <span className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} className="size-2.5 animate-bounce rounded-full bg-emerald-700" style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </span>
      <span className="text-sm text-slate-600">{label}</span>
    </div>
  );
}

function useNow(active: boolean) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

function classesFor(option: Option | undefined): TravelerClass[] {
  if (!option) return ["adult"];
  const priced = TRAVELER_CLASSES.filter((c) => option.tiers.some((t) => t.travelerClass === c));
  if (option.kind === "private") return priced.length ? priced : ["adult", "child"];
  return priced.length ? priced : ["adult"];
}

function syncParticipants(list: DraftParticipant[], travelers: Partial<Record<TravelerClass, number>>): DraftParticipant[] {
  const out: DraftParticipant[] = [];
  for (const cls of TRAVELER_CLASSES) {
    const existing = list.filter((p) => p.travelerClass === cls);
    for (let i = 0; i < (travelers[cls] ?? 0); i += 1) {
      out.push(existing[i] ?? { travelerClass: cls, firstName: "", lastName: "", nationality: "", age: "", isForeign: false, assistanceRequest: "" });
    }
  }
  return out;
}

export function BookingFlow({
  detail,
  departures,
  signedIn,
  initial,
}: {
  detail: TourDetail;
  departures: DepartureView[];
  signedIn: boolean;
  initial: { departureId: string | null; optionId: string | null; travelers: Record<string, number> };
}) {
  const t = useTranslations("TourApp.booking");
  const tShared = useTranslations("TourShared");
  const tCard = useTranslations("TourApp.card");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const prefs = useToursPrefs();
  const fmt = useTourDateFormat();
  const errorText = useToursErrorMessage();
  const rtl = directionOf(locale) === "rtl";
  const tz = detail.facts.timezone;
  const currency = detail.facts.currency;

  const defaultOption = detail.options.find((o) => o.id === initial.optionId) ?? detail.options.find((o) => o.kind === "public") ?? detail.options[0];
  const initialTravelers = Object.keys(initial.travelers).length ? initial.travelers : { adult: Math.max(1, defaultOption?.minGroup ?? 1) };

  const [draft, setDraft] = useState<BookingDraft>(() => ({
    v: 1,
    step: initial.departureId ? "travelers" : "date",
    departureId: initial.departureId && departures.some((d) => d.id === initial.departureId) ? initial.departureId : null,
    optionId: defaultOption?.id ?? null,
    travelers: initialTravelers,
    addons: {},
    buyer: emptyBuyer(),
    participants: syncParticipants([], initialTravelers),
    hold: null,
    confirmKey: null,
    accepted: null,
    result: null,
    savedAt: Date.now(),
  }));
  const [restored, setRestored] = useState(false);
  const [restoredNote, setRestoredNote] = useState(false);
  const [quote, setQuote] = useState<{ quote: Quote; remaining: number; policyVersion: number } | null>(null);
  const [quoteError, setQuoteError] = useState<ActionError | null>(null);
  const [quoting, setQuoting] = useState(false);
  const [error, setError] = useState<ActionError | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<null | "hold" | "confirm">(null);
  const [waitlisted, setWaitlisted] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const quoteSeq = useRef(0);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // Restore the draft (refresh, sign-in return, language switch) — client only.
  useEffect(() => {
    const saved = readDraft(detail.id);
    if (saved) {
      const linkWins = initial.departureId && initial.departureId !== saved.departureId && departures.some((d) => d.id === initial.departureId);
      if (linkWins) {
        setDraft((d) => ({ ...d, buyer: saved.buyer, participants: syncParticipants(saved.participants, d.travelers) }));
      } else {
        setDraft(saved);
      }
      if (saved.buyer.firstName || saved.participants.some((p) => p.firstName)) setRestoredNote(true);
    }
    setRestored(true);
  }, [detail.id]);

  useEffect(() => {
    if (restored) writeDraft(detail.id, draft);
  }, [restored, draft, detail.id]);

  const update = useCallback((patch: Partial<BookingDraft>) => setDraft((d) => ({ ...d, ...patch })), []);

  const option = detail.options.find((o) => o.id === draft.optionId) ?? defaultOption;
  const optionDepartures = useMemo(
    () => departures.filter((d) => !d.optionId || d.optionId === option?.id),
    [departures, option?.id],
  );
  const departure = optionDepartures.find((d) => d.id === draft.departureId) ?? null;
  const byDate = useMemo(() => {
    const m = new Map<string, DepartureView[]>();
    for (const d of optionDepartures) m.set(d.localDate, [...(m.get(d.localDate) ?? []), d]);
    return m;
  }, [optionDepartures]);
  const [selectedDate, setSelectedDate] = useState<string | null>(departure?.localDate ?? null);
  useEffect(() => {
    if (departure) setSelectedDate(departure.localDate);
  }, [departure]);
  const seats = (Object.values(draft.travelers) as (number | undefined)[]).reduce<number>((a, n) => a + (n ?? 0), 0);

  // Keep the shareable selection in the URL (no personal data).
  useEffect(() => {
    if (!restored) return;
    const p = new URLSearchParams();
    if (draft.departureId) p.set("departure", draft.departureId);
    if (draft.optionId) p.set("option", draft.optionId);
    for (const [k, n] of Object.entries(draft.travelers)) if (n) p.set(k, String(n));
    const url = `${window.location.pathname}?${p.toString()}`;
    if (url !== `${window.location.pathname}${window.location.search}`) window.history.replaceState(window.history.state, "", url);
  }, [restored, draft.departureId, draft.optionId, draft.travelers]);

  // Live server quote (booking_process_3.png). Never computed in the browser.
  const addonList = (Object.entries(draft.addons) as [string, number][]).filter(([, q]) => q > 0).map(([id, quantity]) => ({ id, quantity }));
  const selKey = selectionKey({ departureId: draft.departureId, optionId: draft.optionId, travelers: draft.travelers, addons: draft.addons });
  useEffect(() => {
    if (!draft.departureId || !draft.optionId || seats < 1 || draft.step === "result") {
      setQuote(null);
      return;
    }
    const seq = ++quoteSeq.current;
    setQuoting(true);
    const timer = window.setTimeout(async () => {
      const res = await quoteAction({ departureId: draft.departureId, optionId: draft.optionId, travelers: draft.travelers, addons: addonList }).catch(() => null);
      if (seq !== quoteSeq.current) return;
      setQuoting(false);
      if (!res) {
        setQuote(null);
        setQuoteError({ kind: "infrastructure", code: "service_unavailable" });
      } else if (!res.ok) {
        setQuote(null);
        setQuoteError(res.error);
      } else {
        setQuote(res.data);
        setQuoteError(null);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [selKey, draft.step === "result"]);

  const now = useNow(Boolean(draft.hold));
  const holdLeftMs = draft.hold ? new Date(draft.hold.expiresAt).getTime() - now : 0;
  const holdExpired = Boolean(draft.hold) && holdLeftMs <= 0;

  function goStep(step: BookingStep) {
    setError(null);
    update({ step });
    window.setTimeout(() => headingRef.current?.focus(), 0);
  }

  function changeSelection(patch: Partial<BookingDraft>) {
    // A changed selection invalidates the hold; release it now rather than leaving it until expiry.
    if (draft.hold) void releaseHoldAction(draft.hold.id).catch(() => undefined);
    const travelers = patch.travelers ?? draft.travelers;
    update({ ...patch, hold: null, confirmKey: null, accepted: null, participants: syncParticipants(draft.participants, travelers) });
  }

  function signInHref() {
    return `/sign-in?redirectTo=${encodeURIComponent(`${pathname}${window.location.search}`)}`;
  }

  async function reserve(): Promise<boolean> {
    if (!draft.departureId || !draft.optionId) return false;
    if (draft.hold && draft.hold.selectionKey === selKey && new Date(draft.hold.expiresAt).getTime() > Date.now() + 5000) return true;
    if (draft.hold) void releaseHoldAction(draft.hold.id).catch(() => undefined);
    setBusy("hold");
    const key = newKey("hold");
    const res = await startCheckoutAction({ departureId: draft.departureId, optionId: draft.optionId, travelers: draft.travelers, addons: addonList, idempotencyKey: key }).catch(() => null);
    setBusy(null);
    if (!res || !res.ok) {
      const err = res && !res.ok ? res.error : { kind: "infrastructure", code: "service_unavailable" };
      if (err.code === "sign_in_required") {
        router.push(signInHref());
        return false;
      }
      setError(err);
      return false;
    }
    update({
      hold: { id: res.data.holdId, key, expiresAt: res.data.expiresAt, total: res.data.quote.total, policyVersion: res.data.policy.version, confirmationMode: res.data.confirmationMode, selectionKey: selKey },
      participants: syncParticipants(draft.participants, draft.travelers),
    });
    return true;
  }

  async function continueFromTravelers() {
    setError(null);
    if (!signedIn) {
      writeDraft(detail.id, draft);
      router.push(signInHref());
      return;
    }
    if (await reserve()) goStep("details");
  }

  function continueFromDetails() {
    const errs = validateDetails(draft.buyer, draft.participants);
    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setError({ kind: "validation", code: "invalid_guest_details" });
      window.setTimeout(() => document.querySelector<HTMLElement>("[aria-invalid='true']")?.focus(), 0);
      return;
    }
    update({ confirmKey: draft.confirmKey ?? newKey("confirm") });
    goStep("review");
  }

  async function confirm() {
    if (!draft.hold || !draft.departureId || !draft.optionId || busy) return;
    if (draft.accepted !== draft.hold.policyVersion) {
      setError({ kind: "validation", code: "accept_required" });
      return;
    }
    const confirmKey = draft.confirmKey ?? newKey("confirm");
    if (!draft.confirmKey) update({ confirmKey });
    setBusy("confirm");
    setError(null);
    setNotice(null);
    const res = await confirmCheckoutAction({
      departureId: draft.departureId,
      optionId: draft.optionId,
      travelers: draft.travelers,
      addons: addonList,
      holdId: draft.hold.id,
      idempotencyKey: confirmKey,
      expectedTotal: draft.hold.total,
      acceptedPolicyVersion: draft.accepted,
      policyLocale: detail.policy?.text.cancellation?.locale ?? contentLocaleFor(locale),
      uiLocale: locale,
      displayCalendar: prefs.calendar,
      buyer: { firstName: draft.buyer.firstName.trim(), lastName: draft.buyer.lastName.trim(), email: draft.buyer.email.trim() || null, phone: toAscii(draft.buyer.phone).replace(/[\s-]/g, "") },
      participants: draft.participants.map((p) => ({
        travelerClass: p.travelerClass,
        firstName: p.firstName.trim(),
        lastName: p.lastName.trim(),
        nationality: p.nationality || null,
        age: p.age ? Number(p.age) : null,
        assistanceRequest: p.assistanceRequest.trim() || null,
        isForeign: p.isForeign,
      })),
    }).catch(() => null);
    setBusy(null);
    if (!res) {
      setError({ kind: "infrastructure", code: "service_unavailable" });
      return;
    }
    if (!res.ok) {
      const e = res.error;
      const d = (e.details ?? {}) as Record<string, unknown>;
      if (e.code === "price_changed") {
        setNotice(t("changed.price", { total: formatMoney(Number(d.total), String(d.currency ?? currency), locale) }));
        // Show the server's new total; the customer confirms again explicitly (no silent charge).
        update({ hold: { ...draft.hold, total: Number(d.total) }, accepted: null });
        return;
      }
      if (e.code === "policy_changed") {
        setNotice(t("changed.policy", { version: formatNumber(Number(d.version), locale) }));
        update({ hold: { ...draft.hold, policyVersion: Number(d.version) }, accepted: null });
        startTransition(() => router.refresh());
        return;
      }
      if (e.code === "hold_expired" || e.code === "hold_not_found") {
        setNotice(t("changed.hold"));
        update({ hold: null });
        return;
      }
      if (e.code === "insufficient_capacity" || e.code === "departure_unavailable" || e.code === "booking_cutoff_passed") {
        setNotice(e.code === "insufficient_capacity" ? t("changed.capacity") : errorText(e));
        update({ hold: null, step: "date" });
        startTransition(() => router.refresh());
        return;
      }
      if (e.code === "invalid_guest_details") {
        setFieldErrors(((d.fields ?? {}) as Record<string, string>) ?? {});
        update({ step: "details" });
        setError(e);
        return;
      }
      setError(e);
      return;
    }
    update({ result: res.data, step: "result", hold: null });
    if (res.data.status === "confirmed") {
      clearDraft(detail.id);
    }
  }

  async function reReserve() {
    setNotice(null);
    await reserve();
  }

  const stepIndex = STEPS.indexOf(draft.step);
  const Back = rtl ? ArrowRight : ArrowLeft;
  const options = detail.options;

  // ---------------------------------------------------------------------
  // Date step helpers
  // ---------------------------------------------------------------------
  const compact = useMemo(() => new Intl.NumberFormat(intlLocale(locale), { notation: "compact", maximumFractionDigits: 1 }), [locale]);
  const getDay = useCallback(
    (iso: string): DayInfo => {
      const list = byDate.get(iso);
      if (!list || list.length === 0) return { disabled: true, state: "none" };
      const ok = list.filter((d) => d.bookable && d.remaining >= Math.max(seats, 1));
      if (ok.length > 0) {
        const cheapest = Math.min(...ok.map((d) => d.priceFrom ?? Infinity));
        const remaining = Math.max(...ok.map((d) => d.remaining));
        const price = Number.isFinite(cheapest) ? formatMoney(cheapest, currency, locale) : "";
        return {
          state: "available",
          sublabel: Number.isFinite(cheapest) ? compact.format(cheapest) : undefined,
          srLabel: t("dayStatus.available", { price, seats: remaining }),
        };
      }
      const reason = list.some((d) => d.reason === "below_party") ? "below_party" : list.some((d) => d.reason === "sold_out") ? "sold_out" : list.some((d) => d.reason === "cutoff") ? "cutoff" : "blocked";
      return { disabled: reason !== "sold_out", state: reason, srLabel: t(`dayStatus.${reason}`), sublabel: reason === "sold_out" ? "—" : undefined };
    },
    [byDate, seats, currency, locale, compact, t],
  );
  const firstBookable = optionDepartures.find((d) => d.bookable)?.localDate;
  const dayList = selectedDate ? byDate.get(selectedDate) ?? [] : [];

  if (!restored) {
    return <LoadingDots label={t("loading")} />;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 pt-3 pb-40 sm:px-6" data-testid="booking-flow" data-step={draft.step}>
      <div className="flex items-center gap-2">
        <Link href={`/tours/t/${detail.slug}`} aria-label={t("back")} className="flex size-11 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-200">
          <Back className="size-5" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <p className="truncate text-xs text-slate-500">
            <LocalizedText text={detail.text.title} badge={false} />
          </p>
          <h1 ref={headingRef} tabIndex={-1} className="text-lg font-bold text-slate-900 outline-none" data-testid="booking-step-title">
            {t(`steps.${STEP_LABEL[draft.step]}`)}
          </h1>
        </div>
      </div>

      <nav aria-label={t("steps.label")} className="mt-3">
        <ol className="flex items-center gap-1.5">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1" aria-current={s === draft.step ? "step" : undefined}>
              <span className={cn("block h-1.5 rounded-full", i <= stepIndex ? "bg-emerald-700" : "bg-slate-200")} aria-hidden="true" />
              <span className="sr-only">{t("steps.current", { index: i + 1, total: STEPS.length, name: t(`steps.${STEP_LABEL[s]}`) })}</span>
            </li>
          ))}
        </ol>
      </nav>

      {restoredNote && draft.step !== "result" ? <p className="mt-3 rounded-xl bg-sky-50 px-3 py-2 text-xs text-sky-900">{t("draftRestored")}</p> : null}
      {notice ? (
        <div role="alert" className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" data-testid="booking-notice">
          {notice}
          {!draft.hold && draft.step === "review" ? (
            <button type="button" onClick={reReserve} className="mt-2 block min-h-11 font-semibold text-amber-900 underline">
              {t("hold.restart")}
            </button>
          ) : null}
        </div>
      ) : null}
      <ToursErrorAlert error={error} className="mt-3" message={error?.code === "accept_required" ? t("review.acceptRequired") : undefined} />

      {draft.hold && draft.step !== "result" ? (
        <p className={cn("mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-sm", holdExpired ? "bg-red-50 text-red-800" : "bg-emerald-50 text-emerald-900")} data-testid="hold-timer" aria-live={holdExpired ? "assertive" : "off"}>
          <Timer className="size-4" aria-hidden="true" />
          {holdExpired ? (
            <>
              {t("hold.expired")}
              <button type="button" onClick={reReserve} className="ms-auto min-h-11 font-semibold underline">
                {t("hold.restart")}
              </button>
            </>
          ) : (
            t("hold.until", { time: formatNumber(Math.floor(holdLeftMs / 60000), locale) + ":" + formatNumber(Math.floor((holdLeftMs % 60000) / 1000), locale, { minimumIntegerDigits: 2 }) })
          )}
        </p>
      ) : null}

      {busy === "hold" ? <LoadingDots label={t("hold.creating")} /> : null}
      {busy === "confirm" ? <LoadingDots label={t("review.submitting")} /> : null}

      {/* -------------------------------------------------- DATE -------------------------------------------------- */}
      {draft.step === "date" && !busy ? (
        <section aria-labelledby="date-title" className="mt-4 space-y-4">
          <h2 id="date-title" className="sr-only">
            {t("chooseDate")}
          </h2>
          {optionDepartures.length === 0 ? (
            <p className="rounded-2xl bg-white p-6 text-center text-sm text-slate-600" data-testid="no-departures">
              {t("noDepartures")}
            </p>
          ) : (
            <>
              <CalendarSwitcher value={prefs.calendar} onChange={(c) => void prefs.setCalendar(c)} />
              <div className="rounded-3xl bg-white p-3 shadow-sm ring-1 ring-slate-200 sm:p-5">
                <CalendarPicker
                  testId="departure-calendar"
                  calendar={prefs.calendar}
                  locale={locale}
                  value={selectedDate}
                  initialIso={selectedDate ?? firstBookable}
                  onChange={(iso) => {
                    setSelectedDate(iso);
                    const list = (byDate.get(iso) ?? []).filter((d) => d.bookable);
                    if (list.length === 1) changeSelection({ departureId: list[0].id });
                    else if (!list.some((d) => d.id === draft.departureId)) changeSelection({ departureId: null });
                  }}
                  getDay={getDay}
                  labels={{ previousMonth: t("previousMonth"), nextMonth: t("nextMonth"), grid: t("calendarGrid"), selected: t("legend.selected") }}
                />
                <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <span className="font-medium">{tShared("calendar.shownIn", { calendar: calendarDisplayName(prefs.calendar, intlLocale(locale)) })}</span>
                  <details className="text-xs">
                    <summary className="min-h-11 cursor-pointer content-center font-medium text-emerald-700">{t("legend.title")}</summary>
                    <ul className="mt-1 space-y-1">
                      <li className="flex items-center gap-2"><span className="size-3 rounded bg-emerald-100" aria-hidden="true" /> {t("legend.available")}</li>
                      <li className="flex items-center gap-2"><span className="size-3 rounded bg-slate-100 line-through" aria-hidden="true" /> {t("legend.soldOut")}</li>
                      <li className="flex items-center gap-2"><span className="size-3 rounded bg-white ring-1 ring-slate-200" aria-hidden="true" /> {t("legend.closed")}</li>
                      <li className="flex items-center gap-2"><span className="size-3 rounded bg-emerald-700" aria-hidden="true" /> {t("legend.selected")}</li>
                    </ul>
                    <p className="mt-1 text-slate-500">{t("calendarGuide")}</p>
                  </details>
                  {selectedDate ? (
                    <button type="button" onClick={() => { setSelectedDate(null); changeSelection({ departureId: null }); }} className="min-h-11 font-medium text-slate-600 underline">
                      {t("clear")}
                    </button>
                  ) : null}
                </div>
              </div>

              {selectedDate ? (
                <fieldset className="space-y-2" data-testid="departure-times">
                  <legend className="mb-1 text-sm font-semibold text-slate-800">
                    {t("departures")} — <span suppressHydrationWarning>{fmt.date(selectedDate, "full")}</span>
                  </legend>
                  {dayList.map((d) => {
                    const ok = d.bookable && d.remaining >= Math.max(seats, 1);
                    return (
                      <label
                        key={d.id}
                        className={cn(
                          "flex min-h-14 items-center justify-between gap-3 rounded-2xl bg-white px-4 py-2 ring-1",
                          draft.departureId === d.id ? "ring-2 ring-emerald-600" : "ring-slate-200",
                          ok ? "cursor-pointer" : "opacity-70",
                        )}
                      >
                        <span className="flex items-center gap-3">
                          <input type="radio" name="departure" disabled={!ok} checked={draft.departureId === d.id} onChange={() => changeSelection({ departureId: d.id })} className="size-5 accent-emerald-700" />
                          <span className="text-sm">
                            <span className="flex items-center gap-1 font-semibold text-slate-900">
                              <Clock className="size-4" aria-hidden="true" />
                              {d.localTime ? formatClock(d.localTime, locale) : t("timeTbc")}
                            </span>
                            <span className="text-xs text-slate-500">{ok ? tCard("seatsLeft", { count: d.remaining }) : t(`dayStatus.${d.reason === "ok" ? "below_party" : d.reason}`)}</span>
                          </span>
                        </span>
                        {d.priceFrom != null ? <TourPrice amount={d.priceFrom} currency={currency} className="text-sm font-semibold text-emerald-800" /> : null}
                      </label>
                    );
                  })}
                  <p className="text-xs text-slate-500">{t("localTime", { zone: tz })}</p>
                  {dayList.some((d) => d.reason === "sold_out") && !dayList.some((d) => d.bookable) ? (
                    <WaitlistBox departureId={dayList.find((d) => d.reason === "sold_out")!.id} seats={Math.max(seats, 1)} signedIn={signedIn} joined={waitlisted} onJoined={setWaitlisted} signInHref={signInHref} />
                  ) : null}
                </fieldset>
              ) : null}

              {departure ? <SelectedDeparture departure={departure} currency={currency} /> : null}
            </>
          )}
        </section>
      ) : null}

      {/* ------------------------------------------------ TRAVELERS ------------------------------------------------ */}
      {draft.step === "travelers" && !busy ? (
        <section aria-labelledby="travelers-title" className="mt-4 space-y-5">
          {departure ? (
            <button type="button" onClick={() => goStep("date")} className="flex w-full items-center justify-between gap-3 rounded-2xl bg-white p-4 text-start ring-1 ring-slate-200" data-testid="selected-summary">
              <span className="flex items-center gap-3">
                <CalendarDays className="size-5 text-emerald-700" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-semibold text-slate-900" suppressHydrationWarning>{fmt.date(departure.localDate, "full")}</span>
                  <span className="text-xs text-slate-500">{departure.localTime ? formatClock(departure.localTime, locale) : t("timeTbc")} · {t("localTime", { zone: tz })}</span>
                </span>
              </span>
              <span className="text-sm font-medium text-emerald-700">{t("edit")}</span>
            </button>
          ) : (
            <p className="rounded-2xl bg-amber-50 p-4 text-sm text-amber-900">
              {t("chooseDate")}{" "}
              <button type="button" className="min-h-11 font-semibold underline" onClick={() => goStep("date")}>
                {t("edit")}
              </button>
            </p>
          )}

          {options.length > 1 ? (
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-semibold text-slate-800">{t("option")}</legend>
              {options.map((o) => (
                <label key={o.id} className={cn("flex min-h-14 cursor-pointer items-start gap-3 rounded-2xl bg-white p-3 ring-1", o.id === option?.id ? "ring-2 ring-emerald-600" : "ring-slate-200")} data-testid={`option-${o.code}`}>
                  <input
                    type="radio"
                    name="option"
                    checked={o.id === option?.id}
                    onChange={() => {
                      const tr = o.kind === "private" ? { adult: Math.max(o.minGroup, Math.min(seats || 1, o.maxGroup ?? 50)) } : { adult: Math.max(1, draft.travelers.adult ?? 1) };
                      changeSelection({ optionId: o.id, travelers: tr, addons: {}, departureId: departures.some((d) => d.id === draft.departureId && (!d.optionId || d.optionId === o.id)) ? draft.departureId : null });
                    }}
                    className="mt-1 size-5 accent-emerald-700"
                  />
                  <span className="text-sm">
                    <span className="block font-semibold text-slate-900">
                      {o.label ? <LocalizedText text={o.label} badge={false} /> : t(`optionKinds.${o.kind}`)}
                    </span>
                    <span className="text-xs text-slate-500">
                      {t(`optionKinds.${o.kind}`)}
                      {o.kind === "private" && o.privateGroupPrice != null ? ` · ${t("optionPrivatePrice", { price: formatMoney(o.privateGroupPrice, currency, locale), max: formatNumber(o.maxGroup ?? 0, locale) })}` : ""}
                      {o.pickupIncluded ? ` · ${t("pickupIncluded")}` : ""}
                      {o.guideLanguage ? ` · ${t("guideLanguage", { language: languageName(o.guideLanguage, locale) })}` : ""}
                    </span>
                  </span>
                </label>
              ))}
            </fieldset>
          ) : null}

          <fieldset className="space-y-2" aria-describedby="group-limit">
            <legend id="travelers-title" className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-800">
              <Users className="size-4" aria-hidden="true" />
              {t("travelers")}
            </legend>
            {classesFor(option).map((cls) => {
              const tier = option?.tiers.find((x) => x.travelerClass === cls);
              const count = draft.travelers[cls] ?? 0;
              const max = Math.min(option?.maxGroup ?? 50, detail.facts.maxParticipants ?? 50);
              const clsName = tShared(`traveler.${cls}`);
              return (
                <div key={cls} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200" data-testid={`stepper-${cls}`}>
                  <div className="text-sm">
                    <p className="font-semibold text-slate-900">{clsName}</p>
                    <p className="text-xs text-slate-500">
                      {tier?.minAge != null && tier?.maxAge != null ? t("travelerAge", { min: formatNumber(tier.minAge, locale), max: formatNumber(tier.maxAge, locale) }) : tier?.maxAge != null ? t("travelerMaxAge", { max: formatNumber(tier.maxAge, locale) }) : null}
                      {tier && option?.kind !== "private" ? <> · <TourPrice amount={tier.amount} currency={currency} /></> : null}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      aria-label={t("decrease", { class: clsName })}
                      disabled={count <= 0 || seats <= 1}
                      onClick={() => changeSelection({ travelers: { ...draft.travelers, [cls]: count - 1 } })}
                      className="flex size-11 items-center justify-center rounded-full border border-slate-300 text-slate-700 hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none disabled:opacity-30"
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <output className="min-w-6 text-center text-base font-bold" aria-live="polite" aria-label={t("count", { count: formatNumber(count, locale), class: clsName })} data-testid={`count-${cls}`}>
                      {formatNumber(count, locale)}
                    </output>
                    <button
                      type="button"
                      aria-label={t("increase", { class: clsName })}
                      disabled={seats >= max || (departure ? seats >= departure.remaining : false)}
                      onClick={() => changeSelection({ travelers: { ...draft.travelers, [cls]: count + 1 } })}
                      className="flex size-11 items-center justify-center rounded-full border border-emerald-700 text-emerald-800 hover:bg-emerald-50 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none disabled:opacity-30"
                      data-testid={`inc-${cls}`}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              );
            })}
            <p id="group-limit" className="text-xs text-slate-500">
              {t("groupLimit", { min: formatNumber(option?.minGroup ?? 1, locale), max: formatNumber(option?.maxGroup ?? detail.facts.maxParticipants ?? 50, locale) })}
            </p>
          </fieldset>

          {detail.addons.length > 0 ? (
            <fieldset className="space-y-2">
              <legend className="mb-1 text-sm font-semibold text-slate-800">{t("addons")}</legend>
              {detail.addons.map((a) => {
                const q = draft.addons[a.id] ?? 0;
                const name = a.label?.value ?? a.code;
                return (
                  <div key={a.id} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-slate-200">
                    <div className="text-sm">
                      <p className="font-semibold text-slate-900">
                        <LocalizedText text={a.label} placeholder={a.code} />
                      </p>
                      <p className="text-xs text-slate-500">{a.pricing === "per_person" ? t("addonPerPerson", { price: formatMoney(a.amount, currency, locale) }) : t("addonPerBooking", { price: formatMoney(a.amount, currency, locale) })}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button type="button" aria-label={t("decrease", { class: name })} disabled={q <= 0} onClick={() => changeSelection({ addons: { ...draft.addons, [a.id]: q - 1 } })} className="flex size-11 items-center justify-center rounded-full border border-slate-300 disabled:opacity-30">
                        <Minus className="size-4" aria-hidden="true" />
                      </button>
                      <output className="min-w-6 text-center font-bold" aria-live="polite">{formatNumber(q, locale)}</output>
                      <button type="button" aria-label={t("increase", { class: name })} disabled={q >= a.maxQty} onClick={() => changeSelection({ addons: { ...draft.addons, [a.id]: q + 1 } })} className="flex size-11 items-center justify-center rounded-full border border-emerald-700 text-emerald-800 disabled:opacity-30">
                        <Plus className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </fieldset>
          ) : null}

          <PriceSummary quote={quote?.quote ?? null} loading={quoting} error={quoteError} addons={detail.addons} />
        </section>
      ) : null}

      {/* ------------------------------------------------- DETAILS ------------------------------------------------- */}
      {draft.step === "details" && !busy ? (
        <DetailsStep
          buyer={draft.buyer}
          participants={draft.participants}
          errors={fieldErrors}
          onBuyer={(buyer) => update({ buyer })}
          onParticipants={(participants) => update({ participants })}
        />
      ) : null}

      {/* -------------------------------------------------- REVIEW ------------------------------------------------- */}
      {draft.step === "review" && !busy ? (
        <ReviewStep
          detail={detail}
          departure={departure}
          draft={draft}
          quote={quote?.quote ?? null}
          holdTotal={draft.hold?.total ?? null}
          policyVersion={draft.hold?.policyVersion ?? detail.policy?.version ?? 0}
          accepted={draft.accepted}
          onAccept={(v) => update({ accepted: v })}
          onEdit={(s) => goStep(s)}
        />
      ) : null}

      {/* -------------------------------------------------- RESULT ------------------------------------------------- */}
      {draft.step === "result" && draft.result ? (
        <section className="mt-6 space-y-4" data-testid="booking-result" data-status={draft.result.status}>
          {draft.result.status === "confirmed" ? (
            <div className="rounded-3xl bg-emerald-50 p-6 text-center">
              <h2 className="text-xl font-bold text-emerald-900">{t("result.confirmed")}</h2>
              <Link href={`/tours/bookings/${draft.result.bookingId}`} className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-emerald-700 px-6 font-semibold text-white" data-testid="view-voucher">
                {t("result.viewVoucher")}
              </Link>
            </div>
          ) : draft.result.status === "requested" ? (
            <div className="rounded-3xl bg-sky-50 p-6 text-center" data-testid="request-pending">
              <h2 className="text-xl font-bold text-sky-900">{t("result.requested")}</h2>
              {draft.result.requestExpiresAt ? (
                <p className="mt-2 text-sm text-sky-900" suppressHydrationWarning>
                  {t("result.requestedBody", { time: fmt.instant(draft.result.requestExpiresAt, tz) })}
                </p>
              ) : null}
              <Link href={`/tours/bookings/${draft.result.bookingId}`} className="mt-4 inline-flex min-h-12 items-center rounded-2xl bg-sky-800 px-6 font-semibold text-white" data-testid="view-voucher">
                {t("result.myBookings")}
              </Link>
            </div>
          ) : (
            <PaymentPanel
              bookingId={draft.result.bookingId}
              amount={draft.result.amountDue}
              currency={draft.result.currency}
              deadline={draft.result.paymentDeadlineAt}
              timeZone={tz}
              onPaid={() => {
                clearDraft(detail.id);
                router.push(`/tours/bookings/${draft.result!.bookingId}`);
              }}
            />
          )}
        </section>
      ) : null}

      {/* ---------------------------------------------- STICKY ACTIONS --------------------------------------------- */}
      {draft.step !== "result" ? (
        <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur md:bottom-0" data-testid="booking-actions">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
            <div className="min-w-0 text-xs text-slate-500" aria-live="polite" data-testid="sticky-total">
              {(draft.step === "review" || draft.step === "details") && draft.hold ? (
                <>
                  <span className="block">{t("summary.total")}</span>
                  <TourPrice amount={draft.hold.total} currency={currency} className="text-base font-bold text-slate-900" />
                </>
              ) : quote ? (
                <>
                  <span className="block">{t("summary.total")}</span>
                  <TourPrice amount={quote.quote.total} currency={currency} className="text-base font-bold text-slate-900" />
                </>
              ) : departure?.priceFrom != null ? (
                <>
                  <span className="block">{t("summary.title")}</span>
                  <TourPrice amount={departure.priceFrom} currency={currency} className="text-base font-bold text-slate-900" />
                </>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {stepIndex > 0 && draft.step !== "review" ? (
                <button type="button" onClick={() => goStep(STEPS[stepIndex - 1])} className="min-h-12 rounded-2xl px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100" data-testid="step-back">
                  {t("back")}
                </button>
              ) : null}
              {draft.step === "date" ? (
                <button type="button" disabled={!departure || !departure.bookable} onClick={() => goStep("travelers")} className="min-h-12 rounded-2xl bg-emerald-700 px-6 text-sm font-bold text-white disabled:opacity-40" data-testid="continue">
                  {t("continue")}
                </button>
              ) : draft.step === "travelers" ? (
                signedIn ? (
                  <button type="button" disabled={!departure || !quote || quoting || Boolean(busy)} onClick={continueFromTravelers} className="min-h-12 rounded-2xl bg-emerald-700 px-6 text-sm font-bold text-white disabled:opacity-40" data-testid="continue">
                    {t("continue")}
                  </button>
                ) : (
                  <button type="button" disabled={!departure || !quote} onClick={continueFromTravelers} className="min-h-12 rounded-2xl bg-emerald-700 px-6 text-sm font-bold text-white disabled:opacity-40" data-testid="sign-in-to-continue" title={t("signInNote")}>
                    {t("signInToContinue")}
                  </button>
                )
              ) : draft.step === "details" ? (
                <button type="button" onClick={continueFromDetails} disabled={holdExpired} className="min-h-12 rounded-2xl bg-emerald-700 px-6 text-sm font-bold text-white disabled:opacity-40" data-testid="continue">
                  {t("continue")}
                </button>
              ) : draft.step === "review" ? (
                <>
                  <button type="button" onClick={() => goStep("details")} className="min-h-12 rounded-2xl px-4 text-sm font-semibold text-slate-700 hover:bg-slate-100" data-testid="step-back">
                    {t("back")}
                  </button>
                  <button
                    type="button"
                    onClick={confirm}
                    disabled={Boolean(busy) || !draft.hold || holdExpired}
                    aria-disabled={draft.accepted !== draft.hold?.policyVersion || undefined}
                    className="min-h-12 rounded-2xl bg-emerald-700 px-6 text-sm font-bold text-white disabled:opacity-40 aria-disabled:opacity-60"
                    data-testid="confirm-booking"
                  >
                    {draft.hold?.confirmationMode === "request" ? t("review.submitRequest") : (draft.hold?.total ?? 0) > 0 ? t("review.submitPay") : t("review.submit")}
                  </button>
                </>
              ) : null}
            </div>
          </div>
          {!signedIn && draft.step === "travelers" ? <p className="mx-auto mt-1 max-w-3xl text-[11px] text-slate-500">{t("signInNote")}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

function SelectedDeparture({ departure, currency }: { departure: DepartureView; currency: string }) {
  const t = useTranslations("TourApp.booking");
  const tShared = useTranslations("TourShared.calendar");
  const tCard = useTranslations("TourApp.card");
  const locale = useLocale();
  const fmt = useTourDateFormat();
  return (
    <div className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-950" data-testid="selected-departure" data-departure-id={departure.id} data-local-date={departure.localDate}>
      <p className="font-semibold" data-testid="selected-date" suppressHydrationWarning>
        {fmt.date(departure.localDate, "full")} <span className="font-normal text-emerald-800">({tShared(fmt.calendar)})</span>
      </p>
      <p className="mt-1 flex flex-wrap gap-x-4 text-emerald-900">
        <span data-testid="selected-time">{departure.localTime ? formatClock(departure.localTime, locale) : t("timeTbc")}</span>
        <span data-testid="selected-seats">{tCard("seatsLeft", { count: departure.remaining })}</span>
        {departure.priceFrom != null ? (
          <span data-testid="selected-price">
            <TourPrice amount={departure.priceFrom} currency={currency} />
          </span>
        ) : null}
      </p>
      <p className="mt-1 text-xs text-emerald-800">{t("localTime", { zone: departure.timezone })}</p>
    </div>
  );
}

function WaitlistBox({
  departureId,
  seats,
  signedIn,
  joined,
  onJoined,
  signInHref,
}: {
  departureId: string;
  seats: number;
  signedIn: boolean;
  joined: string | null;
  onJoined: (id: string | null) => void;
  signInHref: () => string;
}) {
  const t = useTranslations("TourApp.booking");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<ToursActionError | null>(null);
  const [pending, start] = useTransition();
  if (joined === departureId) {
    return (
      <p role="status" className="rounded-xl bg-sky-50 p-3 text-sm text-sky-900" data-testid="waitlist-joined">
        {t("waitlist.joined")}
      </p>
    );
  }
  return (
    <div className="space-y-2 rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="waitlist">
      <p className="text-sm text-slate-700">{t("soldOutDay")}</p>
      {signedIn ? (
        <>
          <label className="flex min-h-11 items-center gap-2 text-sm">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="size-5 accent-emerald-700" />
            {t("waitlist.consent")}
          </label>
          <button
            type="button"
            disabled={!consent || pending}
            onClick={() =>
              start(async () => {
                const res = await joinWaitlistAction(departureId, seats).catch(() => null);
                if (!res?.ok) {
                  setError(res && !res.ok ? res.error : { kind: "infrastructure", code: "service_unavailable" });
                  return;
                }
                onJoined(departureId);
              })
            }
            className="min-h-11 rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white disabled:opacity-40"
          >
            {t("waitlist.join")}
          </button>
        </>
      ) : (
        <Link href={signInHref()} className="inline-flex min-h-11 items-center rounded-xl bg-slate-900 px-4 text-sm font-semibold text-white">
          {t("waitlist.join")}
        </Link>
      )}
      <ToursErrorAlert error={error} />
    </div>
  );
}

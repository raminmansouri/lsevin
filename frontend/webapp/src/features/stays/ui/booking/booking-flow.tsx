"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, CalendarDays, ChevronDown, Clock, Loader2, LogIn, MessageSquareText, Pencil, Plus, ShieldCheck, Trash2, UserRound, Users } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { formatInstant } from "@/features/tours/domain/calendar";
import { useToursPrefs } from "@/features/tours/ui/customer/prefs-context";
import { formatMoney, intlLocale } from "@/features/tours/ui/shared/format";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { StayQuote } from "../../domain/pricing";
import { confirmStayCheckoutAction, startStayCheckoutAction } from "../../server/actions/customer";
import type { CheckoutProfile } from "../../server/booking";
import { Money, StarRating, StayImage, useClock, useShortDate } from "../common";
import { listSeparator } from "../../domain/locales";

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
  starRating?: number | null;
  checkInTime?: string;
  checkOutTime?: string;
  policy: { version: number; rules: { hoursBefore: number; refundPercent: number }[]; noShowRefundPercent: number; text: string | null };
  houseRules: string[];
};

type Hold = { holdId: string; expiresAt: string; quote: StayQuote; policyVersion: number; confirmationMode: "instant" | "request" };
type Person = { firstName: string; lastName: string };
type Draft = {
  /** Only what the customer typed over their account details. */
  buyer: { firstName: string; lastName: string; phone: string; email: string };
  companions: Person[];
  specialRequests: string;
  arrivalTime: string;
};

function newKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(18));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 32);
}

const NAME = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,79}$/u;

/**
 * Stay checkout, one screen (H05–H08). The customer is signed in, so the booking is made in their
 * name with their mobile — nothing to type unless they want another name on it. Companions, a note
 * to the host and arrival time are optional and folded away. One button sends the request (or goes
 * to payment for instant stays); the cancellation terms are right above it.
 *
 * The selection lives in the URL; what the customer typed lives in sessionStorage (never in a URL).
 * Idempotency keys are per selection, so a double tap returns the same hold / booking.
 */
export function StayBookingFlow({ ctx, signedIn, profile, initialQuote }: { ctx: BookingContext; signedIn: boolean; profile?: CheckoutProfile | null; initialQuote: StayQuote | null }) {
  const t = useTranslations("StayApp.book");
  const tErr = useTranslations("StayApp.errors");
  const tMeals = useTranslations("StayApp.meals");
  const tDetail = useTranslations("StayApp.detail");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const { calendar } = useToursPrefs();
  const short = useShortDate();
  const clock = useClock();
  const Back = ArrowLeft; // mirrored in RTL by globals.css
  const selKey = `stays:checkout:${ctx.ratePlanId}:${ctx.checkIn}:${ctx.checkOut}:${ctx.occupancy.rooms}:${ctx.occupancy.adults}:${ctx.occupancy.childAges.join(".")}`;
  const party = ctx.occupancy.adults + ctx.occupancy.childAges.length;
  const needsProfile = !profile?.firstName || !profile?.lastName || !profile?.phone;

  const [hold, setHold] = useState<Hold | null>(null);
  const [holdError, setHoldError] = useState<string | null>(null);
  const [expired, setExpired] = useState(false);
  const [draft, setDraft] = useState<Draft>({ buyer: { firstName: "", lastName: "", phone: "", email: "" }, companions: [], specialRequests: "", arrivalTime: "" });
  const [editBuyer, setEditBuyer] = useState(needsProfile);
  const [showCompanions, setShowCompanions] = useState(false);
  const [showNote, setShowNote] = useState(false);
  const [showPrice, setShowPrice] = useState(false);
  const [showPolicy, setShowPolicy] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<{ code: string; details?: Record<string, unknown> } | null>(null);
  const keys = useRef<{ hold: string; confirm: string } | null>(null);
  const restored = useRef(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(selKey);
      if (raw) {
        const saved = JSON.parse(raw) as { draft?: Draft; keys?: { hold: string; confirm: string } };
        if (saved.draft?.buyer && Array.isArray(saved.draft.companions)) {
          setDraft(saved.draft);
          if (saved.draft.companions.length) setShowCompanions(true);
          if (saved.draft.specialRequests || saved.draft.arrivalTime) setShowNote(true);
          if (Object.values(saved.draft.buyer).some(Boolean)) setEditBuyer(true);
        }
        if (saved.keys) keys.current = saved.keys;
      }
    } catch {
      /* storage unavailable: start fresh */
    }
    if (!keys.current) keys.current = { hold: newKey(), confirm: newKey() };
    restored.current = true;
  }, [selKey]);

  useEffect(() => {
    if (!restored.current) return;
    try {
      sessionStorage.setItem(selKey, JSON.stringify({ draft, keys: keys.current }));
    } catch {
      /* ignore */
    }
  }, [draft, selKey]);

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
      sessionStorage.setItem(selKey, JSON.stringify({ draft, keys: keys.current }));
    } catch {
      /* ignore */
    }
    setHold(null);
    void placeHold();
  }

  /** What will be sent as the booker: typed values over the account's. */
  const buyer = {
    firstName: draft.buyer.firstName.trim() || profile?.firstName || "",
    lastName: draft.buyer.lastName.trim() || profile?.lastName || "",
    phone: (draft.buyer.phone.trim() || profile?.phone || "").replace(/[\s-]/g, ""),
    email: draft.buyer.email.trim() || profile?.email || "",
  };

  function validate(): boolean {
    const e: Record<string, string> = {};
    // Names from the account are accepted as they are; typed ones follow the name rules.
    const typedFirst = draft.buyer.firstName.trim();
    const typedLast = draft.buyer.lastName.trim();
    if (typedFirst ? !NAME.test(typedFirst) : !buyer.firstName) e["buyer.firstName"] = typedFirst ? "invalid" : "required";
    if (typedLast ? !NAME.test(typedLast) : !buyer.lastName) e["buyer.lastName"] = typedLast ? "invalid" : "required";
    if (!/^\+?\d{7,15}$/.test(buyer.phone)) e["buyer.phone"] = buyer.phone ? "invalid" : "required";
    if (draft.buyer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.buyer.email.trim())) e["buyer.email"] = "invalid";
    draft.companions.forEach((c, i) => {
      const f = c.firstName.trim();
      const l = c.lastName.trim();
      if (!f && !l) return;
      if (!NAME.test(f)) e[`guests.${i}.firstName`] = f ? "invalid" : "required";
      if (!NAME.test(l)) e[`guests.${i}.lastName`] = l ? "invalid" : "required";
    });
    if (draft.specialRequests.length > 1000) e.specialRequests = "too_long";
    setFieldErrors(e);
    if (Object.keys(e).length) {
      if (Object.keys(e).some((k) => k.startsWith("buyer."))) setEditBuyer(true);
      if (Object.keys(e).some((k) => k.startsWith("guests."))) setShowCompanions(true);
      const first = Object.keys(e)[0];
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>(`[data-field="${first}"]`)?.focus());
      return false;
    }
    return true;
  }

  async function confirm() {
    if (!hold || !keys.current || submitting) return;
    if (!validate()) return;
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
      // Only what was typed; the server fills the rest from the account.
      buyer: {
        firstName: draft.buyer.firstName.trim() || null,
        lastName: draft.buyer.lastName.trim() || null,
        phone: draft.buyer.phone.trim() || null,
        email: draft.buyer.email.trim() || null,
      },
      guests: draft.companions.map((c) => ({ firstName: c.firstName.trim(), lastName: c.lastName.trim() })).filter((c) => c.firstName || c.lastName),
      specialRequests: draft.specialRequests.trim() || null,
      arrivalTime: draft.arrivalTime || null,
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
        if (Object.keys(fields).some((k) => k.startsWith("buyer"))) setEditBuyer(true);
        if (Object.keys(fields).some((k) => k.startsWith("guests"))) setShowCompanions(true);
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
  const freeRule = ctx.refundable ? ctx.policy.rules.find((r) => r.refundPercent >= 100) : null;
  const backHref = `/stays/${ctx.propertySlug}?in=${ctx.checkIn}&out=${ctx.checkOut}&adults=${ctx.occupancy.adults}&rooms=${ctx.occupancy.rooms}${children ? `&ages=${ctx.occupancy.childAges.join(",")}` : ""}`;

  const summary = (
    <section className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-slate-200" aria-labelledby="stay-summary-title" data-testid="stay-booking-summary">
      <div className="flex gap-3 p-3">
        <StayImage src={ctx.coverUrl} alt={ctx.propertyName} className="size-20 shrink-0 rounded-2xl" sizes="80px" />
        <div className="min-w-0">
          <h2 id="stay-summary-title" className="line-clamp-2 text-base leading-6 font-extrabold text-slate-900">
            {ctx.propertyName}
          </h2>
          {ctx.starRating ? <StarRating count={ctx.starRating} /> : null}
          <p className="mt-0.5 text-sm text-slate-600">
            {ctx.roomName}
            {listSeparator(locale)}
            {tMeals(ctx.mealPlan as never)}
          </p>
        </div>
      </div>
      <dl className="grid grid-cols-2 border-t border-slate-100 text-sm">
        <div className="border-e border-slate-100 p-3">
          <dt className="text-xs text-slate-500">{tDetail("checkIn")}</dt>
          <dd className="font-bold text-slate-900" data-testid="stay-summary-checkin">
            {short(ctx.checkIn)}
          </dd>
          {ctx.checkInTime ? <dd className="text-xs text-slate-500">{tDetail("checkInFrom", { time: clock(ctx.checkInTime) })}</dd> : null}
        </div>
        <div className="p-3">
          <dt className="text-xs text-slate-500">{tDetail("checkOut")}</dt>
          <dd className="font-bold text-slate-900" data-testid="stay-summary-checkout">
            {short(ctx.checkOut)}
          </dd>
          {ctx.checkOutTime ? <dd className="text-xs text-slate-500">{tDetail("checkOutUntil", { time: clock(ctx.checkOutTime) })}</dd> : null}
        </div>
      </dl>
      <p className="flex items-center gap-2 border-t border-slate-100 px-3 py-2.5 text-sm text-slate-700">
        <Users className="size-4 text-slate-500" aria-hidden="true" />
        {t("nightsRooms", { nights, rooms: ctx.occupancy.rooms })}
        {listSeparator(locale)}
        {t("guestsLine", { adults: ctx.occupancy.adults, children })}
      </p>
      {quote ? (
        <div className="border-t border-slate-100 px-3 py-3">
          <button type="button" onClick={() => setShowPrice((v) => !v)} aria-expanded={showPrice} className="flex w-full items-center justify-between gap-2 text-start" data-testid="stay-price-toggle">
            <span className="text-sm font-bold text-slate-900">{t("total")}</span>
            <span className="flex items-center gap-1">
              <Money amount={quote.total} currency={quote.currency} className="text-lg font-extrabold" testId="stay-booking-total" />
              <ChevronDown className={cn("size-4 text-slate-500 transition", showPrice && "rotate-180")} aria-hidden="true" />
            </span>
          </button>
          {showPrice ? (
            <div className="mt-2 space-y-1 rounded-2xl bg-slate-50 p-3 text-sm" data-testid="stay-price-lines">
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
              <p className="pt-1 text-xs text-slate-500">{t("chargedIn", { currency: quote.currency })}</p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );

  if (!signedIn) {
    return (
      <div className="mx-auto max-w-xl space-y-4 px-4 py-4">
        {summary}
        <section className="rounded-3xl bg-white p-5 text-center ring-1 ring-slate-200" data-testid="stay-booking-signin">
          <h1 className="text-lg font-extrabold">{t("signInTitle")}</h1>
          <p className="mt-1 text-sm text-slate-600">{t("signInText")}</p>
          <Link
            href={`/sign-in?redirectTo=${encodeURIComponent(`${pathname}${typeof window !== "undefined" ? window.location.search : ""}`)}`}
            className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-emerald-700 px-6 text-base font-bold text-white"
          >
            <LogIn className="size-5" aria-hidden="true" />
            {t("signIn")}
          </Link>
        </section>
      </div>
    );
  }

  const input = "mt-1 min-h-12 w-full rounded-2xl border bg-white px-3 text-base focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none";
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
  const setBuyer = (k: keyof Draft["buyer"]) => (v: string) => setDraft((d) => ({ ...d, buyer: { ...d.buyer, [k]: v } }));
  const maxCompanions = Math.max(0, Math.min(20, party - 1));
  const ctaLabel = submitting ? t("submitting") : ctx.confirmationMode === "request" ? t("confirmRequest") : (quote?.total ?? 0) <= 0 ? t("confirmFree") : t("confirmInstant");

  return (
    <div className="mx-auto max-w-xl px-4 pt-3 pb-40 md:pb-10 lg:max-w-5xl">
      <Link href={backHref} className="inline-flex min-h-11 items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900" data-testid="stay-book-back">
        <Back className="size-4" aria-hidden="true" />
        {t("back")}
      </Link>
      <h1 className="text-xl font-extrabold text-slate-900">{t("title")}</h1>

      <div className="mt-3 grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3 lg:order-2">
          {summary}
          {holdError ? (
            <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200" data-testid="stay-hold-error">
              <p className="font-semibold">{tErr.has(holdError as never) ? tErr(holdError as never) : tErr("generic")}</p>
              <Link href={backHref} className="mt-2 inline-flex min-h-11 items-center font-semibold underline">
                {t("restart")}
              </Link>
            </div>
          ) : !hold ? (
            <p className="flex items-center gap-2 px-1 text-sm text-slate-600" role="status" data-testid="stay-holding">
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
            <p className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-900" data-testid="stay-hold-active">
              <Clock className="size-4 shrink-0" aria-hidden="true" />
              {t("heldUntil", { rooms: ctx.occupancy.rooms, time: holdTime ?? "" })}
            </p>
          )}
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            void confirm();
          }}
          className="space-y-3 lg:order-1"
          data-testid="stay-details-form"
        >
          {/* The booker: the signed-in account. Nothing to type unless another name should be on it. */}
          <section className="rounded-3xl bg-white p-4 ring-1 ring-slate-200" aria-labelledby="stay-booker-title" data-testid="stay-booker">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <h2 id="stay-booker-title" className="text-xs text-slate-500">
                    {t("bookerTitle")}
                  </h2>
                  {!needsProfile ? (
                    <>
                      <p className="truncate font-bold text-slate-900" data-testid="stay-booker-name">
                        {buyer.firstName} {buyer.lastName}
                      </p>
                      <p className="text-sm text-slate-600" dir="ltr" data-testid="stay-booker-phone">
                        {buyer.phone}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-700">{t("bookerMissing")}</p>
                  )}
                </div>
              </div>
              {!needsProfile ? (
                <button type="button" onClick={() => setEditBuyer((v) => !v)} aria-expanded={editBuyer} className="inline-flex min-h-10 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-bold text-emerald-800 hover:bg-emerald-50" data-testid="stay-booker-edit">
                  <Pencil className="size-4" aria-hidden="true" />
                  {t("bookerEdit")}
                </button>
              ) : null}
            </div>
            {editBuyer ? (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {field("buyer.firstName", t("firstName"), draft.buyer.firstName, setBuyer("firstName"), { autoComplete: "given-name", placeholder: profile?.firstName || undefined })}
                {field("buyer.lastName", t("lastName"), draft.buyer.lastName, setBuyer("lastName"), { autoComplete: "family-name", placeholder: profile?.lastName || undefined })}
                {field("buyer.phone", t("phone"), draft.buyer.phone, setBuyer("phone"), { autoComplete: "tel", inputMode: "tel", dir: "ltr", placeholder: profile?.phone || undefined })}
                {field("buyer.email", t("email"), draft.buyer.email, setBuyer("email"), { autoComplete: "email", inputMode: "email", dir: "ltr", type: "email", placeholder: profile?.email || undefined })}
                <p className="text-xs text-slate-500 sm:col-span-2">{t("bookerHint")}</p>
              </div>
            ) : null}
          </section>

          {/* Optional companions. */}
          {maxCompanions > 0 ? (
            <section className="rounded-3xl bg-white ring-1 ring-slate-200" data-testid="stay-companions">
              <button type="button" onClick={() => setShowCompanions((v) => !v)} aria-expanded={showCompanions} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-start" data-testid="stay-companions-toggle">
                <span className="flex items-center gap-3">
                  <Users className="size-5 text-emerald-700" aria-hidden="true" />
                  <span>
                    <span className="block text-sm font-bold text-slate-900">{t("companionsTitle")}</span>
                    <span className="block text-xs text-slate-500">{t("companionsHint")}</span>
                  </span>
                </span>
                <ChevronDown className={cn("size-4 shrink-0 text-slate-500 transition", showCompanions && "rotate-180")} aria-hidden="true" />
              </button>
              {showCompanions ? (
                <div className="space-y-3 border-t border-slate-100 p-4">
                  {draft.companions.map((c, i) => (
                    <div key={i} className="grid grid-cols-[1fr_1fr_auto] items-end gap-2">
                      {field(`guests.${i}.firstName`, t("firstName"), c.firstName, (v) => setDraft((d) => ({ ...d, companions: d.companions.map((x, j) => (j === i ? { ...x, firstName: v } : x)) })))}
                      {field(`guests.${i}.lastName`, t("lastName"), c.lastName, (v) => setDraft((d) => ({ ...d, companions: d.companions.map((x, j) => (j === i ? { ...x, lastName: v } : x)) })))}
                      <button type="button" aria-label={t("removeCompanion", { n: i + 1 })} onClick={() => setDraft((d) => ({ ...d, companions: d.companions.filter((_, j) => j !== i) }))} className="mb-0.5 flex size-12 items-center justify-center rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-700">
                        <Trash2 className="size-4" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                  {draft.companions.length < maxCompanions ? (
                    <button type="button" onClick={() => setDraft((d) => ({ ...d, companions: [...d.companions, { firstName: "", lastName: "" }] }))} className="inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 text-sm font-bold text-emerald-800 ring-1 ring-emerald-300" data-testid="stay-companion-add">
                      <Plus className="size-4" aria-hidden="true" />
                      {t("addCompanion")}
                    </button>
                  ) : null}
                </div>
              ) : null}
            </section>
          ) : null}

          {/* Optional note to the host. */}
          <section className="rounded-3xl bg-white ring-1 ring-slate-200">
            <button type="button" onClick={() => setShowNote((v) => !v)} aria-expanded={showNote} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-start" data-testid="stay-note-toggle">
              <span className="flex items-center gap-3">
                <MessageSquareText className="size-5 text-emerald-700" aria-hidden="true" />
                <span>
                  <span className="block text-sm font-bold text-slate-900">{t("noteTitle")}</span>
                  <span className="block text-xs text-slate-500">{t("noteHint")}</span>
                </span>
              </span>
              <ChevronDown className={cn("size-4 shrink-0 text-slate-500 transition", showNote && "rotate-180")} aria-hidden="true" />
            </button>
            {showNote ? (
              <div className="space-y-3 border-t border-slate-100 p-4">
                <label className="block text-sm font-medium text-slate-800">
                  {t("specialRequests")}
                  <textarea
                    value={draft.specialRequests}
                    maxLength={1000}
                    rows={3}
                    onChange={(e) => setDraft((d) => ({ ...d, specialRequests: e.target.value }))}
                    className="mt-1 w-full rounded-2xl border border-slate-300 px-3 py-2 text-base"
                    data-testid="stay-field-specialRequests"
                  />
                  <span className="mt-1 block text-xs text-slate-500">{t("specialRequestsHint")}</span>
                </label>
                <label className="block text-sm font-medium text-slate-800">
                  {t("arrivalTime")}
                  <input type="time" value={draft.arrivalTime} onChange={(e) => setDraft((d) => ({ ...d, arrivalTime: e.target.value }))} dir="ltr" className="mt-1 block min-h-12 rounded-2xl border border-slate-300 px-3 text-base" data-testid="stay-field-arrivalTime" />
                </label>
              </div>
            ) : null}
          </section>

          {/* Cancellation in one line; the full terms one tap away. */}
          <section className="rounded-3xl bg-white p-4 ring-1 ring-slate-200" data-testid="stay-policy-summary">
            <p className={cn("flex items-start gap-2 text-sm font-semibold", freeRule ? "text-emerald-800" : "text-slate-800")}>
              <ShieldCheck className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
              {freeRule ? t("policyFree", { hours: freeRule.hoursBefore }) : ctx.refundable && ctx.policy.rules.length ? t("policyPartial") : t("policyNone")}
            </p>
            <button type="button" onClick={() => setShowPolicy((v) => !v)} aria-expanded={showPolicy} className="mt-1 min-h-10 text-sm font-bold text-emerald-800" data-testid="stay-policy-toggle">
              {showPolicy ? t("policyHide") : t("policyShow")}
            </button>
            {showPolicy ? (
              <div className="space-y-2 text-sm text-slate-700" data-testid="stay-policy-details">
                {ctx.refundable && ctx.policy.rules.length ? (
                  <ul className="space-y-1">
                    {ctx.policy.rules.map((r) => (
                      <li key={r.hoursBefore}>{tDetail("cancellationRule", { percent: r.refundPercent, hours: r.hoursBefore })}</li>
                    ))}
                    <li className="text-slate-500">{tDetail("cancellationLate")}</li>
                  </ul>
                ) : (
                  <p>{tDetail("cancellationNone")}</p>
                )}
                {ctx.policy.text ? <p className="whitespace-pre-line">{ctx.policy.text}</p> : null}
                {ctx.houseRules.length ? (
                  <ul className="list-inside list-disc space-y-1">
                    {ctx.houseRules.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}
            {ctx.confirmationMode === "request" ? (
              <p className="mt-3 flex items-start gap-2 rounded-2xl bg-sky-50 p-3 text-sm text-sky-900" data-testid="stay-request-note">
                <CalendarDays className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {t("requestNote", { hours: ctx.requestTimeoutHours })}
              </p>
            ) : null}
          </section>

          {submitError ? (
            <div role="alert" className="rounded-2xl bg-red-50 p-4 text-sm text-red-800 ring-1 ring-red-200" data-testid="stay-submit-error">
              {submitError.code === "price_changed" && hold ? (
                <PriceChanged total={hold.quote.total} currency={hold.quote.currency} />
              ) : submitError.code === "policy_changed" ? (
                t("policyChanged")
              ) : submitError.code === "invalid_guest_details" ? (
                t("checkFields")
              ) : tErr.has(submitError.code as never) ? (
                tErr(submitError.code as never)
              ) : (
                tErr("generic")
              )}
            </div>
          ) : null}

          {/* Mobile: the action stays under the thumb; larger screens: inline. */}
          <div className="fixed inset-x-0 bottom-[calc(3.5rem+env(safe-area-inset-bottom))] z-30 border-t border-slate-200 bg-white/95 px-4 py-2.5 shadow-[0_-4px_16px_rgba(15,23,42,0.06)] backdrop-blur md:static md:border-0 md:bg-transparent md:p-0 md:shadow-none" data-testid="stay-confirm-bar">
            <div className="mx-auto max-w-xl md:max-w-none">
              {quote ? (
                <div className="mb-1 flex items-baseline justify-between gap-2 md:hidden">
                  <span className="text-sm font-bold text-slate-900">{t("total")}</span>
                  <Money amount={quote.total} currency={quote.currency} className="text-base font-extrabold" />
                </div>
              ) : null}
              <p className="mb-1.5 text-[11px] text-slate-500">{t("consentImplicit")}</p>
              <button
                type="submit"
                disabled={!hold || expired || submitting}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-orange-500 px-6 text-base font-bold text-white hover:bg-orange-600 disabled:opacity-50"
                data-testid="stay-confirm"
              >
                {submitting || (!hold && !holdError) ? <Loader2 className="size-5 animate-spin" aria-hidden="true" /> : null}
                {ctaLabel}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function PriceChanged({ total, currency }: { total: number; currency: string }) {
  const t = useTranslations("StayApp.book");
  const locale = useLocale();
  return <>{t("priceChanged", { total: formatMoney(total, currency, locale) })}</>;
}

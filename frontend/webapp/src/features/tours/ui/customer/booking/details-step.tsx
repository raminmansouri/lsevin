"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { BookUser, Info } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

import { addressBookAction } from "../../../server/actions/customer";
import type { SavedTraveler } from "../../../server/actions/customer/state";
import { ToursErrorAlert, type ToursActionError } from "../../shared/error-alert";
import { formatNumber, intlLocale, regionName } from "../../shared/format";

import { COUNTRY_CODES, toAscii, type DraftBuyer, type DraftParticipant } from "./draft";

const NAME_RE = /^[\p{L}\p{M}][\p{L}\p{M} .'-]{0,79}$/u;

/** Same rules the server applies in confirmCheckout (validateParticipants), checked early for clear field errors. */
export function validateDetails(buyer: DraftBuyer, participants: DraftParticipant[]): Record<string, string> {
  const e: Record<string, string> = {};
  if (!buyer.firstName.trim()) e["buyer.firstName"] = "required";
  else if (!NAME_RE.test(buyer.firstName.trim())) e["buyer.firstName"] = "invalid";
  if (!buyer.lastName.trim()) e["buyer.lastName"] = "required";
  else if (!NAME_RE.test(buyer.lastName.trim())) e["buyer.lastName"] = "invalid";
  const phone = toAscii(buyer.phone).replace(/[\s-]/g, "");
  if (!phone) e["buyer.phone"] = "required";
  else if (!/^\+?\d{7,15}$/.test(phone)) e["buyer.phone"] = "invalid";
  if (buyer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim())) e["buyer.email"] = "invalid";
  participants.forEach((p, i) => {
    if (!p.firstName.trim()) e[`participants.${i}.firstName`] = "required";
    else if (!NAME_RE.test(p.firstName.trim())) e[`participants.${i}.firstName`] = "invalid";
    if (!p.lastName.trim()) e[`participants.${i}.lastName`] = "required";
    else if (!NAME_RE.test(p.lastName.trim())) e[`participants.${i}.lastName`] = "invalid";
    if (p.age && (!/^\d{1,3}$/.test(p.age) || Number(p.age) > 120)) e[`participants.${i}.age`] = "invalid";
    if (p.assistanceRequest.length > 500) e[`participants.${i}.assistanceRequest`] = "invalid";
  });
  return e;
}

const inputCls = (invalid: boolean) =>
  cn(
    "min-h-12 w-full rounded-xl border bg-white px-3 text-[15px] focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none",
    invalid ? "border-red-500" : "border-slate-300",
  );

function TextField({
  id,
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  hint,
  dir,
  inputMode,
  required,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  hint?: string;
  dir?: "ltr" | "rtl" | "auto";
  inputMode?: "text" | "tel" | "email" | "numeric";
  required?: boolean;
}) {
  const t = useTranslations("TourApp.booking.details");
  const errId = `${id}-err`;
  const hintId = `${id}-hint`;
  return (
    <div className="space-y-1">
      <label htmlFor={id} className="text-sm font-medium text-slate-800">
        {label}
        {required ? <span aria-hidden="true" className="text-red-600"> *</span> : null}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        dir={dir}
        inputMode={inputMode}
        autoComplete={autoComplete}
        required={required}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={[error ? errId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined}
        onChange={(e) => onChange(e.target.value)}
        className={inputCls(Boolean(error))}
      />
      {hint ? (
        <p id={hintId} className="text-xs text-slate-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errId} className="text-xs font-medium text-red-700">
          {error === "required" ? t("required") : t("invalid")}
        </p>
      ) : null}
    </div>
  );
}

export function DetailsStep({
  buyer,
  participants,
  errors,
  onBuyer,
  onParticipants,
}: {
  buyer: DraftBuyer;
  participants: DraftParticipant[];
  errors: Record<string, string>;
  onBuyer: (b: DraftBuyer) => void;
  onParticipants: (p: DraftParticipant[]) => void;
}) {
  const t = useTranslations("TourApp.booking.details");
  const tShared = useTranslations("TourShared.traveler");
  const locale = useLocale();
  const ids = useId();
  const [book, setBook] = useState<{ open: boolean; forIndex: number; items: SavedTraveler[] | null; error: ToursActionError | null }>({ open: false, forIndex: 0, items: null, error: null });
  const [pending, start] = useTransition();
  const countries = useMemo(() => {
    const collator = new Intl.Collator(intlLocale(locale));
    return COUNTRY_CODES.map((c) => ({ code: c, name: regionName(c, locale) })).sort((a, b) => collator.compare(a.name, b.name));
  }, [locale]);

  const setP = (i: number, patch: Partial<DraftParticipant>) => onParticipants(participants.map((p, j) => (j === i ? { ...p, ...patch } : p)));

  function openBook(i: number) {
    setBook((b) => ({ ...b, open: true, forIndex: i }));
    if (book.items) return;
    start(async () => {
      const res = await addressBookAction().catch(() => null);
      setBook((b) => (res?.ok ? { ...b, items: res.data, error: null } : { ...b, items: [], error: res && !res.ok ? res.error : { kind: "infrastructure", code: "service_unavailable" } }));
    });
  }

  return (
    <div className="mt-4 space-y-6" data-testid="details-step">
      <section aria-labelledby="buyer-title" className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <h2 id="buyer-title" className="text-base font-bold text-slate-900">
          {t("buyerTitle")}
        </h2>
        <p className="flex items-start gap-2 rounded-xl bg-sky-50 p-3 text-xs text-sky-900">
          <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          {t("buyerNote")}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField id={`${ids}-bf`} label={t("firstName")} value={buyer.firstName} onChange={(v) => onBuyer({ ...buyer, firstName: v })} error={errors["buyer.firstName"]} autoComplete="given-name" required />
          <TextField id={`${ids}-bl`} label={t("lastName")} value={buyer.lastName} onChange={(v) => onBuyer({ ...buyer, lastName: v })} error={errors["buyer.lastName"]} autoComplete="family-name" required />
          <TextField id={`${ids}-bp`} label={t("phone")} value={buyer.phone} onChange={(v) => onBuyer({ ...buyer, phone: v })} error={errors["buyer.phone"]} type="tel" inputMode="tel" dir="ltr" autoComplete="tel" hint={t("phoneHint")} required />
          <TextField id={`${ids}-be`} label={t("email")} value={buyer.email} onChange={(v) => onBuyer({ ...buyer, email: v })} error={errors["buyer.email"]} type="email" inputMode="email" dir="ltr" autoComplete="email" />
        </div>
      </section>

      <section aria-labelledby="travelers-details-title" className="space-y-4">
        <h2 id="travelers-details-title" className="text-base font-bold text-slate-900">
          {t("travelersTitle")}
        </h2>
        {errors.participants ? <ToursErrorAlert message={t("fixErrors")} /> : null}
        {participants.map((p, i) => {
          const base = `participants.${i}`;
          return (
            <fieldset key={`${p.travelerClass}-${i}`} className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="participant">
              <legend className="sr-only">{t("traveler", { index: formatNumber(i + 1, locale), class: tShared(p.travelerClass) })}</legend>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-bold text-slate-900" aria-hidden="true">
                  {t("traveler", { index: formatNumber(i + 1, locale), class: tShared(p.travelerClass) })}
                </p>
                <div className="flex gap-1">
                  {i === 0 ? (
                    <button type="button" onClick={() => setP(0, { firstName: buyer.firstName, lastName: buyer.lastName })} className="min-h-11 rounded-full px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-50">
                      {t("sameAsBuyer")}
                    </button>
                  ) : null}
                  <button type="button" onClick={() => openBook(i)} className="inline-flex min-h-11 items-center gap-1 rounded-full px-3 text-xs font-medium text-emerald-700 hover:bg-emerald-50" data-testid="address-book">
                    <BookUser className="size-4" aria-hidden="true" />
                    {t("addressBook")}
                  </button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <TextField id={`${ids}-${i}-f`} label={t("firstName")} value={p.firstName} onChange={(v) => setP(i, { firstName: v })} error={errors[`${base}.firstName`]} required />
                <TextField id={`${ids}-${i}-l`} label={t("lastName")} value={p.lastName} onChange={(v) => setP(i, { lastName: v })} error={errors[`${base}.lastName`]} required />
                <div className="space-y-1">
                  <label htmlFor={`${ids}-${i}-n`} className="text-sm font-medium text-slate-800">
                    {t("nationality")}
                  </label>
                  <select id={`${ids}-${i}-n`} value={p.nationality} onChange={(e) => setP(i, { nationality: e.target.value })} className={inputCls(Boolean(errors[`${base}.nationality`]))} aria-invalid={errors[`${base}.nationality`] ? "true" : undefined}>
                    <option value="">{t("chooseNationality")}</option>
                    {countries.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <TextField id={`${ids}-${i}-a`} label={t("age")} value={p.age} onChange={(v) => setP(i, { age: toAscii(v).replace(/\D/g, "").slice(0, 3) })} error={errors[`${base}.age`]} inputMode="numeric" />
              </div>
              <label className="flex min-h-11 items-center gap-2 text-sm text-slate-700">
                <input type="checkbox" checked={p.isForeign} onChange={(e) => setP(i, { isForeign: e.target.checked })} className="size-5 accent-emerald-700" />
                {t("foreign")}
              </label>
              <div className="space-y-1">
                <label htmlFor={`${ids}-${i}-as`} className="text-sm font-medium text-slate-800">
                  {t("assistance")}
                </label>
                <textarea
                  id={`${ids}-${i}-as`}
                  value={p.assistanceRequest}
                  onChange={(e) => setP(i, { assistanceRequest: e.target.value })}
                  maxLength={500}
                  rows={2}
                  aria-describedby={`${ids}-${i}-as-note`}
                  className="w-full rounded-xl border border-slate-300 p-3 text-sm focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
                />
                <p id={`${ids}-${i}-as-note`} className="text-xs text-slate-500">
                  {t("assistancePrivacy")}
                </p>
              </div>
            </fieldset>
          );
        })}
      </section>

      <Dialog open={book.open} onOpenChange={(open) => setBook((b) => ({ ...b, open }))}>
        <DialogContent>
          <DialogTitle>{t("addressBookTitle")}</DialogTitle>
          <DialogDescription>{t("addressBookConsent")}</DialogDescription>
          {pending && !book.items ? <p role="status" className="text-sm text-slate-500">…</p> : null}
          <ToursErrorAlert error={book.error} />
          {book.items && book.items.length === 0 && !book.error ? <p className="text-sm text-slate-600">{t("addressBookEmpty")}</p> : null}
          <ul className="max-h-72 space-y-2 overflow-y-auto" data-latin-digits="">
            {(book.items ?? []).map((s) => (
              <li key={`${s.firstName}-${s.lastName}`} className="flex items-center justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <span className="text-sm">
                  <bdi>
                    {s.firstName} {s.lastName}
                  </bdi>
                  {s.nationality ? <span className="ms-1 text-xs text-slate-500">· {regionName(s.nationality, locale)}</span> : null}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setP(book.forIndex, { firstName: s.firstName, lastName: s.lastName, nationality: s.nationality ?? "" });
                    setBook((b) => ({ ...b, open: false }));
                  }}
                  className="min-h-11 rounded-lg bg-emerald-700 px-3 text-sm font-semibold text-white"
                >
                  {t("use")}
                </button>
              </li>
            ))}
          </ul>
        </DialogContent>
      </Dialog>
    </div>
  );
}

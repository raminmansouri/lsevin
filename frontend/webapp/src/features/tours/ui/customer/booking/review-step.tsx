"use client";

import { CalendarDays, ChevronDown, Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import type { Quote } from "../../../domain/pricing";
import type { DepartureView, TourDetail } from "../../../server/platform/catalog";
import { Bdi } from "../../shared/bidi";
import { formatClock, formatNumber, languageName, regionName } from "../../shared/format";
import { LocalizedText } from "../../shared/localized-text";
import { TourImage, TourPrice, useTourDateFormat } from "../common";

import type { BookingDraft, BookingStep } from "./draft";
import { PriceSummary } from "./price-summary";

/**
 * Final review (booking_process_4.png, C-090, C-091): summary, invoice, contact
 * and travelers, collapsible cancellation rules of the exact policy version
 * being accepted (with the language it is shown in), important notes, and an
 * explicit acceptance checkbox.
 */
export function ReviewStep({
  detail,
  departure,
  draft,
  quote,
  holdTotal,
  policyVersion,
  accepted,
  onAccept,
  onEdit,
}: {
  detail: TourDetail;
  departure: DepartureView | null;
  draft: BookingDraft;
  quote: Quote | null;
  holdTotal: number | null;
  policyVersion: number;
  accepted: number | null;
  onAccept: (v: number | null) => void;
  onEdit: (s: BookingStep) => void;
}) {
  const t = useTranslations("TourApp.booking");
  const td = useTranslations("TourApp.detail");
  const tShared = useTranslations("TourShared");
  const locale = useLocale();
  const fmt = useTourDateFormat();
  const policy = detail.policy;
  const cover = detail.media[0];
  const policyLocale = policy?.text.cancellation?.locale ?? detail.sourceLocale;

  return (
    <div className="mt-4 space-y-4" data-testid="review-step">
      <section aria-labelledby="review-summary" className="overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
        <TourImage src={cover?.url} alt={cover?.alt ?? detail.text.title?.value ?? ""} className="h-32 w-full" />
        <div className="space-y-2 p-4">
          <h2 id="review-summary" className="text-base font-bold text-slate-900">
            <LocalizedText text={detail.text.title} />
          </h2>
          {departure ? (
            <div className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 p-3 text-sm" data-testid="review-departure">
              <span className="flex items-start gap-2">
                <CalendarDays className="mt-0.5 size-4 text-emerald-700" aria-hidden="true" />
                <span>
                  <span className="block font-semibold text-slate-900" suppressHydrationWarning>
                    {fmt.date(departure.localDate, "full")}
                  </span>
                  <span className="text-slate-600">{departure.localTime ? formatClock(departure.localTime, locale) : t("timeTbc")}</span>
                  <span className="block text-xs text-slate-500" suppressHydrationWarning>
                    {t("review.calendarNote", { calendar: fmt.calendarName(), zone: departure.timezone })}
                  </span>
                </span>
              </span>
              <button type="button" onClick={() => onEdit("date")} className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-emerald-700">
                <Pencil className="size-3.5" aria-hidden="true" />
                {t("edit")}
              </button>
            </div>
          ) : null}
        </div>
      </section>

      <PriceSummary quote={quote} addons={detail.addons} />
      {holdTotal != null && quote && Math.abs(quote.total - holdTotal) > 0.0001 ? (
        <p className="text-xs text-amber-800">
          {t("summary.total")}: <TourPrice amount={holdTotal} currency={detail.facts.currency} />
        </p>
      ) : null}

      <section aria-labelledby="review-buyer" className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
        <div className="flex items-center justify-between">
          <h2 id="review-buyer" className="text-sm font-bold text-slate-900">
            {t("review.buyer")}
          </h2>
          <button type="button" onClick={() => onEdit("details")} className="inline-flex min-h-11 items-center gap-1 text-xs font-medium text-emerald-700">
            <Pencil className="size-3.5" aria-hidden="true" />
            {t("edit")}
          </button>
        </div>
        <p className="text-sm text-slate-800">
          <Bdi>
            {draft.buyer.firstName} {draft.buyer.lastName}
          </Bdi>
        </p>
        <p className="text-sm text-slate-600">
          <Bdi dir="ltr">{draft.buyer.phone}</Bdi>
          {draft.buyer.email ? (
            <>
              {" · "}
              <Bdi dir="ltr">{draft.buyer.email}</Bdi>
            </>
          ) : null}
        </p>
        <h3 className="mt-3 text-sm font-bold text-slate-900">{t("review.travelers")}</h3>
        <ol className="mt-1 space-y-1 text-sm text-slate-700" data-testid="review-travelers">
          {draft.participants.map((p, i) => (
            <li key={i}>
              {formatNumber(i + 1, locale)}.{" "}
              <Bdi>
                {p.firstName} {p.lastName}
              </Bdi>{" "}
              <span className="text-xs text-slate-500">
                ({tShared(`traveler.${p.travelerClass}`)}
                {p.nationality ? ` · ${regionName(p.nationality, locale)}` : ""})
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section aria-labelledby="review-policy" className="rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="review-policy">
        <h2 id="review-policy" className="text-sm font-bold text-slate-900">
          {t("review.policy")}
        </h2>
        <p className="text-xs text-slate-500">{t("review.policyVersion", { version: formatNumber(policyVersion, locale), language: languageName(policyLocale, locale) })}</p>
        {policy ? (
          <details className="group mt-2" open>
            <summary className="flex min-h-11 cursor-pointer items-center justify-between text-sm font-medium text-slate-800">
              {td("policies.cancellation")}
              <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <ul className="space-y-1 text-sm text-slate-700">
              {[...policy.cancellationRules]
                .sort((a, b) => b.hoursBefore - a.hoursBefore)
                .map((r) => (
                  <li key={r.hoursBefore} className="flex justify-between gap-3">
                    <span>{td("policies.rule", { hours: r.hoursBefore })}</span>
                    <span className="font-semibold">{td("policies.refund", { percent: formatNumber(r.refundPercent, locale) })}</span>
                  </li>
                ))}
              <li className="text-slate-500">{td("policies.laterNoRefund")}</li>
              <li>{td("policies.noShow", { percent: formatNumber(policy.noShowRefundPercent, locale) })}</li>
            </ul>
            {policy.text.cancellation ? <LocalizedText text={policy.text.cancellation} as="p" className="mt-2 text-sm leading-6 text-slate-700" /> : null}
          </details>
        ) : null}
        {policy?.text.rules ? (
          <details className="group mt-1">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between text-sm font-medium text-slate-800">
              {td("policies.rules")}
              <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <LocalizedText text={policy.text.rules} as="p" className="text-sm leading-6 text-slate-700" />
          </details>
        ) : null}
        {policy ? (
          <details className="group mt-1">
            <summary className="flex min-h-11 cursor-pointer items-center justify-between text-sm font-medium text-slate-800">
              {td("policies.weather")}
              <ChevronDown className="size-4 transition group-open:rotate-180" aria-hidden="true" />
            </summary>
            <p className="text-sm text-slate-700">{td.has(`policies.weatherPolicies.${policy.weatherPolicy}`) ? td(`policies.weatherPolicies.${policy.weatherPolicy}`) : policy.weatherPolicy}</p>
          </details>
        ) : null}
      </section>

      {detail.text.booking_instructions || detail.text.safety_notes ? (
        <section aria-labelledby="review-important" className="rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <h2 id="review-important" className="text-sm font-bold text-slate-900">
            {t("review.important")}
          </h2>
          {detail.text.booking_instructions ? <LocalizedText text={detail.text.booking_instructions} as="p" className="mt-1 text-sm leading-6 text-slate-700" /> : null}
          {detail.text.safety_notes ? <LocalizedText text={detail.text.safety_notes} as="p" className="mt-1 text-sm leading-6 text-slate-700" /> : null}
        </section>
      ) : null}

      {draft.hold?.confirmationMode === "request" ? <p className="rounded-xl bg-sky-50 p-3 text-sm text-sky-900">{t("review.requestNote")}</p> : null}

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white p-4 text-sm text-slate-800 ring-1 ring-slate-200" data-testid="accept-terms">
        <input
          type="checkbox"
          checked={accepted === policyVersion}
          onChange={(e) => onAccept(e.target.checked ? policyVersion : null)}
          className="mt-0.5 size-5 shrink-0 accent-emerald-700"
        />
        {t("review.accept", { version: formatNumber(policyVersion, locale) })}
      </label>
    </div>
  );
}

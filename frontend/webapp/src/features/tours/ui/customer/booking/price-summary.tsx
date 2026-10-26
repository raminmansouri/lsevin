"use client";

import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import type { Quote } from "../../../domain/pricing";
import type { TourDetail } from "../../../server/platform/catalog";
import { ToursErrorAlert, type ToursActionError } from "../../shared/error-alert";
import { formatNumber } from "../../shared/format";
import { TourPrice } from "../common";

/**
 * Itemized fare (C-086, S-032, booking_process_3.png): travelers × unit price,
 * date adjustments, extras, fees, discounts and the total — exactly the lines the
 * server quoted. The total is announced politely when it changes.
 */
export function PriceSummary({
  quote,
  loading,
  error,
  addons,
  className,
}: {
  quote: Quote | null;
  loading?: boolean;
  error?: ToursActionError | null;
  addons: TourDetail["addons"];
  className?: string;
}) {
  const t = useTranslations("TourApp.booking.summary");
  const tShared = useTranslations("TourShared.traveler");
  const locale = useLocale();
  const label = (line: Quote["lines"][number]) => {
    switch (line.kind) {
      case "traveler":
        return t("traveler", { class: tShared.has(line.code) ? tShared(line.code) : line.code, count: formatNumber(line.quantity, locale) });
      case "addon": {
        const a = addons.find((x) => x.code === line.code);
        return t("addon", { name: a?.label?.value ?? line.code, count: formatNumber(line.quantity, locale) });
      }
      default:
        return t(line.kind);
    }
  };
  return (
    <section aria-labelledby="price-summary-title" className={cn("rounded-2xl bg-white p-4 ring-1 ring-slate-200", className)} data-testid="price-summary" aria-busy={loading}>
      <h3 id="price-summary-title" className="text-sm font-bold text-slate-900">
        {t("title")}
      </h3>
      {error ? <ToursErrorAlert error={error} className="mt-2" testId="quote-error" /> : null}
      {quote ? (
        <>
          <dl className={cn("mt-3 space-y-2 rounded-xl bg-sky-50/70 p-3 text-sm", loading && "opacity-60")}>
            {quote.lines.map((line, i) => (
              <div key={`${line.kind}-${line.code}-${i}`} className="flex items-baseline justify-between gap-3" data-testid="price-line" data-kind={line.kind}>
                <dt className="text-slate-700">
                  {label(line)}
                  {line.kind === "traveler" || line.kind === "addon" ? (
                    <span className="ms-1 text-xs text-slate-500">
                      (<TourPrice amount={line.unitAmount} currency={quote.currency} />)
                    </span>
                  ) : null}
                </dt>
                <dd className="font-medium text-slate-900">
                  <TourPrice amount={line.amount} currency={quote.currency} />
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-slate-100 pt-3" aria-live="polite" aria-atomic="true">
            <span className="text-base font-bold text-slate-900">{t("total")}</span>
            <span className="text-end">
              <TourPrice amount={quote.total} currency={quote.currency} className="text-xl font-extrabold text-slate-900" testId="quote-total" />
              <span className="block text-xs text-slate-500">{t("seats", { count: quote.seats })}</span>
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">{t("liveNote")}</p>
        </>
      ) : loading ? (
        <p className="mt-2 text-sm text-slate-500" role="status">
          {t("updating")}
        </p>
      ) : null}
    </section>
  );
}

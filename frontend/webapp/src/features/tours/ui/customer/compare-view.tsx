"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link } from "@/i18n/navigation";

import type { TourDetail } from "../../server/platform/catalog";
import { formatNumber, languageName } from "../shared/format";
import { LocalizedText } from "../shared/localized-text";

import { FromPrice } from "./common";
import { durationLabel } from "./tour-card";

/** Comparison of up to three tours on facts that exist in the data (C-049). */
export function CompareView({ tours }: { tours: TourDetail[] }) {
  const t = useTranslations("TourApp");
  const locale = useLocale();
  if (tours.length === 0) {
    return (
      <div className="px-4 pt-4 sm:px-6">
        <h1 className="text-2xl font-bold">{t("compare.title")}</h1>
        <p className="mt-4 text-sm text-slate-600">{t("compare.empty")}</p>
        <Link href="/tours/wishlist" className="mt-4 inline-flex min-h-11 items-center rounded-full bg-emerald-700 px-4 text-sm font-semibold text-white">
          {t("wishlist.title")}
        </Link>
      </div>
    );
  }
  const yes = (v: boolean) => (v ? t("compare.yes") : t("compare.no"));
  const rows: { label: string; cell: (d: TourDetail) => React.ReactNode }[] = [
    { label: t("compare.price"), cell: (d) => <FromPrice amount={d.fromPrice} currency={d.facts.currency} basis={d.fromPriceBasis} /> },
    { label: t("compare.duration"), cell: (d) => durationLabel((k, v) => t(`card.${k}`, v), d.facts) },
    { label: t("compare.rating"), cell: (d) => (d.rating.count > 0 && d.rating.avg != null ? t("card.rating", { rating: formatNumber(d.rating.avg, locale, { maximumFractionDigits: 1 }), count: d.rating.count }) : t("compare.noRating")) },
    { label: t("compare.difficulty"), cell: (d) => (d.facts.difficulty ? (t.has(`detail.difficulty.${d.facts.difficulty}`) ? t(`detail.difficulty.${d.facts.difficulty}`) : d.facts.difficulty) : t("common.notProvided")) },
    { label: t("compare.confirmation"), cell: (d) => (d.facts.confirmationMode === "instant" ? t("card.instant") : t("card.request")) },
    { label: t("compare.languages"), cell: (d) => d.facts.guideLanguages.map((l) => languageName(l, locale)).join(", ") },
    { label: t("explore.fields.accessible"), cell: (d) => yes(d.facts.accessibility.wheelchair) },
    { label: t("explore.fields.family"), cell: (d) => yes(d.facts.accessibility.family) },
  ];
  return (
    <div className="px-4 pt-4 sm:px-6" data-testid="compare">
      <h1 className="text-2xl font-bold text-slate-900">{t("compare.title")}</h1>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[480px] border-separate border-spacing-0 rounded-2xl bg-white text-sm ring-1 ring-slate-200">
          <thead>
            <tr>
              <th scope="col" className="sr-only">
                {t("compare.title")}
              </th>
              {tours.map((d) => (
                <th key={d.id} scope="col" className="p-3 text-start align-top font-bold">
                  <Link href={`/tours/t/${d.slug}`} className="text-emerald-800 underline-offset-2 hover:underline">
                    <LocalizedText text={d.text.title} />
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label}>
                <th scope="row" className="border-t border-slate-100 p-3 text-start text-xs font-medium text-slate-500">
                  {r.label}
                </th>
                {tours.map((d) => (
                  <td key={d.id} className="border-t border-slate-100 p-3 align-top">
                    {r.cell(d)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

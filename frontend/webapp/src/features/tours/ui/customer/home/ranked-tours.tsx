"use client";

import { ArrowLeft, ArrowRight, Eye, Ticket, TrendingUp, Trophy } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import type { TaxonomyTerm } from "../../../server/actions/customer/state";
import type { RankedTour } from "../../../server/platform/catalog";
import { formatNumber } from "../../shared/format";
import { TourCard } from "../tour-card";

export type TourRankings = {
  mostViewed: RankedTour[];
  bestSellingMonth: RankedTour[];
  bestSellingAll: RankedTour[];
};

type Period = "month" | "all";

/**
 * "Most viewed tours" and "Best-selling tours" on the tours home: four ranked
 * cards each, from real counts (tour.tours.view_count, sold tour.bookings).
 * A row with no data is not rendered. `variant` picks the mobile/tablet look
 * (rail of cards, like Recently Viewed) or the desktop one (4-column grid).
 */
export function RankedTours({
  rankings,
  categories,
  saved,
  variant,
}: {
  rankings: TourRankings;
  categories: TaxonomyTerm[];
  saved: Set<string>;
  variant: "mobile" | "desktop";
}) {
  const t = useTranslations("TourApp");
  const locale = useLocale();
  const [period, setPeriod] = useState<Period>(rankings.bestSellingMonth.length > 0 ? "month" : "all");
  const labels = new Map(categories.map((c) => [c.code, c.label]));
  const categoryOf = (codes: string[]) => codes.map((c) => labels.get(c)).find(Boolean) ?? null;
  const selling = period === "month" ? rankings.bestSellingMonth : rankings.bestSellingAll;

  const rows: {
    key: "viewed" | "selling";
    title: string;
    icon: typeof Eye;
    items: RankedTour[];
    stat: (n: number) => React.ReactNode;
    toggle: boolean;
  }[] = [
    {
      key: "viewed",
      title: t("home.rankings.mostViewed"),
      icon: TrendingUp,
      items: rankings.mostViewed,
      stat: (n) => (
        <>
          <Eye className="size-3" aria-hidden="true" />
          {t("home.rankings.views", { count: n, n: formatNumber(n, locale) })}
        </>
      ),
      toggle: false,
    },
    {
      key: "selling",
      title: t("home.rankings.bestSelling"),
      icon: Trophy,
      items: selling,
      stat: (n) => (
        <>
          <Ticket className="size-3" aria-hidden="true" />
          {t("home.rankings.bookings", { count: n, n: formatNumber(n, locale) })}
        </>
      ),
      toggle: true,
    },
  ];

  const desktop = variant === "desktop";

  return (
    <>
      {rows.map((row) => {
        // Hide the row when there is nothing to rank (for best-selling: not even all-time).
        if (row.key === "viewed" ? row.items.length === 0 : rankings.bestSellingAll.length === 0) return null;
        const Icon = row.icon;
        const headingId = `ranking-${row.key}-${variant}`;
        const seeAll = (
          <Link
            href="/tours/explore?sort=popularity"
            className={cn(
              "inline-flex shrink-0 items-center gap-1 text-sm focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none",
              desktop ? "group font-bold text-[#083f30] transition hover:text-[#8c6b2c]" : "min-h-11 rounded-full px-2 font-medium text-emerald-700 hover:bg-emerald-50",
            )}
          >
            {t("home.rankings.seeAll")}
            {desktop ? (
              <ArrowLeft size={15} className="transition-transform group-hover:-translate-x-1 ltr:rotate-180" aria-hidden="true" />
            ) : (
              <ArrowRight className="size-4" aria-hidden="true" /> /* mirrored in RTL by globals.css */
            )}
          </Link>
        );
        const toggle = row.toggle ? (
          <div role="group" aria-label={t("home.rankings.period")} className={cn("inline-flex rounded-full p-0.5", desktop ? "bg-[#f3ead6] ring-1 ring-[#e7dcc4]" : "bg-slate-100")}>
            {(["month", "all"] as const).map((p) => {
              const disabled = p === "month" && rankings.bestSellingMonth.length === 0;
              return (
                <button
                  key={p}
                  type="button"
                  aria-pressed={period === p}
                  disabled={disabled}
                  title={disabled ? t("home.rankings.monthEmpty") : undefined}
                  onClick={() => setPeriod(p)}
                  data-testid={`ranking-period-${p}`}
                  className={cn(
                    "min-h-8 rounded-full px-3 text-xs font-bold transition focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-40",
                    period === p
                      ? desktop
                        ? "bg-[#083f30] text-white shadow-sm"
                        : "bg-white text-emerald-800 shadow-sm"
                      : desktop
                        ? "text-[#6b6150] hover:text-[#083f30]"
                        : "text-slate-600 hover:text-slate-900",
                  )}
                >
                  {t(`home.rankings.${p}`)}
                </button>
              );
            })}
          </div>
        ) : null;

        const cards = row.items.map((item, index) => (
          <TourCard
            key={item.card.id}
            card={item.card}
            saved={saved.has(item.card.id)}
            rank={index + 1}
            stat={row.stat(item.count)}
            categoryLabel={categoryOf(item.card.categories)}
            testId={`ranked-card-${row.key}`}
            className="h-full"
          />
        ));

        return (
          <section key={row.key} aria-labelledby={headingId} data-testid={`ranking-${row.key}`}>
            {desktop ? (
              <div className="mb-7 flex items-end justify-between gap-6">
                <div className="flex flex-wrap items-center gap-4">
                  <h2 id={headingId} className="flex items-center gap-3 text-[28px] font-black text-[#0e1a16]">
                    <Icon className="h-6 w-6 text-[#c9a55a]" aria-hidden="true" />
                    {row.title}
                  </h2>
                  {toggle}
                </div>
                {seeAll}
              </div>
            ) : (
              <div className="mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 sm:px-6">
                <h2 id={headingId} className="flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Icon className="size-5 text-emerald-700" aria-hidden="true" />
                  {row.title}
                </h2>
                <div className="flex items-center gap-2">
                  {toggle}
                  {seeAll}
                </div>
              </div>
            )}
            {desktop ? (
              <div className="grid grid-cols-4 gap-6">{cards}</div>
            ) : (
              <div role="list" aria-label={row.title} className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] sm:px-6">
                {cards.map((card, index) => (
                  <div role="listitem" key={row.items[index].card.id} className="w-[78%] max-w-xs shrink-0 snap-start sm:w-72">
                    {card}
                  </div>
                ))}
              </div>
            )}
          </section>
        );
      })}
    </>
  );
}

"use client";

import { useState } from "react";
import { BedDouble, MessageSquareQuote, Star, ThumbsUp } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { useToursPrefs } from "@/features/tours/ui/customer/prefs-context";
import { intlLocale } from "@/features/tours/ui/shared/format";
import { cn } from "@/lib/utils";

import type { PropertyDetail, ReviewItem } from "../../types";
import { useNumber, useStayDate } from "../common";

/** Scores are 1–5 in the database; shown out of 5 like the rest of the site. */
export function ReviewCard({ review: r, compact = false }: { review: ReviewItem; compact?: boolean }) {
  const t = useTranslations("StayApp.detail");
  const num = useNumber();
  const fmt = useStayDate();
  const locale = useLocale();
  const { calendar } = useToursPrefs();
  const monthYear = (ym: string) =>
    new Intl.DateTimeFormat(intlLocale(locale), { calendar, month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-15T12:00:00Z`));
  const [open, setOpen] = useState(false);
  const long = (r.body?.length ?? 0) > 260;
  return (
    <li className={cn("rounded-2xl bg-white ring-1 ring-slate-200", compact ? "p-3" : "p-4")} data-testid="stay-review">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-slate-900">{r.authorName || t("guest")}</p>
          <p className="text-xs text-slate-500">
            {r.stayMonth ? t("stayed", { month: monthYear(r.stayMonth) }) : fmt(r.createdAt.slice(0, 10))}
            {r.nights ? ` ، ${t("reviewNights", { count: r.nights })}` : ""}
          </p>
        </div>
        <span className="inline-flex shrink-0 items-center gap-0.5 rounded-md bg-emerald-700 px-1.5 py-0.5 text-xs font-bold text-white">
          <Star className="size-3 fill-current" aria-hidden="true" />
          {num(r.rating)}
        </span>
      </div>
      {r.roomName && !compact ? (
        <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          <BedDouble className="size-3.5" aria-hidden="true" />
          {r.roomName}
        </p>
      ) : null}
      {r.body ? (
        <p className={cn("mt-2 text-sm leading-6 whitespace-pre-line text-slate-700", !open && long && "line-clamp-4")} dir="auto">
          {r.body}
        </p>
      ) : null}
      {long ? (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-1 min-h-9 text-xs font-bold text-emerald-800">
          {open ? t("readLess") : t("readMore")}
        </button>
      ) : null}
      {r.providerReply ? (
        <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
          <p className="text-xs font-semibold text-slate-600">{t("providerReply")}</p>
          <p className="mt-1 whitespace-pre-line text-slate-700" dir="auto">
            {r.providerReply}
          </p>
        </div>
      ) : null}
    </li>
  );
}

export function ReviewsSection({ property, reviews, stats }: { property: PropertyDetail; reviews: ReviewItem[]; stats: { histogram: number[]; recommendPercent: number | null } }) {
  const t = useTranslations("StayApp.detail");
  const num = useNumber();
  const [shown, setShown] = useState(4);
  const one = (v: number | null) => (v == null ? "—" : num(v, { minimumFractionDigits: 1, maximumFractionDigits: 1 }));
  const verdict = property.ratingAvg == null ? null : property.ratingAvg >= 4.5 ? "excellent" : property.ratingAvg >= 4 ? "veryGood" : property.ratingAvg >= 3.5 ? "good" : "fair";
  return (
    <section id="reviews" aria-labelledby="stay-reviews" className="scroll-mt-28" data-testid="stay-reviews">
      <h2 id="stay-reviews" className="text-lg font-extrabold text-slate-900">
        {t("reviews")}
      </h2>
      {property.reviewCount === 0 ? (
        <div className="mt-3 flex items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200">
          <MessageSquareQuote className="size-6 shrink-0 text-emerald-700" aria-hidden="true" />
          <p className="text-sm text-slate-600">{t("noReviews")}</p>
        </div>
      ) : (
        <>
          <div className="mt-3 grid gap-4 rounded-2xl bg-white p-4 ring-1 ring-slate-200 sm:grid-cols-[auto_1fr]">
            <div className="flex items-center gap-3 sm:flex-col sm:items-start">
              <p className="text-4xl font-black text-slate-900" data-testid="stay-review-score">
                {one(property.ratingAvg)}
                <span className="text-base font-semibold text-slate-400"> / {num(5)}</span>
              </p>
              <div>
                {verdict ? <p className="text-sm font-bold text-emerald-800">{t(`verdict.${verdict}`)}</p> : null}
                <p className="text-xs text-slate-500">{t("reviewsSummary", { count: property.reviewCount })}</p>
              </div>
            </div>
            <dl className="space-y-2 text-sm">
              {(["cleanliness", "location", "staff", "value"] as const).map((k) => {
                const v = property.ratingBreakdown[k];
                return (
                  <div key={k} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-2">
                    <dt className="text-xs text-slate-600">{t(`scores.${k}`)}</dt>
                    <dd className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <span className="block h-full rounded-full bg-emerald-600" style={{ width: `${v == null ? 0 : (v / 5) * 100}%` }} />
                    </dd>
                    <dd className="text-end text-xs font-bold text-slate-800">{one(v)}</dd>
                  </div>
                );
              })}
            </dl>
          </div>
          {stats.recommendPercent != null ? (
            <p className="mt-3 flex items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-medium text-emerald-900" data-testid="stay-review-recommend">
              <ThumbsUp className="size-4 shrink-0" aria-hidden="true" />
              {t("recommend", { percent: stats.recommendPercent })}
            </p>
          ) : null}
          <ul className="mt-3 space-y-3">
            {reviews.slice(0, shown).map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </ul>
          {reviews.length > shown ? (
            <button type="button" onClick={() => setShown((n) => n + 6)} className="mt-3 min-h-11 w-full rounded-full text-sm font-bold text-emerald-800 ring-1 ring-emerald-300" data-testid="stay-reviews-more">
              {t("showMoreReviews")}
            </button>
          ) : null}
        </>
      )}
    </section>
  );
}

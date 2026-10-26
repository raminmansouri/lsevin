"use client";

import { useState, useTransition } from "react";
import { BadgeCheck, Flag, Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { toast } from "sonner";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Link, usePathname } from "@/i18n/navigation";

import { directionOf } from "../../../domain/content";
import { reportReviewAction } from "../../../server/actions/customer";
import type { TourDetail } from "../../../server/platform/catalog";
import { ToursErrorAlert, type ToursActionError } from "../../shared/error-alert";
import { formatNumber, languageName } from "../../shared/format";
import { useTourDateFormat } from "../common";
import { useToursPrefs } from "../prefs-context";

type Review = TourDetail["reviews"][number];

/**
 * Verified reviews (C-047, C-120): the original text is always kept and shown
 * in its own language; a translation is offered separately and labelled,
 * including when it is machine-made. Report-abuse for signed-in customers.
 */
export function Reviews({ reviews, rating }: { reviews: Review[]; rating: { avg: number | null; count: number } }) {
  const t = useTranslations("TourApp.detail.reviews");
  const locale = useLocale();
  if (rating.count === 0 || reviews.length === 0) return <p className="text-sm text-slate-600" data-testid="no-reviews">{t("none")}</p>;
  return (
    <div className="space-y-4">
      {rating.avg != null ? (
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <Star className="size-5 fill-amber-400 text-amber-400" aria-hidden="true" />
          {t("summary", { rating: formatNumber(rating.avg, locale, { maximumFractionDigits: 1 }), count: rating.count })}
        </p>
      ) : null}
      <ul className="space-y-3">
        {reviews.map((r) => (
          <ReviewItem key={r.id} review={r} />
        ))}
      </ul>
    </div>
  );
}

function ReviewItem({ review }: { review: Review }) {
  const t = useTranslations("TourApp.detail.reviews");
  const locale = useLocale();
  const fmt = useTourDateFormat();
  const [showTranslation, setShowTranslation] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const text = showTranslation && review.translated ? review.translated : { locale: review.locale, body: review.body };
  return (
    <li className="rounded-2xl bg-white p-4 ring-1 ring-slate-200" data-testid="review">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-slate-800" aria-label={`${formatNumber(review.rating, locale)} / ${formatNumber(5, locale)}`}>
          {Array.from({ length: 5 }, (_, i) => (
            <Star key={i} className={i < review.rating ? "size-4 fill-amber-400 text-amber-400" : "size-4 text-slate-300"} aria-hidden="true" />
          ))}
        </span>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700">
          <BadgeCheck className="size-3.5" aria-hidden="true" />
          {t("verified")}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 whitespace-pre-line text-slate-800" lang={text.locale} dir={directionOf(text.locale)}>
        {text.body}
      </p>
      <p className="mt-1 text-[11px] text-slate-500">
        {showTranslation && review.translated
          ? `${t("translated", { language: languageName(review.translated.locale, locale) })}${review.translated.isMachine ? ` · ${t("machine")}` : ""}`
          : t("original", { language: languageName(review.locale, locale) })}
        {" · "}
        <span suppressHydrationWarning>{fmt.date(review.createdAt.slice(0, 10))}</span>
      </p>
      <div className="mt-1 flex flex-wrap gap-2">
        {review.translated ? (
          <button type="button" onClick={() => setShowTranslation((v) => !v)} className="min-h-11 text-xs font-medium text-emerald-700">
            {showTranslation ? t("showOriginal") : t("showTranslation")}
          </button>
        ) : null}
        <button type="button" onClick={() => setReportOpen(true)} className="inline-flex min-h-11 items-center gap-1 text-xs text-slate-500 hover:text-slate-800">
          <Flag className="size-3" aria-hidden="true" />
          {t("report")}
        </button>
      </div>
      {review.providerReply ? (
        <div className="mt-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
          <p className="text-xs font-semibold text-slate-500">{t("providerReply")}</p>
          <p className="mt-1 whitespace-pre-line" dir="auto">
            {review.providerReply}
          </p>
        </div>
      ) : null}
      <ReportDialog reviewId={review.id} open={reportOpen} onOpenChange={setReportOpen} />
    </li>
  );
}

function ReportDialog({ reviewId, open, onOpenChange }: { reviewId: string; open: boolean; onOpenChange: (v: boolean) => void }) {
  const t = useTranslations("TourApp.detail.reviews");
  const { signedIn } = useToursPrefs();
  const pathname = usePathname();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<ToursActionError | null>(null);
  const [pending, start] = useTransition();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>{t("reportTitle")}</DialogTitle>
        {!signedIn ? (
          <>
            <DialogDescription>{t("signInToReport")}</DialogDescription>
            <Link href={`/sign-in?redirectTo=${encodeURIComponent(pathname)}`} className="flex min-h-11 items-center justify-center rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white">
              {t("signInToReport")}
            </Link>
          </>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setError(null);
              start(async () => {
                const res = await reportReviewAction(reviewId, reason).catch(() => null);
                if (!res?.ok) {
                  setError(res && !res.ok ? res.error : { kind: "infrastructure", code: "service_unavailable" });
                  return;
                }
                toast.success(t("reported"));
                onOpenChange(false);
              });
            }}
            className="space-y-3"
          >
            <DialogDescription asChild>
              <label htmlFor={`report-${reviewId}`}>{t("reportReason")}</label>
            </DialogDescription>
            <textarea id={`report-${reviewId}`} value={reason} onChange={(e) => setReason(e.target.value)} required maxLength={500} rows={3} className="w-full rounded-xl border border-slate-300 p-3 text-sm" />
            <ToursErrorAlert error={error} />
            <DialogFooter>
              <button type="submit" disabled={pending || !reason.trim()} className="min-h-11 rounded-xl bg-emerald-700 px-4 text-sm font-semibold text-white disabled:opacity-50">
                {t("reportSend")}
              </button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

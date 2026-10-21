"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

import { contentLocaleFor } from "../../../domain/content";
import { submitReviewAction } from "../../../server/actions/customer";
import { ToursErrorAlert, type ToursActionError } from "../../shared/error-alert";

function Stars({ value, onChange, label, name }: { value: number; onChange: (v: number) => void; label: string; name: string }) {
  const t = useTranslations("TourApp.voucher.review");
  return (
    <fieldset>
      <legend className="text-sm font-medium text-slate-800">{label}</legend>
      <div className="mt-1 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className="cursor-pointer rounded-lg has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-emerald-600">
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only" aria-label={t("star", { count: n })} />
            <Star className={cn("size-11 p-1.5", n <= value ? "fill-amber-400 text-amber-400" : "text-slate-300")} aria-hidden="true" />
          </label>
        ))}
      </div>
    </fieldset>
  );
}

/** Verified review after completion (C-108); no incentive is tied to the rating. */
export function ReviewForm({ bookingId }: { bookingId: string }) {
  const t = useTranslations("TourApp.voucher.review");
  const locale = useLocale();
  const [rating, setRating] = useState(0);
  const [guide, setGuide] = useState(0);
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<ToursActionError | null>(null);
  const [pending, start] = useTransition();
  if (sent) {
    return (
      <p role="status" className="rounded-2xl bg-emerald-50 p-4 text-sm text-emerald-900" data-testid="review-sent">
        {t("thanks")}
      </p>
    );
  }
  return (
    <form
      className="space-y-3 rounded-2xl bg-white p-4 ring-1 ring-slate-200"
      data-testid="review-form"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          setError(null);
          const res = await submitReviewAction({ bookingId, rating, guideRating: guide || null, body, locale: contentLocaleFor(locale) }).catch(() => null);
          if (!res?.ok) {
            setError(res && !res.ok ? res.error : { kind: "infrastructure", code: "service_unavailable" });
            return;
          }
          setSent(true);
        });
      }}
    >
      <h2 className="text-sm font-bold text-slate-900">{t("title")}</h2>
      <p className="text-xs text-slate-500">{t("body")}</p>
      <Stars value={rating} onChange={setRating} label={t("rating")} name={`rating-${bookingId}`} />
      <Stars value={guide} onChange={setGuide} label={t("guideRating")} name={`guide-${bookingId}`} />
      <div className="space-y-1">
        <label htmlFor={`review-${bookingId}`} className="text-sm font-medium">
          {t("text")}
        </label>
        <textarea id={`review-${bookingId}`} value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={4000} className="w-full rounded-xl border border-slate-300 p-3 text-sm" />
      </div>
      <ToursErrorAlert error={error} />
      <button type="submit" disabled={pending || rating === 0 || body.trim().length < 3} className="min-h-12 w-full rounded-2xl bg-emerald-700 text-sm font-semibold text-white disabled:opacity-50">
        {t("submit")}
      </button>
    </form>
  );
}

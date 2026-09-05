"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import { submitReviewAction } from "../actions/review.actions";

export function ReviewForm({ productId, slug }: { productId: string; slug: string }) {
  const t = useTranslations("Shop");
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [pending, startTransition] = useTransition();
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (done) {
    return <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{t("reviewSubmitted")}</p>;
  }

  return (
    <form
      className="space-y-2 rounded-xl border border-neutral-200 p-3"
      onSubmit={(e) => {
        e.preventDefault();
        setErr(null);
        startTransition(async () => {
          try {
            await submitReviewAction({ productId, slug, rating, title: title || undefined, body: body || undefined });
            setDone(true);
          } catch (e2) {
            setErr(e2 instanceof Error ? e2.message : t("somethingWrong"));
          }
        });
      }}
    >
      <p className="text-sm font-semibold text-neutral-800">{t("writeReview")}</p>
      <div className="flex items-center gap-1">
        <span className="text-xs text-neutral-500">{t("yourRating")}</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            aria-label={`${n}`}
            onClick={() => setRating(n)}
            className={cn("text-xl leading-none", n <= rating ? "text-amber-500" : "text-neutral-300")}
          >
            ★
          </button>
        ))}
      </div>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("reviewTitle")}
        className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#083f30]"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder={t("reviewBody")}
        className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm outline-none focus:border-[#083f30]"
      />
      {err ? <p className="text-xs text-amber-700">{err}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="rounded-full bg-[#083f30] px-5 py-2 text-sm font-bold text-white disabled:opacity-50"
      >
        {t("submitReview")}
      </button>
    </form>
  );
}

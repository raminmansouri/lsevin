"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import {
  getProductPersonalStateAction,
  trackProductViewAction,
  type ProductPersonalState,
} from "../actions/product-personal.actions";
import { ProductCard, shopCardLabels } from "./ProductCard";
import { QuestionsSection } from "./QuestionsSection";
import { ReviewForm } from "./ReviewForm";
import type { ProductDetail } from "../types/domain";

type ReviewRow = ProductDetail["reviews"][number];
type QuestionRow = ProductDetail["questions"][number];

/**
 * Every visitor-specific block on the PDP, resolved in one round-trip so the
 * page shell can be statically rendered:
 *  - review form gating (eligibility) — the review list itself is public
 *  - Q&A "can ask" gating — the question list is public
 *  - recently-viewed rail
 * It also fires the view side effects (recently-viewed + analytics) that used
 * to block the server render.
 */
export function ProductPersonalSections({
  productId,
  slug,
  currency,
  locale,
  reviews,
  reviewCount,
  questions,
  relatedServiceKey,
  relatedServiceCount,
}: {
  productId: string;
  slug: string;
  currency: string;
  locale: string;
  reviews: ReviewRow[];
  reviewCount: number;
  questions: QuestionRow[];
  relatedServiceKey?: string | null;
  relatedServiceCount?: number;
}) {
  const t = useTranslations("Shop");
  const labels = shopCardLabels(t as never);
  const [state, setState] = useState<ProductPersonalState | null>(null);

  useEffect(() => {
    let alive = true;
    getProductPersonalStateAction({ productId, slug })
      .then((s) => {
        if (alive) setState(s);
      })
      .catch(() => {});
    void trackProductViewAction({
      productId,
      currency,
      relatedServiceKey: relatedServiceKey ?? null,
      relatedServiceCount,
    });
    return () => {
      alive = false;
    };
  }, [productId, slug, currency, relatedServiceKey, relatedServiceCount]);

  const canReview = Boolean(state?.eligibility.canReview);
  const alreadyReviewed = Boolean(state?.eligibility.alreadyReviewed);
  const canAsk = Boolean(state?.eligibility.canAsk);
  const recentlyViewed = state?.recentlyViewed ?? [];

  return (
    <>
      {reviews.length || canReview || alreadyReviewed ? (
        <section className="mt-2 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-neutral-900">{t("reviews", { count: reviewCount })}</h2>
          {canReview ? (
            <div className="mb-4">
              <ReviewForm productId={productId} slug={slug} />
            </div>
          ) : alreadyReviewed ? (
            <p className="mb-3 text-xs text-neutral-500">{t("reviewSubmitted")}</p>
          ) : null}
          <div className="space-y-3">
            {reviews.slice(0, 8).map((r) => (
              <div key={r.id} className="border-b border-neutral-100 pb-3 last:border-0">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-amber-500">{"★".repeat(r.rating)}</span>
                  <span className="font-medium text-neutral-700">{r.customerName || "—"}</span>
                  {r.isVerifiedPurchase ? <span className="text-emerald-600">✓</span> : null}
                </div>
                {r.title ? <p className="mt-1 text-sm font-semibold text-neutral-800">{r.title}</p> : null}
                {r.body ? <p className="mt-0.5 text-sm text-neutral-600">{r.body}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <QuestionsSection productId={productId} slug={slug} questions={questions} canAsk={canAsk} />

      {recentlyViewed.length ? (
        <section className="mt-2 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-neutral-900">{t("recentlyViewed")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {recentlyViewed.map((p) => (
              <ProductCard key={p.id} product={p} locale={locale} labels={labels} />
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getProductBySlug } from "@/features/shop/api/catalog.repository";
import { getCartView } from "@/features/shop/api/cart.repository";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { ProductDetailClient } from "@/features/shop/components/ProductDetailClient";
import { ProductGrid } from "@/features/shop/components/home-sections";
import { formatShopMoney } from "@/features/shop/components/money";
import { WishlistHeart } from "@/features/shop/components/WishlistHeart";
import { emitCommerceEvent } from "@/features/shop/lib/analytics";
import { getRecentlyViewed, recordRecentlyViewed } from "@/features/shop/api/recently-viewed.repository";
import { getReviewEligibility } from "@/features/shop/api/review.repository";
import { getCompareState } from "@/features/shop/api/compare.repository";
import { getProductsForService } from "@/features/shop/api/service-relations.repository";
import { ReviewForm } from "@/features/shop/components/ReviewForm";
import { QuestionsSection } from "@/features/shop/components/QuestionsSection";
import { CompareButton } from "@/features/shop/components/CompareButton";
import { ServiceRelatedRail } from "@/features/shop/components/ServiceRelatedRail";

export const dynamic = "force-dynamic";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");

  const [product, cart] = await Promise.all([getProductBySlug(slug), getCartView()]);
  if (!product) notFound();

  await emitCommerceEvent("shop_product_view", { productId: product.id, currency: product.currency, surface: "product_detail" });
  await recordRecentlyViewed(product.id);
  const primaryServiceId = product.relatedServices[0]?.serviceDefinitionId ?? null;
  const [recentlyViewed, reviewEligibility, compareState, serviceRelated] = await Promise.all([
    getRecentlyViewed(product.slug, 10),
    getReviewEligibility(product.id),
    getCompareState(product.id),
    primaryServiceId ? getProductsForService(primaryServiceId, { limit: 16 }) : Promise.resolve(null),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50 pb-40">
      <ShopHeader cartCount={cart.itemCount} currency={product.currency} back="/n/app/mobile/shop" />

      <div className="bg-white">
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {(product.gallery.length ? product.gallery : [{ id: "x", url: product.imageUrl ?? "", alt: product.name }]).map(
            (m) => (
              <div key={m.id} className="aspect-square w-full shrink-0 snap-center bg-neutral-100">
                {m.url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.url} alt={m.alt || product.name} className="h-full w-full object-cover" />
                ) : null}
              </div>
            )
          )}
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-baseline gap-2">
            {product.priceUnavailable ? (
              <span className="text-xl font-bold text-neutral-500">{t("priceUnavailable")}</span>
            ) : (
              <>
                <span className="text-2xl font-extrabold text-[#e02e2a]">
                  {formatShopMoney(product.price, product.currency, locale)}
                </span>
                {product.compareAtPrice ? (
                  <span className="text-sm text-neutral-400 line-through">
                    {formatShopMoney(product.compareAtPrice, product.currency, locale)}
                  </span>
                ) : null}
                {product.discountPercent ? (
                  <span className="rounded bg-[#e02e2a]/10 px-1.5 py-0.5 text-xs font-bold text-[#e02e2a]">
                    −{product.discountPercent}%
                  </span>
                ) : null}
              </>
            )}
          </div>

          <div className="flex items-start justify-between gap-2">
            <h1 className="text-base font-bold leading-snug text-neutral-900">{product.name}</h1>
            <WishlistHeart productId={product.id} initialActive={product.wishlistActive} className="shrink-0" />
          </div>
          {product.shortDescription ? (
            <p className="text-sm leading-relaxed text-neutral-600">{product.shortDescription}</p>
          ) : null}

          <div className="flex flex-wrap items-center gap-3 text-xs text-neutral-500">
            {product.rating > 0 ? (
              <span className="flex items-center gap-1">
                <span className="text-amber-500">★</span>
                {product.rating.toFixed(1)} · {t("reviews", { count: product.reviewCount })}
              </span>
            ) : null}
            {product.soldCount > 0 ? <span>{t("sold", { count: product.soldCount })}</span> : null}
            <span
              className={
                product.isPreorder
                  ? "font-semibold text-[#083f30]"
                  : product.hasStock
                    ? "font-semibold text-emerald-600"
                    : "font-semibold text-[#e02e2a]"
              }
            >
              {product.isPreorder ? t("preorder") : product.hasStock ? t("inStock") : t("outOfStock")}
            </span>
          </div>

          <CompareButton productId={product.id} initialInList={compareState.inList} initialCount={compareState.count} />

          <ProductDetailClient product={product} locale={locale} />
        </div>
      </div>

      {product.description ? (
        <section className="mt-2 bg-white p-4">
          <h2 className="mb-2 text-sm font-bold text-neutral-900">{t("description")}</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">{product.description}</p>
        </section>
      ) : null}

      {product.relatedServices.length ? (
        <section className="mt-2 bg-white p-4">
          <h2 className="mb-2 text-sm font-bold text-neutral-900">{t("relatedServices")}</h2>
          <div className="flex flex-wrap gap-2">
            {product.relatedServices.map((s) => (
              <span key={s.serviceDefinitionId} className="rounded-full bg-[#083f30]/5 px-3 py-1 text-xs font-medium text-[#083f30]">
                {s.name || s.relationType}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {serviceRelated && serviceRelated.byRelation.length ? (
        <ServiceRelatedRail
          serviceDefinitionId={serviceRelated.serviceDefinitionId}
          serviceName={serviceRelated.serviceName}
          groups={serviceRelated.byRelation}
          locale={locale}
        />
      ) : null}

      {product.reviews.length || reviewEligibility.canReview || reviewEligibility.alreadyReviewed ? (
        <section className="mt-2 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-neutral-900">{t("reviews", { count: product.reviewCount })}</h2>
          {reviewEligibility.canReview ? (
            <div className="mb-4">
              <ReviewForm productId={product.id} slug={product.slug} />
            </div>
          ) : reviewEligibility.alreadyReviewed ? (
            <p className="mb-3 text-xs text-neutral-500">{t("reviewSubmitted")}</p>
          ) : null}
          <div className="space-y-3">
            {product.reviews.slice(0, 8).map((r) => (
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

      {product.relatedProducts.length ? (
        <section className="mt-2 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-neutral-900">{t("relatedProducts")}</h2>
          <ProductGrid products={product.relatedProducts} locale={locale} />
        </section>
      ) : null}

      <QuestionsSection
        productId={product.id}
        slug={product.slug}
        questions={product.questions}
        canAsk={reviewEligibility.canAsk}
      />

      {recentlyViewed.length ? (
        <section className="mt-2 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-neutral-900">{t("recentlyViewed")}</h2>
          <Prod
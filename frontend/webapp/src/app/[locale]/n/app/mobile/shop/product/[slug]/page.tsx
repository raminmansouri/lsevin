import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getProductBySlugCached } from "@/features/shop/api/catalog.repository.cached";
import { listActiveProductSlugs } from "@/features/shop/api/catalog.repository";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { ProductDetailClient } from "@/features/shop/components/ProductDetailClient";
import { ProductGrid } from "@/features/shop/components/home-sections";
import { ShopPrice } from "@/features/shop/components/ShopPrice";
import { WishlistHeart } from "@/features/shop/components/WishlistHeart";
import { getProductsForService } from "@/features/shop/api/service-relations.repository";
import { CompareButton } from "@/features/shop/components/CompareButton";
import { ServiceRelatedRail } from "@/features/shop/components/ServiceRelatedRail";
import { ProductPersonalSections } from "@/features/shop/components/ProductPersonalSections";
import { shopImageSrc } from "@/features/shop/lib/image";

/**
 * Static / ISR. Rendered in the shop default currency; every visitor-specific
 * block (cart badge, wishlist, compare, review eligibility, recently viewed)
 * hydrates as a client island. Admin mutations bust the `shop-product:<slug>`
 * cache tag. `generateStaticParams` prewarms the active catalogue; unknown
 * slugs are ISR'd on first hit (`dynamicParams` defaults to true).
 */
export const dynamic = "force-static";
export const revalidate = 3600;

export async function generateStaticParams() {
  // Bounded + resilient: a DB-less build just yields an empty list and every
  // slug becomes ISR-on-demand.
  try {
    const slugs = await listActiveProductSlugs(500);
    return slugs.map((slug) => ({ slug }));
  } catch {
    return [];
  }
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");

  const product = await getProductBySlugCached(slug, locale).catch(() => null);
  if (!product) notFound();

  const primaryServiceId = product.relatedServices[0]?.serviceDefinitionId ?? null;
  const serviceRelated = primaryServiceId
    ? await getProductsForService(primaryServiceId, { limit: 16, locale, displayCurrency: "USD", noFx: true }).catch(() => null)
    : null;
  const serviceRelatedCount =
    serviceRelated?.byRelation.reduce((n, g) => n + g.products.length, 0) ?? 0;

  return (
    <div className="min-h-screen bg-neutral-50 pb-40">
      <ShopHeader currency={product.currency} back="/n/app/mobile/shop" />

      <div className="bg-white">
        <div className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto">
          {(() => {
            const shots = product.gallery.filter((g) => g.url && g.url.trim());
            const list = shots.length
              ? shots
              : product.imageUrl
                ? [{ id: "primary", url: product.imageUrl, alt: product.name }]
                : [];
            if (!list.length) {
              return (
                <div className="grid aspect-square w-full shrink-0 place-items-center bg-neutral-100 text-4xl text-neutral-300">
                  🖼️
                </div>
              );
            }
            return list.map((m) => (
              <div key={m.id} className="aspect-square w-full shrink-0 snap-center bg-neutral-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={shopImageSrc(m.url)} alt={m.alt || product.name} className="h-full w-full object-cover" loading="eager" />
              </div>
            ));
          })()}
        </div>

        <div className="space-y-3 p-4">
          <div className="flex items-baseline gap-2">
            {product.priceUnavailable ? (
              <span className="text-xl font-bold text-neutral-500">{t("priceUnavailable")}</span>
            ) : (
              <>
                <ShopPrice
                  amount={product.price}
                  currency={product.currency}
                  locale={locale}
                  className="text-2xl font-extrabold text-[#e02e2a]"
                />
                {product.compareAtPrice ? (
                  <ShopPrice
                    amount={product.compareAtPrice}
                    currency={product.currency}
                    locale={locale}
                    className="text-sm font-normal text-neutral-400 line-through"
                  />
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
            <WishlistHeart productId={product.id} initialActive={false} resolveOnMount className="shrink-0" />
          </div>
          {product.shortDescription ? (
            <p className="text-sm leading-relaxed text-neutral-600">{product.shortDescription}</p>
          ) : null}

          {product.preorderConfigured ? (
            <div className="rounded-xl bg-[#083f30]/[0.06] px-3 py-2 text-xs text-[#083f30]">
              <p className="font-semibold">
                {product.preorderReleaseAt
                  ? t("preorderShipsAfter", { date: new Date(product.preorderReleaseAt).toLocaleDateString(locale) })
                  : t("preorder")}
              </p>
              {product.preorderPaymentPolicy === "deposit" && product.preorderDepositPercent ? (
                <p className="mt-0.5">{t("preorderDeposit", { percent: product.preorderDepositPercent })}</p>
              ) : product.preorderPaymentPolicy === "proforma" ? (
                <p className="mt-0.5">{t("preorderProforma")}</p>
              ) : null}
              {typeof product.preorderRemaining === "number" ? (
                <p className="mt-0.5">{t("preorderRemaining", { count: product.preorderRemaining })}</p>
              ) : null}
            </div>
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

          <CompareButton productId={product.id} initialInList={false} initialCount={0} resolveOnMount />

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

      {product.relatedProducts.length ? (
        <section className="mt-2 bg-white p-4">
          <h2 className="mb-3 text-sm font-bold text-neutral-900">{t("relatedProducts")}</h2>
          <ProductGrid products={product.relatedProducts} locale={locale} />
        </section>
      ) : null}

      <ProductPersonalSections
        productId={product.id}
        slug={product.slug}
        currency={product.currency}
        locale={locale}
        reviews={product.reviews}
        reviewCount={product.reviewCount}
        questions={product.questions}
        relatedServiceKey={serviceRelated?.serviceDefinitionId ?? null}
        relatedServiceCount={serviceRelatedCount}
      />

      <div className="p-4 text-center">
        <Link href="/n/app/mobile/shop" className="text-xs font-semibold text-[#083f30]">
          ‹ {t("continueShopping")}
        </Link>
      </div>
    </div>
  );
}

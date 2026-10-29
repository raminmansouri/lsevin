import { ChevronLeft, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ConsultationCtaButton } from "@/features/consultation/components/consultation-cta-button";
import { CompareButton } from "@/features/shop/components/CompareButton";
import { ProductDetailClient } from "@/features/shop/components/ProductDetailClient";
import { ProductPersonalSections } from "@/features/shop/components/ProductPersonalSections";
import { shopCardLabels } from "@/features/shop/components/ProductCard";
import { ProductSpecs } from "@/features/shop/components/ProductSpecs";
import { ShopPrice } from "@/features/shop/components/ShopPrice";
import { WishlistHeart } from "@/features/shop/components/WishlistHeart";
import { shopImageSrc } from "@/features/shop/lib/image";
import { Link } from "@/i18n/navigation";

import { Reveal } from "../components/motion";
import { DesktopProductCard } from "./DesktopProductCard";
import { DesktopProductGallery } from "./DesktopProductGallery";

type Product = NonNullable<Awaited<ReturnType<typeof import("@/features/shop/api/catalog.repository.cached").getProductBySlugCached>>>;

/** Desktop product page (>= 1280px): same buy flow, minimal layout. */
export async function DesktopProductPage({ product, locale }: { product: Product; locale: string }) {
  const t = await getTranslations("Shop");
  const tConsultation = await getTranslations("Consultation");
  const labels = shopCardLabels(t);

  const shots = product.gallery.filter((item) => item.url && item.url.trim());
  const images = (shots.length ? shots : product.imageUrl ? [{ id: "primary", url: product.imageUrl, alt: product.name }] : []).map((item) => ({
    id: item.id,
    src: shopImageSrc(item.url),
    alt: item.alt || product.name,
  }));
  const brandName = (product as { brandName?: string | null }).brandName;

  return (
    <div className="lsd hidden pb-14 xl:block">
      {/* Breadcrumb */}
      <nav className="lsd-container flex items-center gap-2 pt-6 text-sm text-[#56675f]">
        <Link href="/n/app/mobile/shop" className="transition hover:text-[#083f30]">
          {t("title")}
        </Link>
        <ChevronLeft size={14} className="ltr:rotate-180" />
        <span className="truncate text-[#0e1a16]">{product.name}</span>
      </nav>

      {/* Gallery + buy column */}
      <section className="lsd-container mt-6 grid grid-cols-[1.1fr_0.9fr] items-start gap-14">
        <Reveal>
          <DesktopProductGallery images={images} name={product.name} />
        </Reveal>

        <div className="sticky top-28 space-y-5">
          {brandName ? <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#c9a55a]">{brandName}</p> : null}
          <h1 className="text-[30px] font-black leading-snug text-[#0e1a16]">{product.name}</h1>

          <div className="flex flex-wrap items-center gap-4 text-sm text-[#56675f]">
            {product.rating > 0 ? (
              <span className="flex items-center gap-1.5">
                <Star size={15} className="fill-[#c9a55a] text-[#c9a55a]" />
                <span className="font-bold text-[#0e1a16]">{product.rating.toFixed(1)}</span>
                <span>· {t("reviews", { count: product.reviewCount })}</span>
              </span>
            ) : null}
            {product.soldCount > 0 ? <span>{t("sold", { count: product.soldCount })}</span> : null}
            <span className={`font-bold ${product.isPreorder ? "text-[#083f30]" : product.hasStock ? "text-[#0f5a45]" : "text-[#c2410c]"}`}>
              {product.isPreorder ? t("preorder") : product.hasStock ? t("inStock") : t("outOfStock")}
            </span>
          </div>

          <div className="flex flex-wrap items-baseline gap-3 border-y border-[#dce4e0] py-5">
            {product.priceUnavailable ? (
              <span className="text-xl font-bold text-[#56675f]">{t("priceUnavailable")}</span>
            ) : (
              <>
                <ShopPrice amount={product.price} currency={product.currency} locale={locale} className="text-[32px] font-black text-[#083f30]" />
                {product.compareAtPrice ? (
                  <ShopPrice amount={product.compareAtPrice} currency={product.currency} locale={locale} className="text-base text-[#8fa79d] line-through" />
                ) : null}
                {product.discountPercent ? (
                  <span className="rounded-full bg-[#062a20] px-2.5 py-1 text-xs font-bold text-[#eacb7f]">−{product.discountPercent}%</span>
                ) : null}
              </>
            )}
          </div>

          {product.shortDescription ? <p className="text-[15px] leading-8 text-[#3d4b45]">{product.shortDescription}</p> : null}

          {product.preorderConfigured ? (
            <div className="rounded-2xl bg-[#fbf3de] px-4 py-3 text-sm text-[#8c6b2c]">
              <p className="font-bold">
                {product.preorderReleaseAt
                  ? t("preorderShipsAfter", { date: new Date(product.preorderReleaseAt).toLocaleDateString(locale) })
                  : t("preorder")}
              </p>
              {product.preorderPaymentPolicy === "deposit" && product.preorderDepositPercent ? (
                <p className="mt-1">{t("preorderDeposit", { percent: product.preorderDepositPercent })}</p>
              ) : product.preorderPaymentPolicy === "proforma" ? (
                <p className="mt-1">{t("preorderProforma")}</p>
              ) : null}
              {typeof product.preorderRemaining === "number" ? (
                <p className="mt-1">{t("preorderRemaining", { count: product.preorderRemaining })}</p>
              ) : null}
            </div>
          ) : null}

          {/* Variants, quantity, add to cart and buy now: the same component as mobile */}
          <ProductDetailClient product={product} locale={locale} />

          <ConsultationCtaButton
            categoryName={product.name}
            label={tConsultation("cta.beforePurchase")}
            className="flex h-12 w-full items-center justify-center gap-2 rounded-full border border-[#083f30]/20 text-sm font-bold text-[#083f30] transition hover:border-[#c9a55a] hover:bg-[#fbf3de]"
          />

          <div className="flex items-center gap-3">
            <WishlistHeart productId={product.id} initialActive={false} resolveOnMount className="h-11 w-11 bg-white ring-1 ring-[#dce4e0]" />
            <CompareButton productId={product.id} initialInList={false} initialCount={0} resolveOnMount />
          </div>
        </div>
      </section>

      {/* Description + specifications */}
      <section className="lsd-container mt-20 grid grid-cols-[1.3fr_1fr] gap-12">
        {product.description ? (
          <Reveal>
            <h2 className="mb-4 text-xl font-black text-[#0e1a16]">{t("description")}</h2>
            <p className="whitespace-pre-wrap text-[15px] leading-8 text-[#3d4b45]">{product.description}</p>
          </Reveal>
        ) : (
          <span />
        )}
        <Reveal className="rounded-[24px] bg-white p-6 ring-1 ring-[#dce4e0] [&_section]:m-0 [&_section]:bg-transparent [&_section]:p-0">
          <ProductSpecs productId={product.id} locale={locale} />
        </Reveal>
      </section>

      {product.relatedServices.length ? (
        <section className="lsd-container mt-14">
          <h2 className="mb-4 text-xl font-black text-[#0e1a16]">{t("relatedServices")}</h2>
          <div className="flex flex-wrap gap-2">
            {product.relatedServices.map((service) => (
              <Link
                key={service.serviceDefinitionId}
                href={`/n/app/mobile/service/${service.serviceDefinitionId}`}
                className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-[#083f30] ring-1 ring-[#dce4e0] transition hover:ring-[#c9a55a]"
              >
                {service.name || service.relationType}
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {product.relatedProducts.length ? (
        <section className="lsd-container mt-16">
          <h2 className="mb-6 text-2xl font-black text-[#0e1a16]">{t("relatedProducts")}</h2>
          <div className="grid grid-cols-6 gap-5">
            {product.relatedProducts.slice(0, 12).map((related, index) => (
              <Reveal key={related.id} delay={(index % 6) * 50}>
                <DesktopProductCard product={related} locale={locale} labels={labels} />
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <section className="lsd-container mt-16">
        <ProductPersonalSections
          productId={product.id}
          slug={product.slug}
          currency={product.currency}
          locale={locale}
          reviews={product.reviews}
          reviewCount={product.reviewCount}
          questions={product.questions}
        />
      </section>
    </div>
  );
}
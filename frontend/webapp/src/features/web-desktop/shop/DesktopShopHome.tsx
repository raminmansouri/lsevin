import Image from "next/image";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { HomeSection } from "@/features/shop/api/home.repository";
import { shopCardLabels } from "@/features/shop/components/ProductCard";
import { CurrencySwitcher } from "@/features/shop/components/CurrencySwitcher";
import { RecentlyViewedRail } from "@/features/shop/components/RecentlyViewedRail";
import { SearchBar } from "@/features/shop/components/SearchBar";
import { ShopCartCountBadge } from "@/features/shop/components/ShopCartCountBadge";
import { ShopPrice } from "@/features/shop/components/ShopPrice";
import { shopImageSrc } from "@/features/shop/lib/image";
import type { ProductCard as ProductCardModel } from "@/features/shop/types/domain";
import { Link } from "@/i18n/navigation";

import { PointerParallax, Reveal } from "../components/motion";
import { DesktopSponsoredSection } from "../home/DesktopSponsoredSection";
import { DesktopProductCard } from "./DesktopProductCard";

type Labels = ReturnType<typeof shopCardLabels>;

function Heading({ title, subtitle, href, viewAll }: { title: string; subtitle?: string | null; href?: string | null; viewAll: string }) {
  return (
    <Reveal className="mb-6 flex items-end justify-between gap-6">
      <div>
        <h2 className="text-2xl font-black text-[#0e1a16]">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-[#56675f]">{subtitle}</p> : null}
      </div>
      {href ? (
        <Link href={href} className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-[#083f30] transition hover:text-[#8c6b2c]">
          {viewAll}
          <ArrowLeft size={16} className="transition-transform duration-500 group-hover:-translate-x-1 ltr:rotate-180" />
        </Link>
      ) : null}
    </Reveal>
  );
}

/** A grid or a horizontal showcase, alternating so consecutive rails differ. */
function ProductRail({ products, horizontal, locale, labels }: { products: ProductCardModel[]; horizontal: boolean; locale: string; labels: Labels }) {
  if (horizontal) {
    return (
      <div className="lsd-snap hide-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-2">
        {products.map((product) => (
          <div key={product.id} className="w-[180px] shrink-0">
            <DesktopProductCard product={product} locale={locale} labels={labels} />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-6 gap-5">
      {products.slice(0, 12).map((product, index) => (
        <Reveal key={product.id} delay={(index % 6) * 50}>
          <DesktopProductCard product={product} locale={locale} labels={labels} />
        </Reveal>
      ))}
    </div>
  );
}

/** Desktop shop home (>= 1280px): a minimal boutique around the admin's sections, in their order. */
export async function DesktopShopHome({
  locale,
  sections,
  feed,
}: {
  locale: string;
  sections: HomeSection[];
  feed: ProductCardModel[];
}) {
  const t = await getTranslations("Shop");
  const labels = shopCardLabels(t);

  const showcase = feed.filter((product) => product.imageUrl).slice(0, 3);
  const pedestals = showcase.length === 3 ? [showcase[1], showcase[0], showcase[2]] : showcase;
  let railIndex = 0;

  return (
    <div className="lsd hidden pb-10 xl:block">
      {/* Shop window */}
      <section className="lsd-container pt-6">
        <PointerParallax depth={16}>
          <div className="lsd-hero-bg relative grid h-[400px] grid-cols-[1fr_1fr] items-center gap-6 overflow-hidden rounded-[36px] px-12 text-white">
            <Image src="/brand/lsevin-mark-reversed.png" alt="" aria-hidden="true" width={220} height={311} className="lsd-mark-bg -start-10 -top-8" />

            <Reveal className="relative z-10 space-y-5">
              <span className="text-[11px] font-bold tracking-[0.35em] text-[#eacb7f]">L SEVIN BOUTIQUE</span>
              <h1 className="lsd-gold-text text-[40px] font-black leading-tight">{t("title")}</h1>
              <div className="max-w-md">
                <SearchBar defaultValue="" />
              </div>
              <div className="flex items-center gap-2">
                <CurrencySwitcher />
                <Link
                  href="/n/app/mobile/shop/wishlist"
                  aria-label={t("wishlistTitle")}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20"
                >
                  <Heart size={18} />
                </Link>
                <Link href="/n/app/mobile/shop/cart" aria-label={t("cart")} className="lsd-btn lsd-btn-gold relative h-10 w-10 !px-0">
                  <ShoppingBag size={18} />
                  <ShopCartCountBadge initial={0} />
                </Link>
              </div>
            </Reveal>

            {/* Three products on small pedestals under soft spotlights */}
            <div className="relative flex h-full items-end justify-center gap-5 pb-10">
              {pedestals.map((product, index) => {
                const middle = pedestals.length === 3 && index === 1;
                return (
                  <Link
                    key={product.id}
                    href={`/n/app/mobile/shop/product/${product.slug}`}
                    className="lsd-depth group relative flex w-[150px] flex-col items-center"
                    style={{ ["--d" as string]: middle ? 1.2 : 0.7 }}
                  >
                    <span className="lsd-spotlight pointer-events-none absolute -top-[300px] h-[520px] w-[240px]" aria-hidden="true" />
                    <div className="lsd-float relative" style={{ animationDelay: `${-index * 2}s` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={shopImageSrc(product.imageUrl!)}
                        alt={product.name}
                        className={`rounded-2xl object-cover shadow-[0_24px_40px_-16px_rgba(0,0,0,0.7)] transition duration-700 group-hover:scale-105 ${middle ? "h-36 w-32" : "h-28 w-24"}`}
                      />
                    </div>
                    <span className={`lsd-pedestal mt-3 rounded-[50%] ${middle ? "h-6 w-40" : "h-5 w-32"}`} />
                    <span className={`lsd-pedestal -mt-3 rounded-b-2xl ${middle ? "h-16 w-36" : "h-10 w-28"}`} />
                    {!product.priceUnavailable ? (
                      <span className="mt-3 rounded-full bg-white/10 px-3 py-1 backdrop-blur-sm">
                        <ShopPrice amount={product.price} currency={product.currency} locale={locale} className="text-xs font-bold text-[#eacb7f]" />
                      </span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          </div>
        </PointerParallax>
      </section>

      {/* Admin sections, in their order */}
      {sections.map((section) => {
        if (section.type === "shortcut_rail") {
          return (
            <section key={section.key} className="lsd-container mt-10">
              <div className="flex flex-wrap justify-center gap-x-8 gap-y-6">
                {section.shortcuts.map((shortcut, index) => (
                  <Reveal key={shortcut.id} delay={Math.min(index, 10) * 40}>
                    <Link href={shortcut.linkUrl} className="group flex w-20 flex-col items-center gap-2.5 text-center">
                      <span className="lsd-orb rounded-full">
                        <span
                          className={`grid h-[68px] w-[68px] place-items-center overflow-hidden rounded-full bg-gradient-to-br text-2xl transition duration-500 group-hover:-translate-y-0.5 ${
                            shortcut.gradient ?? "from-[#0f5a45] to-[#062a20]"
                          }`}
                        >
                          {shortcut.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={shopImageSrc(shortcut.imageUrl)} alt={shortcut.label} className="h-full w-full object-cover" />
                          ) : (
                            shortcut.icon ?? "🏷️"
                          )}
                        </span>
                      </span>
                      <span className="line-clamp-1 text-xs font-bold text-[#0e1a16] transition group-hover:text-[#8c6b2c]">{shortcut.label}</span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "promo_cards") {
          return (
            <section key={section.key} className="lsd-container mt-10">
              <div className={`grid gap-5 ${section.promos.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                {section.promos.map((promo, index) => (
                  <Reveal key={promo.id} delay={index * 80}>
                    <Link
                      href={promo.linkUrl ?? "/n/app/mobile/shop/search"}
                      className="group relative block aspect-[16/8] overflow-hidden rounded-[24px] bg-[#062a20]"
                    >
                      {promo.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={shopImageSrc(promo.imageUrl)} alt={promo.label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-[#083f30] to-[#c9a55a]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#062a20]/80 to-transparent" />
                      <div className="absolute inset-x-5 bottom-4 flex items-end justify-between gap-3 text-white">
                        <div>
                          {promo.badge ? (
                            <span className="mb-1.5 inline-block rounded-full bg-[#eacb7f] px-2 py-0.5 text-[10px] font-black text-[#062a20]">{promo.badge}</span>
                          ) : null}
                          <p className="text-lg font-black leading-tight">{promo.label}</p>
                        </div>
                        <ArrowLeft size={18} className="shrink-0 text-[#eacb7f] opacity-0 transition duration-500 group-hover:-translate-x-1 group-hover:opacity-100 ltr:rotate-180" />
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "product_rail") {
          if (!section.products.length) return null;
          const horizontal = railIndex++ % 2 === 1;
          return (
            <section key={section.key} className="lsd-container mt-14">
              <Heading title={section.title} subtitle={section.subtitle} href={section.viewAllHref} viewAll={t("viewAll")} />
              <ProductRail products={section.products} horizontal={horizontal} locale={locale} labels={labels} />
            </section>
          );
        }

        return null;
      })}

      <section className="lsd-container mt-12">
        <RecentlyViewedRail locale={locale} />
      </section>

      <div className="mt-8">
        <DesktopSponsoredSection locale={locale} placement="shop_home" />
      </div>

      {/* Featured feed */}
      <section className="lsd-container mt-12">
        <Heading title={t("featured")} href="/n/app/mobile/shop/search" viewAll={t("viewAll")} />
        {feed.length ? (
          <ProductRail products={feed} horizontal={false} locale={locale} labels={labels} />
        ) : (
          <p className="rounded-[20px] bg-white p-8 text-center text-sm text-[#56675f] ring-1 ring-[#dce4e0]">{t("noResults")}</p>
        )}
      </section>
    </div>
  );
}
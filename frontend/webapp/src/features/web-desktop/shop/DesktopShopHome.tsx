import Image from "next/image";
import { ArrowLeft, Heart, ShoppingBag } from "lucide-react";
import { getTranslations } from "next-intl/server";

import type { HomeSection } from "@/features/shop/api/home.repository";
import { shopCardLabels } from "@/features/shop/components/ProductCard";
import { CurrencySwitcher } from "@/features/shop/components/CurrencySwitcher";
import { RecentlyViewedRail } from "@/features/shop/components/RecentlyViewedRail";
import { SearchBar } from "@/features/shop/components/SearchBar";
import { ShopCartCountBadge } from "@/features/shop/components/ShopCartCountBadge";
import { shopImageSrc } from "@/features/shop/lib/image";
import type { ProductCard as ProductCardModel } from "@/features/shop/types/domain";
import { Link } from "@/i18n/navigation";

import { PointerParallax, Reveal } from "../components/motion";
import { DesktopSponsoredSection } from "../home/DesktopSponsoredSection";
import { DesktopProductCard } from "./DesktopProductCard";

type Labels = ReturnType<typeof shopCardLabels>;

/** Centered catalogue heading with a gold ornament. */
function Heading({ title, subtitle, href, viewAll }: { title: string; subtitle?: string | null; href?: string | null; viewAll: string }) {
  return (
    <Reveal className="mb-10 text-center">
      <div className="mb-3 flex items-center justify-center gap-3 text-[#c9a55a]" aria-hidden="true">
        <span className="h-px w-14 bg-gradient-to-l from-[#c9a55a] to-transparent" />
        <span className="text-sm">✦</span>
        <span className="h-px w-14 bg-gradient-to-r from-[#c9a55a] to-transparent" />
      </div>
      <h2 className="text-[30px] font-black text-[#0e1a16]">{title}</h2>
      {subtitle ? <p className="mt-2 text-sm text-[#6b6150]">{subtitle}</p> : null}
      {href ? (
        <Link href={href} className="group mt-3 inline-flex items-center gap-1.5 text-sm font-bold text-[#8c6b2c] transition hover:text-[#083f30]">
          {viewAll}
          <ArrowLeft size={15} className="transition-transform duration-500 group-hover:-translate-x-1 ltr:rotate-180" />
        </Link>
      ) : null}
    </Reveal>
  );
}

function ProductRail({ products, horizontal, locale, labels }: { products: ProductCardModel[]; horizontal: boolean; locale: string; labels: Labels }) {
  if (horizontal) {
    return (
      <div className="lsd-snap hide-scrollbar -mx-2 flex gap-5 overflow-x-auto px-2 pb-2">
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

/** Desktop shop home (>= 1280px): a luxury boutique around the admin's sections, in their order. */
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

  const windowImages = feed.filter((product) => product.imageUrl).slice(0, 3).map((product) => shopImageSrc(product.imageUrl!));
  let railIndex = 0;

  return (
    <div className="lsd lsd-shop-bg hidden pb-16 xl:block">
      {/* Shop window */}
      <section className="lsd-container pt-6">
        <PointerParallax depth={16}>
          <div className="lsd-hero-bg relative grid h-[420px] grid-cols-[1fr_1fr] items-center gap-6 overflow-hidden rounded-[36px] px-12 text-white ring-1 ring-[#eacb7f]/25">
            <div className="absolute inset-0" aria-hidden="true" />
            <Image src="/brand/lsevin-mark-reversed.png" alt="" aria-hidden="true" width={220} height={311} className="lsd-mark-bg -start-10 -top-8" />

            <Reveal className="relative z-10 space-y-5">
              <span className="text-[11px] font-bold tracking-[0.35em] text-[#eacb7f]">L SEVIN BOUTIQUE</span>
              <h1 className="lsd-gold-text text-[42px] font-black leading-tight">{t("title")}</h1>
              <div className="max-w-md">
                <SearchBar defaultValue="" />
              </div>
              <div className="flex items-center gap-2">
                <CurrencySwitcher />
                <Link
                  href="/n/app/mobile/shop/wishlist"
                  aria-label={t("wishlistTitle")}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/10 ring-1 ring-white/15 transition hover:bg-white/20"
                >
                  <Heart size={18} />
                </Link>
                <Link href="/n/app/mobile/shop/cart" aria-label={t("cart")} className="lsd-btn lsd-btn-gold relative h-10 w-10 !px-0">
                  <ShoppingBag size={18} />
                  <ShopCartCountBadge initial={0} />
                </Link>
              </div>
            </Reveal>

            {/* An arched shop window where product pictures slowly crossfade */}
            <div className="relative flex h-full items-center justify-center">
              <div className="lsd-arch-frame h-[330px] w-[250px]">
                <div className="lsd-arch relative h-full w-full bg-gradient-to-b from-[#0d4a39] to-[#062a20]">
                  {/* Shown until (or if) the product pictures load */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4" aria-hidden="true">
                    <Image src="/brand/lsevin-mark-reversed.png" alt="" width={70} height={99} className="lsd-float" />
                    <Image src="/brand/lsevin-wordmark.png" alt="" width={120} height={33} />
                    <span className="h-px w-16 bg-gradient-to-r from-transparent via-[#eacb7f] to-transparent" />
                  </div>
                  <div className="lsd-xfade absolute inset-0">
                    {windowImages.map((src) => (
                      <div key={src} className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${src}")` }} />
                    ))}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-[#062a20]/30 to-transparent" />
                </div>
              </div>
            </div>
          </div>
        </PointerParallax>
      </section>

      {/* Admin sections, in their order */}
      {sections.map((section) => {
        if (section.type === "shortcut_rail") {
          return (
            <section key={section.key} className="lsd-container mt-12">
              <div className="flex flex-wrap justify-center gap-5">
                {section.shortcuts.map((shortcut, index) => (
                  <Reveal key={shortcut.id} delay={Math.min(index, 10) * 40}>
                    <Link href={shortcut.linkUrl} className="group block w-[170px]">
                      <span className="lsd-plaque flex h-[96px] flex-col items-center justify-center gap-2.5 rounded-[20px] px-4">
                        {shortcut.imageUrl ? (
                          <>
                            <span
                              className="absolute inset-0 bg-cover bg-center opacity-40 transition duration-700 group-hover:scale-110 group-hover:opacity-55"
                              style={{ backgroundImage: `url("${shopImageSrc(shortcut.imageUrl)}")` }}
                              aria-hidden="true"
                            />
                            <span className="absolute inset-0 bg-gradient-to-t from-[#062a20] via-[#062a20]/60 to-[#062a20]/30" aria-hidden="true" />
                          </>
                        ) : null}
                        <span className="relative line-clamp-1 text-center text-[15px] font-black text-white">{shortcut.label}</span>
                        <span className="lsd-plaque-line relative h-px bg-[#eacb7f]" aria-hidden="true" />
                      </span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "promo_cards") {
          return (
            <section key={section.key} className="lsd-container mt-12">
              <div className={`grid gap-6 ${section.promos.length >= 3 ? "grid-cols-3" : "grid-cols-2"}`}>
                {section.promos.map((promo, index) => (
                  <Reveal key={promo.id} delay={index * 80}>
                    <Link
                      href={promo.linkUrl ?? "/n/app/mobile/shop/search"}
                      className="group relative block aspect-[16/8] overflow-hidden rounded-[26px] bg-[#062a20] ring-1 ring-[#c9a55a]/40"
                    >
                      {promo.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={shopImageSrc(promo.imageUrl)} alt={promo.label} className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1.6s] group-hover:scale-105" />
                      ) : (
                        <div className="absolute inset-0" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#062a20]/85 to-transparent" />
                      <span className="pointer-events-none absolute inset-2.5 rounded-[20px] border border-[#eacb7f]/0 transition duration-500 group-hover:border-[#eacb7f]/70" />
                      <div className="absolute inset-x-6 bottom-5 flex items-end justify-between gap-3 text-white">
                        <div>
                          {promo.badge ? (
                            <span className="mb-1.5 inline-block rounded-full bg-[#eacb7f] px-2.5 py-0.5 text-[10px] font-black text-[#062a20]">{promo.badge}</span>
                          ) : null}
                          <p className="text-xl font-black leading-tight">{promo.label}</p>
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
              <div className="lsd-salon rounded-[36px] px-10 py-10">
                <Heading title={section.title} subtitle={section.subtitle} href={section.viewAllHref} viewAll={t("viewAll")} />
                <ProductRail products={section.products} horizontal={horizontal} locale={locale} labels={labels} />
              </div>
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
        <div className="lsd-salon rounded-[36px] px-10 py-10">
          <Heading title={t("featured")} href="/n/app/mobile/shop/search" viewAll={t("viewAll")} />
          {feed.length ? (
            <ProductRail products={feed} horizontal={false} locale={locale} labels={labels} />
          ) : (
            <p className="p-8 text-center text-sm text-[#56675f]">{t("noResults")}</p>
          )}
        </div>
      </section>
    </div>
  );
}
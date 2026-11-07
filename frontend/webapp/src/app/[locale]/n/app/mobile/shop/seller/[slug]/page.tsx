import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ShieldCheck, Store } from "lucide-react";

import { getCartView } from "@/features/shop/api/cart.repository";
import { getShopSellerBySlug } from "@/features/shop/api/catalog.repository";
import { ProductListView } from "@/features/shop/components/ProductListView";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { getShopContext } from "@/features/shop/lib/context";
import { resolveDisplayCurrency } from "@/features/shop/lib/pricing";
import { DesktopSellerHeader } from "@/features/web-desktop/shop/DesktopSellerHeader";

export const dynamic = "force-dynamic";

/** A seller's shop page: their profile, and every product they sell at their own price. */
export default async function ShopSellerPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  const [seller, cart, ctx, t] = await Promise.all([
    getShopSellerBySlug(slug, locale),
    getCartView(),
    getShopContext(),
    getTranslations("Shop.sellerPage"),
  ]);
  if (!seller) notFound();
  const { currency, selectable } = await resolveDisplayCurrency(ctx);

  const years = Math.floor((Date.now() - Date.parse(seller.joinedAt)) / (365.25 * 24 * 60 * 60 * 1000));
  const labels = {
    products: t("products", { count: seller.productCount }),
    tenure: years >= 1 ? t("yearsOnSite", { count: years }) : t("newSeller"),
    warrantyTitle: t("warrantyTitle"),
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <ShopHeader
        cartCount={cart.itemCount}
        searchDefault=""
        currency={currency}
        selectableCurrencies={selectable.map((s) => ({ code: s.code, symbol: s.symbol, name: s.name }))}
        back="/n/app/mobile/shop"
      />

      {/* Mobile header: one slim deep-green card */}
      <section className="px-4 pt-4 xl:hidden">
        <div className="relative overflow-hidden rounded-3xl bg-[#062a20] p-4 text-white">
          <div className="pointer-events-none absolute -end-12 -top-16 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(234,203,127,0.2),transparent_65%)]" />
          <div className="relative flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 rounded-full border border-[#eacb7f]/50 p-1">
              <div className="grid h-full w-full place-items-center overflow-hidden rounded-full bg-gradient-to-b from-[#0f5a45] to-[#083f30]">
                {seller.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={seller.logoUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Store size={22} className="text-[#eacb7f]" />
                )}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold tracking-[0.15em] text-[#eacb7f]">{labels.tenure}</p>
              <h1 className="truncate text-lg font-black text-[#eacb7f]">{seller.name}</h1>
              <p className="text-xs text-white/70">{labels.products}</p>
            </div>
          </div>
          {seller.description ? <p className="relative mt-3 line-clamp-2 text-xs leading-5 text-white/65">{seller.description}</p> : null}
          {seller.warranty ? (
            <p className="relative mt-3 flex items-start gap-2 rounded-xl bg-white/5 px-3 py-2 text-[11px] leading-5 text-white/75 ring-1 ring-[#eacb7f]/20">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-[#eacb7f]" />
              {seller.warranty}
            </p>
          ) : null}
        </div>
      </section>

      <DesktopSellerHeader seller={seller} labels={labels} />

      <ProductListView
        locale={locale}
        basePath={`/n/app/mobile/shop/seller/${slug}`}
        searchParams={sp}
        fixed={{ seller: slug }}
      />
    </div>
  );
}
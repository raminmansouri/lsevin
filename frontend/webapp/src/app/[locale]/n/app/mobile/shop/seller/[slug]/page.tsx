import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Package, ShieldCheck, Sparkles, Store } from "lucide-react";

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

      {/* Mobile header */}
      <section className="px-4 pt-4 xl:hidden">
        <div className="overflow-hidden rounded-3xl bg-white ring-1 ring-neutral-200">
          <div className="h-16 bg-gradient-to-br from-[#0f5a45] via-[#083f30] to-[#062a20]" />
          <div className="-mt-8 px-4 pb-4">
            <span className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-[#083f30] text-xl font-black text-[#eacb7f] ring-4 ring-white">
              {seller.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={seller.logoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                seller.name.charAt(0) || <Store size={22} />
              )}
            </span>
            <h1 className="mt-2 text-lg font-black text-neutral-900">{seller.name}</h1>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 font-semibold text-[#0f5a45]">
                <Package size={13} />
                {labels.products}
              </span>
              <span className="flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-800">
                <Sparkles size={13} />
                {labels.tenure}
              </span>
            </div>
            {seller.description ? <p className="mt-3 text-sm leading-6 text-neutral-600">{seller.description}</p> : null}
            {seller.warranty ? (
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-neutral-50 p-3 text-xs leading-5 text-neutral-700">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-[#0f5a45]" />
                {seller.warranty}
              </p>
            ) : null}
          </div>
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
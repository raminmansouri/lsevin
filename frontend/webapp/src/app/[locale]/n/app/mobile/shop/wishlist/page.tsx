import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { getWishlistView } from "@/features/shop/api/wishlist.repository";
import { getCartView } from "@/features/shop/api/cart.repository";
import { getShopContext } from "@/features/shop/lib/context";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { ProductGrid } from "@/features/shop/components/home-sections";

export const dynamic = "force-dynamic";

export default async function ShopWishlistPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");

  const [ctx, cart, wishlist] = await Promise.all([getShopContext(), getCartView(), getWishlistView()]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <ShopHeader cartCount={cart.itemCount} back="/n/app/mobile/shop" />
      <h1 className="px-4 pt-3 text-lg font-extrabold text-neutral-900">{t("wishlistTitle")}</h1>

      <div className="p-4 pb-24">
        {!ctx.customerId ? (
          <div className="rounded-2xl bg-white p-10 text-center">
            <div className="text-4xl">♡</div>
            <p className="mt-3 text-sm font-semibold text-neutral-700">{t("signInRequired")}</p>
          </div>
        ) : wishlist.items.length ? (
          <ProductGrid products={wishlist.items} locale={locale} />
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center">
            <div className="text-4xl">♡</div>
            <p className="mt-3 text-sm font-semibold text-neutral-700">{t("wishlistEmpty")}</p>
            <Link href="/n/app/mobile/shop" className="mt-3 inline-block text-xs font-semibold text-[#083f30]">
              {t("startShopping")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

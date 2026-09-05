import { getTranslations, setRequestLocale } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { listCustomerOrders } from "@/features/shop/api/order.repository";
import { getCartView } from "@/features/shop/api/cart.repository";
import { getShopContext } from "@/features/shop/lib/context";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { OrderRow } from "@/features/shop/components/OrderView";

export const dynamic = "force-dynamic";

export default async function OrdersPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");

  const [orders, cart, ctx] = await Promise.all([listCustomerOrders(), getCartView(), getShopContext()]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <ShopHeader cartCount={cart.itemCount} back="/n/app/mobile/shop" />
      <h1 className="px-4 pt-3 text-lg font-extrabold text-neutral-900">{t("myOrders")}</h1>

      <div className="space-y-3 p-4 pb-24">
        {!ctx.customerId ? (
          <p className="rounded-2xl bg-white p-8 text-center text-sm text-neutral-500">{t("noOrders")}</p>
        ) : orders.length ? (
          orders.map((o) => <OrderRow key={o.id} order={o} locale={locale} />)
        ) : (
          <div className="rounded-2xl bg-white p-10 text-center">
            <div className="text-4xl">📦</div>
            <p className="mt-3 text-sm font-semibold text-neutral-700">{t("noOrders")}</p>
            <Link href="/n/app/mobile/shop" className="mt-3 inline-block text-xs font-semibold text-[#083f30]">
              {t("startShopping")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

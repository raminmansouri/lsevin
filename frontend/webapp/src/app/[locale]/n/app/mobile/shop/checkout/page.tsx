import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { getCartView } from "@/features/shop/api/cart.repository";
import { quoteCheckout, getPaymentMethods } from "@/features/shop/api/checkout.repository";
import { listCustomerAddresses } from "@/features/shop/api/address.repository";
import { getShopContext, normalizeLocale } from "@/features/shop/lib/context";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { CheckoutClient } from "@/features/shop/components/CheckoutClient";
import { emitCommerceEvent } from "@/features/shop/lib/analytics";

export const dynamic = "force-dynamic";

export default async function CheckoutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");

  const cart = await getCartView();
  const active = cart.items.filter((i) => !i.savedForLater);
  if (!cart.id || !active.length) {
    redirect("/n/app/mobile/shop/cart");
  }

  const ctx = await getShopContext();
  const [quote, paymentMethods, addresses] = await Promise.all([
    quoteCheckout({ cartId: cart.id }),
    getPaymentMethods(normalizeLocale(ctx.locale)),
    listCustomerAddresses(),
  ]);

  await emitCommerceEvent("shop_checkout_started", {
    cartId: cart.id,
    value: quote.totals.grandTotal,
    currency: quote.currency,
    surface: "checkout",
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      <ShopHeader cartCount={cart.itemCount} currency={cart.currency} back="/n/app/mobile/shop/cart" />
      <h1 className="px-4 pt-3 text-lg font-extrabold text-neutral-900">{t("checkout")}</h1>
      <CheckoutClient
        locale={locale}
        cartId={cart.id}
        items={active.map((i) => ({
          id: i.id,
          name: i.name,
          variantTitle: i.variantTitle,
          imageUrl: i.imageUrl,
          quantity: i.quantity,
          lineTotal: i.lineTotal,
          currency: i.currency,
        }))}
        initialQuote={quote}
        paymentMethods={paymentMethods.map((m) => ({ id: m.id, code: m.code, name: m.name, description: m.description ?? "" }))}
        savedAddresses={addresses}
        defaultEmail={ctx.userId ? undefined : undefined}
        isAuthenticated={Boolean(ctx.customerId)}
      />
    </div>
  );
}

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

import { getCustomerOrder } from "@/features/shop/api/order.repository";
import { getCartView } from "@/features/shop/api/cart.repository";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { OrderDetailView } from "@/features/shop/components/OrderView";

export const dynamic = "force-dynamic";

export default async function OrderConfirmationPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; orderNumber: string }>;
  searchParams: Promise<{ email?: string }>;
}) {
  const { locale, orderNumber } = await params;
  const { email } = await searchParams;
  setRequestLocale(locale);

  const [order, cart] = await Promise.all([getCustomerOrder(orderNumber, email ?? null), getCartView()]);
  if (!order) notFound();

  return (
    <div className="min-h-screen bg-neutral-50">
      <ShopHeader cartCount={cart.itemCount} back="/n/app/mobile/shop" />
      <OrderDetailView order={order} locale={locale} confirmation />
    </div>
  );
}

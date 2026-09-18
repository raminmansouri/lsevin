import { getTranslations, setRequestLocale } from "next-intl/server";

import { getCartView } from "@/features/shop/api/cart.repository";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { CartClient } from "@/features/shop/components/CartClient";
import { CartBookings } from "@/features/booking-pro/components/CartBookings";
import { listCartBookings } from "@/features/booking-pro/server/cart.repository";
import { resolveCurrentUserId } from "@/features/booking-pro/utils/auth";

export const dynamic = "force-dynamic";

export default async function CartPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");
  const cart = await getCartView();
  const userId = await resolveCurrentUserId();
  const bookings = userId ? await listCartBookings(userId, locale) : [];

  return (
    <div className="min-h-screen bg-neutral-50">
      <ShopHeader
        cartCount={cart.itemCount + bookings.length}
        currency={cart.currency}
        selectableCurrencies={cart.selectableCurrencies}
        back="/n/app/mobile/shop"
      />
      <h1 className="px-4 pt-3 text-lg font-extrabold text-neutral-900">{t("cart")}</h1>
      <CartBookings bookings={bookings} locale={locale} />
      <CartClient initial={cart} locale={locale} hasBookings={bookings.length > 0} />
    </div>
  );
}

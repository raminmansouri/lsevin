import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { listCustomerAddresses } from "@/features/shop/api/address.repository";
import { getCartView } from "@/features/shop/api/cart.repository";
import { getShopContext } from "@/features/shop/lib/context";
import { ShopHeader } from "@/features/shop/components/ShopHeader";
import { AddressBookClient } from "@/features/shop/components/AddressBookClient";

export const dynamic = "force-dynamic";

export default async function ShopAddressesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("Shop");

  const ctx = await getShopContext();
  if (!ctx.customerId) redirect(`/${locale}/n/app/mobile/shop`);

  const [addresses, cart] = await Promise.all([listCustomerAddresses(), getCartView()]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <ShopHeader cartCount={cart.itemCount} back="/n/app/mobile/shop/checkout" />
      <h1 className="px-4 pt-3 text-lg font-extrabold text-neutral-900">{t("savedAddresses")}</h1>
      <AddressBookClient initial={addresses} locale={locale} />
    </div>
  );
}

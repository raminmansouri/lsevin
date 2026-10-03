import { ShopCurrencyProvider } from "@/features/shop/components/ShopCurrencyProvider";
import { getShopContext } from "@/features/shop/lib/context";
import { resolveDisplayCurrency } from "@/features/shop/lib/pricing";

/** Resolves customer currency per request while catalog queries remain cached. */
export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { currency: defaultCurrency, selectable } =
    await resolveDisplayCurrency(await getShopContext());

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <ShopCurrencyProvider
        defaultCurrency={defaultCurrency}
        options={selectable}
      >
        {children}
      </ShopCurrencyProvider>
    </div>
  );
}

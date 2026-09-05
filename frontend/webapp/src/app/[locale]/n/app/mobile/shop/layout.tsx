import { getShopDefaultCurrencyCached } from "@/features/shop/api/catalog.repository.cached";
import { ShopCurrencyProvider } from "@/features/shop/components/ShopCurrencyProvider";

/**
 * Shop route wrapper. `overflow-x-hidden` is a hard guarantee that no Shop
 * surface — dense product grids, comparison tables, horizontal rails — can make
 * the page scroll sideways on a phone (SHP-UX-010). Wide content that genuinely
 * needs to scroll (the compare table) does so inside its own `overflow-x-auto`
 * container.
 *
 * It also mounts `ShopCurrencyProvider` so every `<ShopPrice>` on a statically
 * rendered storefront page can convert to the visitor's chosen currency on the
 * client.
 */
export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const defaultCurrency = await getShopDefaultCurrencyCached().catch(() => "USD");

  return (
    <div className="w-full max-w-full overflow-x-hidden">
      <ShopCurrencyProvider defaultCurrency={defaultCurrency}>{children}</ShopCurrencyProvider>
    </div>
  );
}

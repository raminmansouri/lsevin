import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { SearchBar } from "./SearchBar";
import { CurrencySwitcher } from "./CurrencySwitcher";

/**
 * Compact Shop top bar following the AliExpress reference (SHP-UX-011, §18):
 * utility icon + dominant search pill + cart, with the display-currency switch
 * when the platform pricing mode allows it (SHP-V01-027).
 */
export async function ShopHeader({
  cartCount = 0,
  searchDefault = "",
  currency,
  selectableCurrencies = [],
  back,
}: {
  cartCount?: number;
  searchDefault?: string;
  currency?: string;
  selectableCurrencies?: Array<{ code: string; symbol: string; name: string }>;
  back?: string;
}) {
  const t = await getTranslations("Shop");

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-b from-[#083f30] to-[#0a5a44] px-3 pb-3 pt-[max(0.6rem,env(safe-area-inset-top))]">
      <div className="flex items-center gap-2">
        {back ? (
          <Link href={back} aria-label="Back" className="shrink-0 rounded-full p-1.5 text-white/90">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="rtl:rotate-180">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : (
          <span className="shrink-0 ps-1 text-base font-extrabold tracking-tight text-white">{t("title")}</span>
        )}

        <SearchBar defaultValue={searchDefault} />

        {currency && selectableCurrencies.length > 0 ? (
          <CurrencySwitcher current={currency} options={selectableCurrencies} />
        ) : currency ? (
          <span className="shrink-0 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold text-white">{currency}</span>
        ) : null}

        <Link href="/n/app/mobile/shop/wishlist" aria-label={t("wishlistTitle")} className="shrink-0 rounded-full p-1.5 text-white">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 21s-6.7-4.35-9.33-8.03C.9 10.28 1.63 6.6 4.6 5.4c2-.8 4.1.05 5.4 1.7 1.3-1.65 3.4-2.5 5.4-1.7 2.97 1.2 3.7 4.88 1.93 7.57C18.7 16.65 12 21 12 21z" stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
          </svg>
        </Link>

        <Link
          href="/n/app/mobile/shop/cart"
          aria-label={t("cart")}
          className={cn("relative shrink-0 rounded-full p-1.5 text-white")}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 2-1.6L23 8H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="21" r="1.6" fill="currentColor" />
            <circle cx="18" cy="21" r="1.6" fill="currentColor" />
          </svg>
          {cartCount > 0 ? (
            <span className="absolute -end-0.5 -top-0.5 min-w-[18px] rounded-full bg-[#eacb7f] px-1 text-center text-[11px] font-bold leading-[18px] text-[#083f30]">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}

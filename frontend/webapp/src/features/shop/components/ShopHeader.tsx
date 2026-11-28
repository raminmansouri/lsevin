import { getTranslations } from "next-intl/server";

import { Link } from "@/i18n/navigation";

import { SearchBar } from "./SearchBar";
import { CurrencySwitcher } from "./CurrencySwitcher";
import { ShopCartCountBadge } from "./ShopCartCountBadge";
import { Heart, SlidersHorizontal } from "lucide-react";

const iconButton =
  "grid h-8 w-8 shrink-0 place-items-center rounded-full text-white transition xl:h-11 xl:w-11 xl:bg-[#083f30] xl:text-[#eacb7f] xl:shadow-[0_8px_18px_-10px_rgba(8,63,48,0.9)] xl:hover:bg-[#0a5a44]";

export async function ShopHeader({
  cartCount = 0,
  searchDefault = "",
  back,
  filterEntry = false,
}: {
  filterEntry?: boolean;
  cartCount?: number;
  searchDefault?: string;
  currency?: string;
  selectableCurrencies?: Array<{ code: string; symbol: string; name: string }>;
  back?: string;
}) {
  const t = await getTranslations("Shop");

  return (
    <header className="sticky top-0 z-30 overflow-x-clip bg-gradient-to-b from-[#083f30] to-[#0a5a44] px-2.5 pb-3 pt-[max(0.6rem,env(safe-area-inset-top))] xl:static xl:overflow-visible xl:bg-none xl:px-8 xl:pb-0 xl:pt-2">
      <div className="flex min-w-0 items-center gap-1.5 xl:relative xl:mx-auto xl:max-w-[1360px] xl:gap-3 xl:rounded-[26px] xl:bg-[#fffdf8] xl:p-2.5 xl:shadow-[0_24px_60px_-40px_rgba(6,42,32,0.45)] xl:ring-1 xl:ring-[#eacb7f]/45">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-16 -bottom-px hidden h-px bg-gradient-to-r from-transparent via-[#c9a55a] to-transparent xl:block"
        />
        {back ? (
          <Link href={back} aria-label={t("back")} className={iconButton}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden className="rtl:rotate-180">
              <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
        ) : (
          <span className="shrink-0 ps-1 pe-0.5 text-[15px] font-extrabold tracking-tight text-white xl:px-3 xl:font-display xl:text-[26px] xl:font-normal xl:text-[#083f30]">
            {t("title")}
          </span>
        )}

        <SearchBar defaultValue={searchDefault} />

        <div className="shrink-0 xl:rounded-full xl:bg-[#083f30] xl:px-1 xl:py-0.5">
          <CurrencySwitcher />
        </div>

        <Link href="/account/wishlist" aria-label={t("wishlistTitle")} className={iconButton}>
          <Heart size={20} strokeWidth={1.9} aria-hidden />
        </Link>

        <Link href="/shop/cart" aria-label={t("cart")} className={`relative ${iconButton}`}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M3 4h2l2.4 12.3a2 2 0 0 0 2 1.7h8.2a2 2 0 0 0 2-1.6L23 8H6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="10" cy="21" r="1.6" fill="currentColor" />
            <circle cx="18" cy="21" r="1.6" fill="currentColor" />
          </svg>
          <ShopCartCountBadge initial={cartCount} />
        </Link>
      </div>
      {filterEntry ? (
        <nav className="no-scrollbar mt-2.5 flex gap-2 overflow-x-auto pb-0.5 xl:mx-auto xl:mt-3 xl:max-w-[1360px] xl:overflow-visible">
          <Link
            href="/shop/search?filters=1"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[#eacb7f] px-3.5 py-1.5 text-xs font-black text-[#083f30] shadow-[0_6px_16px_-8px_rgba(234,203,127,0.9)]"
          >
            <SlidersHorizontal className="size-3.5" aria-hidden="true" />
            {t("filter.title")}
          </Link>
          {[
            { href: "/shop/search?onSale=1", label: t("onSale") },
            { href: "/shop/search?inStockOnly=1", label: t("inStockOnly") },
            { href: "/shop/search?sort=newest", label: t("sortNewest") },
            { href: "/shop/search?sort=price_asc", label: t("sortPriceAsc") },
            { href: "/shop/search?minRating=4", label: t("rating4plus") },
          ].map((chip) => (
            <Link
              key={chip.href}
              href={chip.href}
              className="shrink-0 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white ring-1 ring-white/20 transition hover:bg-white/20 xl:bg-[#fffdf8] xl:text-[#083f30] xl:ring-[#eacb7f]/50 xl:hover:bg-[#f7f2e6]"
            >
              {chip.label}
            </Link>
          ))}
        </nav>
      ) : null}
    </header>
  );
}
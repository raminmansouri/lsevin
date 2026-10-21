"use client";

import type { ReactNode } from "react";
import { ArrowLeft, ArrowRight, Compass, Heart, Home, Luggage, User } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { directionOf } from "../../../domain/content";

import { DisplaySettingsButton } from "./display-settings";

export const PARENT_APP_PATH = "/n/app/mobile/home";

const TABS = [
  { key: "home", href: "/tours", icon: Home, match: (p: string) => p === "/tours" },
  { key: "explore", href: "/tours/explore", icon: Compass, match: (p: string) => p.startsWith("/tours/explore") || p.startsWith("/tours/destinations") || p.startsWith("/tours/t/") },
  { key: "wishlist", href: "/tours/wishlist", icon: Heart, match: (p: string) => p.startsWith("/tours/wishlist") || p.startsWith("/tours/compare") },
  { key: "profile", href: "/tours/profile", icon: User, match: (p: string) => p.startsWith("/tours/profile") || p.startsWith("/tours/bookings") },
] as const;

/**
 * Tours sub-application chrome (C-006, C-013): a top bar with the way back to
 * the parent Lsevin app and display settings, desktop navigation, and the
 * mobile bottom navigation Home / Explore / Wishlist / Profile. The intro and
 * the public share page render without the navigation.
 */
export function ToursShell({ children }: { children: ReactNode }) {
  const t = useTranslations("TourApp.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const dir = directionOf(locale);
  const bare = pathname.startsWith("/tours/intro") || pathname.startsWith("/tours/share/");
  const BackIcon = dir === "rtl" ? ArrowRight : ArrowLeft;

  return (
    // data-latin-digits: the platform-wide PersianDigits pass must not rewrite digits inside
    // provider-authored text, names or codes; every number the Tours UI itself prints is
    // already localized through Intl (formatNumber / formatMoney / formatIsoDate).
    <div dir={dir} lang={locale} data-testid="tours-shell" data-latin-digits="" className="min-h-dvh bg-slate-50 text-slate-900">
      <a
        href="#tours-main"
        className="sr-only z-[60] rounded-lg bg-white px-4 py-2 font-semibold text-emerald-800 shadow focus:not-sr-only focus:fixed focus:start-3 focus:top-3"
      >
        {t("skipToContent")}
      </a>
      {bare ? null : (
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:px-6">
            <Link
              href={PARENT_APP_PATH}
              className="flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
              data-testid="back-to-lsevin"
            >
              <BackIcon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{t("backToLsevin")}</span>
              <span className="sr-only sm:hidden">{t("backToLsevin")}</span>
            </Link>
            <Link href="/tours" className="flex min-h-11 items-center gap-2 rounded-lg px-1 font-bold text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none">
              <Luggage className="size-5 text-emerald-700" aria-hidden="true" />
              <span>{t("brand")}</span>
            </Link>
            <nav aria-label={t("mainNav")} className="ms-auto hidden items-center gap-1 md:flex">
              {TABS.map((tab) => {
                const active = tab.match(pathname);
                return (
                  <Link
                    key={tab.key}
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none",
                      active ? "bg-emerald-50 text-emerald-800" : "text-slate-600 hover:bg-slate-100",
                    )}
                  >
                    <tab.icon className="size-4" aria-hidden="true" />
                    {t(tab.key)}
                  </Link>
                );
              })}
              <Link
                href="/tours/bookings"
                aria-current={pathname.startsWith("/tours/bookings") ? "page" : undefined}
                className="flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-slate-600 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none aria-[current=page]:bg-emerald-50 aria-[current=page]:text-emerald-800"
              >
                <Luggage className="size-4" aria-hidden="true" />
                {t("bookings")}
              </Link>
            </nav>
            <div className="ms-auto md:ms-1">
              <DisplaySettingsButton />
            </div>
          </div>
        </header>
      )}

      <main id="tours-main" tabIndex={-1} className={cn("mx-auto w-full max-w-6xl outline-none", !bare && "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-10")}>
        {children}
      </main>

      {bare ? null : (
        <nav
          aria-label={t("mainNav")}
          data-testid="tours-bottom-nav"
          className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
        >
          <ul className="mx-auto grid max-w-md grid-cols-4">
            {TABS.map((tab) => {
              const active = tab.match(pathname);
              return (
                <li key={tab.key}>
                  <Link
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none focus-visible:ring-inset",
                      active ? "text-emerald-800" : "text-slate-500",
                    )}
                  >
                    <span className={cn("flex h-7 w-12 items-center justify-center rounded-full", active && "bg-emerald-100")}>
                      <tab.icon className="size-5" aria-hidden="true" />
                    </span>
                    {t(tab.key)}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
    </div>
  );
}

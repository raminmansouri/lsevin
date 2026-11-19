"use client";

import { useEffect, useId, useState, type ReactNode } from "react";
import { ArrowLeft, BedDouble, Heart, Home, Luggage, Search, Settings2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { directionOf } from "@/features/tours/domain/content";
import { useToursPrefs } from "@/features/tours/ui/customer/prefs-context";
import { LanguageSelect } from "@/features/tours/ui/customer/shell/display-settings";
import { CalendarSwitcher } from "@/features/tours/ui/shared/calendar-switcher";
import { currencyName } from "@/features/tours/ui/shared/format";
import { LanguageLinks } from "@/components/locale/language-links";
import { Link, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { parentPathOf } from "../../domain/navigation";
import { LAST_EXPLORE_KEY } from "../../domain/search";

export const PARENT_APP_PATH = "/";

// A stay's own page is /stays/<slug> (served from p/<slug>): any first segment
// that is not one of the app's other sections.
const OTHER_SECTIONS = new Set(["explore", "city", "wishlist", "bookings", "intro"]);
const isStayPage = (p: string) => {
  const segment = p.split("/")[2];
  return Boolean(segment) && (segment === "p" || !OTHER_SECTIONS.has(segment));
};

function useBackTarget(pathname: string): string | null {
  const [lastExplore, setLastExplore] = useState<string | null>(null);
  useEffect(() => {
    try {
      setLastExplore(sessionStorage.getItem(LAST_EXPLORE_KEY));
    } catch {
      setLastExplore(null);
    }
  }, [pathname]);
  return parentPathOf(pathname, lastExplore);
}

const TABS = [
  { key: "home", href: "/stays", icon: Home, match: (p: string) => p === "/stays" },
  { key: "explore", href: "/stays/explore", icon: Search, match: (p: string) => p.startsWith("/stays/explore") || p.startsWith("/stays/city") || isStayPage(p) },
  { key: "wishlist", href: "/stays/wishlist", icon: Heart, match: (p: string) => p.startsWith("/stays/wishlist") },
  { key: "bookings", href: "/stays/bookings", icon: Luggage, match: (p: string) => p.startsWith("/stays/bookings") },
] as const;

function DisplaySettings() {
  const t = useTranslations("StayApp.prefs");
  const locale = useLocale();
  const prefs = useToursPrefs();
  const [open, setOpen] = useState(false);
  const langId = useId();
  const curId = useId();
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("open")}
          data-testid="stays-display-settings"
          className="flex size-11 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
        >
          <Settings2 className="size-5" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side={directionOf(locale) === "rtl" ? "left" : "right"} className="w-full overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{t("title")}</SheetTitle>
          <SheetDescription>{t("description")}</SheetDescription>
        </SheetHeader>
        <div className="space-y-5 px-4 pb-6">
          <div className="space-y-1.5">
            <label htmlFor={langId} className="text-sm font-semibold text-slate-800">
              {t("language")}
            </label>
            <LanguageSelect id={langId} />
          </div>
          <div className="space-y-1.5">
            <span className="text-sm font-semibold text-slate-800">{t("calendar")}</span>
            <CalendarSwitcher value={prefs.calendar} onChange={(c) => void prefs.setCalendar(c)} compact />
          </div>
          <div className="space-y-1.5">
            <label htmlFor={curId} className="text-sm font-semibold text-slate-800">
              {t("currency")}
            </label>
            <select
              id={curId}
              value={prefs.currency ?? ""}
              onChange={(e) => void prefs.setCurrency(e.target.value || null)}
              className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
            >
              <option value="">{t("chargedCurrency")}</option>
              {prefs.currencies.map((c) => (
                <option key={c} value={c}>
                  {currencyName(c, locale)} ({c})
                </option>
              ))}
            </select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/**
 * Stays sub-application chrome: back to Lsevin, brand, desktop navigation and a
 * mobile bottom bar (Home / Search / Saved / Trips). The intro renders bare.
 * One responsive DOM for every width — no hidden duplicate copy of the page.
 */
export function StaysShell({ children }: { children: ReactNode }) {
  const t = useTranslations("StayApp.nav");
  const locale = useLocale();
  const pathname = usePathname();
  const dir = directionOf(locale);
  const bare = pathname.startsWith("/stays/intro");
  const BackIcon = ArrowLeft; // mirrored in RTL by globals.css
  const back = useBackTarget(pathname);

  return (
    <div dir={dir} lang={locale} data-testid="stays-shell" data-latin-digits="" className="min-h-dvh bg-slate-50 text-slate-900">
      <a
        href="#stays-main"
        className="sr-only z-[60] rounded-lg bg-white px-4 py-2 font-semibold text-emerald-800 shadow focus:not-sr-only focus:fixed focus:start-3 focus:top-3"
      >
        {t("skipToContent")}
      </a>
      {bare ? null : (
        <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-3 sm:px-6">
            <Link
              href={back ?? PARENT_APP_PATH}
              // The main site home is a heavy page (~0.8 MB of data): fetch it only when tapped.
              prefetch={back ? undefined : false}
              className="flex min-h-11 items-center gap-1.5 rounded-full px-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
              data-testid={back ? "stays-back" : "stays-back-to-lsevin"}
            >
              <BackIcon className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">{back ? t("back") : t("backToLsevin")}</span>
              <span className="sr-only sm:hidden">{back ? t("back") : t("backToLsevin")}</span>
            </Link>
            <Link href="/stays" className="flex min-h-11 items-center gap-2 rounded-lg px-1 font-bold text-emerald-900 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none">
              <BedDouble className="size-5 text-emerald-700" aria-hidden="true" />
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
            </nav>
            <div className="ms-auto md:ms-1">
              <DisplaySettings />
            </div>
          </div>
        </header>
      )}

      <main id="stays-main" tabIndex={-1} className={cn("mx-auto w-full max-w-6xl outline-none", !bare && "pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-12")}>
        {children}
      </main>

      <footer className={cn("mx-auto w-full max-w-6xl px-4 pt-2 text-xs text-slate-500", bare ? "pb-6" : "pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-8")}>
        <LanguageLinks linkClassName="hover:text-emerald-800 hover:underline" />
      </footer>

      {bare ? null : (
        <nav
          aria-label={t("mainNav")}
          data-testid="stays-bottom-nav"
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

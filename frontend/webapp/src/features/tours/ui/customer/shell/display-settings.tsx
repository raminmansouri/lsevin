"use client";

import { useId, useState, useTransition } from "react";
import { Settings2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { writeSharedLocaleCookie } from "@/i18n/shared-locale-cookie";

import { CalendarSwitcher } from "../../shared/calendar-switcher";
import { currencyName } from "../../shared/format";
import { useToursPrefs } from "../prefs-context";

function nativeName(code: string) {
  try {
    return new Intl.DisplayNames([code], { type: "language" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/**
 * Switches the interface language while keeping the current page and its query
 * (filters, selected departure); the booking draft lives in sessionStorage, so
 * entered traveler data survives too (C-018, AT-31).
 */
export function LanguageSelect({ id }: { id?: string }) {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const prefs = useToursPrefs();
  const [pending, start] = useTransition();
  return (
    <select
      id={id}
      value={locale}
      disabled={pending}
      data-testid="language-select"
      onChange={(e) => {
        const next = e.target.value;
        writeSharedLocaleCookie(next);
        const target = `${pathname}${window.location.search}${window.location.hash}`;
        // A just-changed calendar/currency must be saved before the new-language page renders.
        start(async () => {
          await prefs.flush();
          router.replace(target, { locale: next });
        });
      }}
      className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
    >
      {routing.locales.map((l) => (
        <option key={l} value={l} lang={l}>
          {nativeName(l)}
        </option>
      ))}
    </select>
  );
}

export function CurrencySelect({ id }: { id?: string }) {
  const t = useTranslations("TourApp.prefs");
  const locale = useLocale();
  const prefs = useToursPrefs();
  return (
    <select
      id={id}
      value={prefs.currency ?? ""}
      data-testid="currency-select"
      onChange={(e) => void prefs.setCurrency(e.target.value || null)}
      className="min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
    >
      <option value="">{t("currencyTour")}</option>
      {prefs.currencies.map((c) => (
        <option key={c} value={c}>
          {currencyName(c, locale)} ({c})
        </option>
      ))}
    </select>
  );
}

export function DisplaySettingsPanel() {
  const t = useTranslations("TourApp.prefs");
  const prefs = useToursPrefs();
  const langId = useId();
  const curId = useId();
  return (
    <div className="space-y-5">
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
        <CurrencySelect id={curId} />
        <p className="text-xs leading-5 text-slate-500">{t("currencyNote")}</p>
      </div>
      <p className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">{t("independentNote")}</p>
    </div>
  );
}

export function DisplaySettingsButton() {
  const t = useTranslations("TourApp");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.settings")}
          data-testid="display-settings"
          className="flex size-11 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
        >
          <Settings2 className="size-5" aria-hidden="true" />
        </button>
      </SheetTrigger>
      <SheetContent side={locale === "fa" || locale === "ar" || locale === "ku" ? "left" : "right"} className="w-full overflow-y-auto sm:max-w-sm">
        <SheetHeader>
          <SheetTitle>{t("prefs.title")}</SheetTitle>
          <SheetDescription className="sr-only">{t("prefs.independentNote")}</SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          <DisplaySettingsPanel />
        </div>
      </SheetContent>
    </Sheet>
  );
}

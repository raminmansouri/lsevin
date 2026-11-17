"use client";

import { useLocale, useTranslations } from "next-intl";

import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { contentLanguageFor, hreflangFor } from "@/lib/seo/language-tags";
import { cn } from "@/lib/utils";

import { persistLocaleChoice } from "./persist-locale-choice";

/**
 * Plain links to this page in every language, rendered on the server.
 *
 * Google (Managing multi-regional and multilingual sites): Googlebot crawls
 * from the US without Accept-Language and does not follow redirects by guessed
 * language, so each page should carry visible links to its other language
 * versions. The globe switcher is a dropdown that only exists after
 * JavaScript, so until 2026-11-15 no page had a crawlable language link.
 * Following one remembers the choice, like the switcher.
 */
export function LanguageLinks({ className, linkClassName }: { className?: string; linkClassName?: string }) {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <nav aria-label={t("label")} className={cn("flex flex-wrap gap-x-3 gap-y-1", className)} data-language-links>
      {routing.locales.map((option) => (
        <Link
          key={option}
          href={pathname}
          locale={option}
          prefetch={false}
          hrefLang={hreflangFor(option)}
          lang={contentLanguageFor(option)}
          aria-current={option === locale ? "page" : undefined}
          onClick={() => persistLocaleChoice(option)}
          className={cn(option === locale && "font-semibold", linkClassName)}
        >
          {t(option)}
        </Link>
      ))}
    </nav>
  );
}

"use client";

import { useTransition } from "react";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { markLocaleChosenExplicitly } from "@/i18n/locale-by-country";

export default function LocaleSwitcher() {
  const t = useTranslations("LocaleSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [isPending, startTransition] = useTransition();

  const switchLocale = (nextLocale: string) => {
    // Persist the explicit choice immediately so the middleware keeps the user on
    // this language across navigation (including the browser Back button). Setting
    // it synchronously here also ensures the switch navigation itself isn't bounced
    // back by the cookie-vs-URL guard in middleware.
    document.cookie = `NEXT_LOCALE=${nextLocale};path=/;max-age=31536000;samesite=lax`;
    // Lock in the explicit choice so location-based auto-switching won't override it.
    markLocaleChosenExplicitly();
    startTransition(() => {
      router.replace(
        // @ts-expect-error -- TypeScript will validate that only known `params`
        // are used in combination with a given `pathname`. Since the two will
        // always match for the current route, we can skip runtime checks.
        { pathname, params },
        { locale: nextLocale }
      );
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" disabled={isPending}>
          <Globe className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">{t("label")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {routing.locales.map((localeOption) => (
          <DropdownMenuItem
            key={localeOption}
            onClick={() => switchLocale(localeOption)}
            className={locale === localeOption ? "font-bold" : ""}
          >
            {t(localeOption)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

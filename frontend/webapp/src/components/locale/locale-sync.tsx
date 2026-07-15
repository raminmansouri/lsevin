"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";

import { getDirection } from "@/config/locales";
import { hasExplicitLocaleChoice } from "@/i18n/locale-by-country";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { LocaleTypes } from "@/types/common";

function readCookieLocale(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
  const value = match?.[1] ? decodeURIComponent(match[1]) : null;
  return value && (routing.locales as readonly string[]).includes(value) ? value : null;
}

/**
 * Keeps the visible locale aligned with the visitor's explicit choice across
 * navigations the server middleware never sees — browser Back/Forward (served
 * from the App Router client cache) and full bfcache restores (`pageshow`).
 *
 * Without this, tapping Back after switching language re-shows a pre-switch
 * history entry (e.g. /fa/...) in the old language even though NEXT_LOCALE says
 * otherwise. Here we detect the mismatch on the client and `router.replace` to
 * the chosen locale (replace, so we don't grow the history stack). Only acts
 * once the visitor has explicitly picked a language — new visitors are untouched.
 *
 * Also mirrors <html lang>/<dir> to the active locale on every route change so
 * soft navigations that change locale don't leave a stale direction on <html>.
 */
export function LocaleSync() {
  const activeLocale = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  // Mirror <html lang/dir> to whatever locale is actually rendering.
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.lang = activeLocale;
    root.dir = getDirection(activeLocale as LocaleTypes);
  }, [activeLocale]);

  useEffect(() => {
    function reconcile() {
      if (!hasExplicitLocaleChoice()) return;
      const cookieLocale = readCookieLocale();
      if (!cookieLocale) return;

      const seg = window.location.pathname.split("/").filter(Boolean)[0];
      const urlLocale = (routing.locales as readonly string[]).includes(seg)
        ? seg
        : routing.defaultLocale;

      if (urlLocale !== cookieLocale) {
        // `pathname` from @/i18n/navigation is already locale-stripped; re-issue it
        // under the chosen locale. Converges after one hop (urlLocale === cookie).
        router.replace(pathname, { locale: cookieLocale });
      }
    }

    reconcile();
    window.addEventListener("popstate", reconcile);
    window.addEventListener("pageshow", reconcile);
    return () => {
      window.removeEventListener("popstate", reconcile);
      window.removeEventListener("pageshow", reconcile);
    };
  }, [pathname, activeLocale, router]);

  return null;
}

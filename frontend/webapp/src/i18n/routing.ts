import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fa", "tr", "es", "ar", "ku", "de", "fr"],
  defaultLocale: "fa",
  // Persian (fa) is the firm default for NEW visitors. Disable Accept-Language
  // detection so the browser can't override it — visiting "/" always lands on "/fa".
  // Once a visitor explicitly switches language, that choice is remembered in the
  // NEXT_LOCALE cookie and kept across navigation (incl. browser Back) by the
  // middleware, so only the user decides when the language changes.
  localeDetection: false,
  localeCookie: true,
});
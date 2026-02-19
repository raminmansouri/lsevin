import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "fa", "tr", "es", "ar", "ku", "de", "fr"],
  defaultLocale: "fa",
  localeDetection: true,
  localeCookie: false // ✅ stop NEXT_LOCALE from overriding Accept-Language
});
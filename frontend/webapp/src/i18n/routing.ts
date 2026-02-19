import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  // A list of all locales that are supported
  locales: ["en", "fa", "tr", "es", "ar", "ku", "de", "fr"],

  // Used when no locale matches
  defaultLocale: "fa",
  localeDetection: true,
});

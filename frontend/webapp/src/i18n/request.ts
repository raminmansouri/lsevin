import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment. Can be undefined for
  // requests outside the [locale] tree (root layout, not-found, some server
  // actions) — fall back to the default locale so we never try to import
  // `messages/undefined.json`, which throws and breaks rendering / sign-in.
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  const en = (await import(`../../messages/en.json`)).default;
  const current = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages: {
      ...en,
      ...current,
    },
  };
});

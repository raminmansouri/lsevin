import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";

import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  // Typically corresponds to the `[locale]` segment
  const locale = await requestLocale;

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

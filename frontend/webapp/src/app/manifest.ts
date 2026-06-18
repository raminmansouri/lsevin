import { MetadataRoute } from "next";
import { getTranslations } from "next-intl/server";

import { routing } from "@/i18n/routing";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const t = await getTranslations({
    locale: routing.defaultLocale,
    namespace: "Manifest",
  });

  return {
    name: t("name"),
    short_name: t("name"),
    start_url: "/",
    scope: "/",
    // `standalone` is what gives the installed PWA its full-screen, no-browser-
    // chrome "native app" presentation on home-screen launch.
    display: "standalone",
    orientation: "portrait",
    theme_color: "#101E33",
    background_color: "#101E33",
    // NOTE: add 192x192 + 512x512 (incl. a `maskable`) PNG icons here to make the
    // app installable with a proper home-screen icon — no icon assets exist yet.
  };
}

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
    short_name: "LSevin",
    id: "/",
    start_url: "/",
    scope: "/",
    // `standalone` is what gives the installed PWA its full-screen, no-browser-
    // chrome "native app" presentation on home-screen launch.
    display: "standalone",
    orientation: "portrait",
    theme_color: "#101E33",
    background_color: "#101E33",
    icons: [
      {
        src: "/pwa/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}

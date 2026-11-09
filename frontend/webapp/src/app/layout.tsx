import type { Metadata, Viewport } from "next";

import { seoOrigin } from "@/lib/seo/origin";

// Enamad (Iran's e-commerce trust-seal authority) verifies domain ownership by
// looking for this exact meta tag in the served HTML — it has to be site-wide
// and present on every response, which is exactly what the root layout's
// `metadata` export gives for free (Next renders it into every page's <head>,
// no manual <head> JSX needed/possible this deep in the App Router).
export const metadata: Metadata = {
  metadataBase: new URL(seoOrigin()),
  title: {
    default: "LSevin",
    template: "%s | LSevin",
  },
  description: "LSevin",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "LSevin", statusBarStyle: "default" },
  icons: { apple: "/pwa/apple-touch-icon.png" },
  other: {
    enamad: "51635800",
  },
};

export const viewport: Viewport = { themeColor: "#101E33" };

// The root layout only carries site-wide metadata. The <html>/<body> document is
// rendered one level down by the layouts that know the language
// (app/[locale]/layout.tsx and the financial panel, both via RootDocument), so
// the server HTML says <html lang="en" dir="ltr"> on /en instead of the default
// locale on every page. app/not-found.tsx and app/global-error.tsx render their
// own document.
//
// Do NOT call any next-intl server API (getLocale/getMessages/...) here: this
// layout renders above the [locale] segment, so during static generation of a
// non-default locale that call runs before setRequestLocale() and pins every
// later ambient getTranslations() on that page to the default locale.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}

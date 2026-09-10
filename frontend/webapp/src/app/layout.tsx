import localFont from "next/font/local";
import Script from "next/script";

import { env } from "@/config/env/client";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";

import "./globals.css";

// Vazirmatn (Persian font) served from local files — no Google CDN. The variable
// woff2 covers weights 100–900. Exposed as the `--font-vazirmatn` CSS variable so
// globals.css can apply it to Persian (fa) content.
//
// The committed woff2 is a subset, not the upstream release — see
// scripts/subset-font.sh before replacing it.
//
// `preload: false` because globals.css applies this font to `html[lang="fa"]`
// alone, while this layout sits above the [locale] segment and therefore runs for
// every locale. With preloading on, Next listed the font in the font manifest of
// 315 of 316 routes, so English, Turkish, Arabic, Russian and Chinese visitors
// each fetched 86 KB at high priority for a face their pages never apply. Without
// it the font is requested only when the `lang="fa"` rule actually matches, and
// `display: "swap"` means Persian text renders in Tahoma until it lands rather
// than waiting on it.
const vazirmatn = localFont({
  src: [
    {
      path: "../../public/fonts/Vazirmatn-Variable.woff2",
      weight: "100 900",
      style: "normal",
    },
  ],
  variable: "--font-vazirmatn",
  display: "swap",
  preload: false,
});

// The single <html>/<body> for the whole app — it wraps the [locale] tree, the
// (financial) tree and the root not-found, so it must stay a plain root layout.
//
// `lang`/`dir` are rendered with the DEFAULT locale only. This layout sits above
// the [locale] segment, so it cannot read the locale param, and it must NOT call
// next-intl's `getLocale()`/`getMessages()` here: during static generation of a
// non-default locale (e.g. /tr, /en) that call runs before the [locale] layout's
// `setRequestLocale`, resolves to the default, and — because next-intl memoises
// the request config per render — pins every later `getMessages()` in that page
// to the default too. That was the "client components and the bottom nav stay
// Persian on /tr and /en" bug. `LocaleSync` (mounted in the [locale] providers)
// mirrors the real locale onto <html lang/dir> on the client after hydration.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={vazirmatn.variable}
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <ServiceWorkerRegister />
        {env.NEXT_PUBLIC_CRM_ANALYTICS_URL && env.NEXT_PUBLIC_CRM_ANALYTICS_SITE_KEY && (
          <Script
            src={`${env.NEXT_PUBLIC_CRM_ANALYTICS_URL}/t.js`}
            data-site={env.NEXT_PUBLIC_CRM_ANALYTICS_SITE_KEY}
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}

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

// The single <html>/<body> for the whole app — it also wraps the (financial)
// tree and the root not-found, so it stays a plain root layout.
//
// It must NOT call any next-intl server API (getLocale/getMessages/...). This
// layout renders above the [locale] segment, so during static generation of a
// non-default locale that call runs before app/[locale]/layout.tsx's
// setRequestLocale(), resolves to the default locale, and — because next-intl
// memoises the request config per render — pins every later ambient
// getTranslations()/getFormatter() on that page to the default too. That was
// "/tr shop shows Mağaza and فروشگاه side by side": client components (their
// provider is passed an explicit locale) rendered tr, ambient server
// components rendered fa. `lang`/`dir` here are the default locale; LocaleSync
// (mounted in the [locale] providers) mirrors the real locale onto <html
// lang/dir> on the client after hydration.
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

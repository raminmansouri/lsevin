import localFont from "next/font/local";
import Script from "next/script";

import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { env } from "@/config/env/client";

import "./globals.css";

// Vazirmatn (Persian font) served from local files — no Google CDN. The variable
// woff2 covers weights 100–900. Exposed as the `--font-vazirmatn` CSS variable so
// globals.css can apply it to Persian (fa) content.
//
// The committed woff2 is a subset, not the upstream release — see
// scripts/subset-font.sh before replacing it.
//
// `preload: false` because globals.css applies this font to `html[lang="fa"]`
// alone. With preloading on, Next listed the font in the font manifest of 315 of
// 316 routes, so English, Turkish, Arabic, Russian and Chinese visitors each
// fetched 86 KB at high priority for a face their pages never apply. Without it
// the font is requested only when the `lang="fa"` rule actually matches, and
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

/**
 * The <html>/<body> document. It is rendered by the layouts that know the page
 * language — app/[locale]/layout.tsx (from the URL segment) and the financial
 * panel (Persian only) — so the server HTML carries the real `lang`/`dir`.
 * When the root layout rendered it, every locale was served as
 * `<html lang="fa" dir="rtl">` and only a client script corrected it, so
 * crawlers and link previews reading the HTML saw English and Arabic pages
 * declared as Persian.
 */
export function RootDocument({
  lang,
  dir,
  children,
}: {
  lang: string;
  dir: "rtl" | "ltr";
  children: React.ReactNode;
}) {
  return (
    <html
      lang={lang}
      dir={dir}
      className={vazirmatn.variable}
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <ServiceWorkerRegister />
        {env.NEXT_PUBLIC_CRM_ANALYTICS_URL &&
          env.NEXT_PUBLIC_CRM_ANALYTICS_SITE_KEY && (
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

import { getLocale } from "next-intl/server";
import localFont from "next/font/local";

import { getDirection } from "@/config/locales";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { LocaleTypes } from "@/types/common";

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

// This is the single <html>/<body> for the whole app. The locale comes from the
// next-intl middleware (available via getLocale even though this layout sits
// above the [locale] segment), so `lang` and `dir` are set here — that makes RTL
// apply to the real document element for Persian/Arabic/Kurdish.
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();

  return (
    <html
      lang={locale}
      dir={getDirection(locale as LocaleTypes)}
      className={vazirmatn.variable}
      suppressHydrationWarning
    >
      <body className="antialiased" suppressHydrationWarning>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}

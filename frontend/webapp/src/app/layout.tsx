import { getLocale } from "next-intl/server";
import localFont from "next/font/local";

import { getDirection } from "@/config/locales";
import { LocaleTypes } from "@/types/common";

import "./globals.css";

// Vazirmatn (Persian font) served from local files — no Google CDN. The variable
// woff2 covers weights 100–900. Exposed as the `--font-vazirmatn` CSS variable so
// globals.css can apply it to Persian (fa) content.
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
      </body>
    </html>
  );
}

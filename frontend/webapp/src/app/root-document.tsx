import Script from "next/script";

import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { env } from "@/config/env/client";

import "./globals.css";
import "./fonts.css";



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

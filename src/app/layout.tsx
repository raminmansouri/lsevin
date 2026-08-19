import type { Metadata } from "next";
import { getPortalLocale } from "@core/i18n/server";
import { coreCopy } from "@core/i18n/copy";
import { translatePortalText } from "@core/i18n/translate";
import { PortalLocaleProvider } from "@core/i18n/PortalLocaleProvider";
import { PortalTranslationObserver } from "@core/ui/PortalTranslationObserver";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getPortalLocale();
  return {
    title: `LSevin · ${coreCopy(locale.locale, "portalName")}`,
    description: translatePortalText(locale.locale, "Provider onboarding, operations and finance portal for LSevin marketplace partners."),
  };
}

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getPortalLocale();
  return (
    <html lang={locale.locale} dir={locale.direction}>
      <body><PortalLocaleProvider locale={locale.header}><PortalTranslationObserver />{children}</PortalLocaleProvider></body>
    </html>
  );
}

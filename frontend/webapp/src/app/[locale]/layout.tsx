import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
<<<<<<< HEAD
=======
// import { Vazirmatn } from "next/font/google";
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
import { notFound } from "next/navigation";

import { Providers } from "@/components/providers";
import { routing } from "@/i18n/routing";
import { LocalePageProps } from "@/types/next";
import { getDirection } from "@/config/locales";
import { LocaleTypes } from "@/types/common";

<<<<<<< HEAD
import "../globals.css";
=======
// const vazirmatn = Vazirmatn({
//   subsets: ["latin"],
//   variable: "--font-vazirmatn",
//   display: "swap",
// });
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: Omit<LocalePageProps, "children">
) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "LocaleLayout" });

  return {
    title: {
      default: t("title"),
      template: `${t("title")} | %s`,
    },
    description: {
      default: t("description"),
      template: `${t("description")} | %s`,
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocalePageProps) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        dir={getDirection(locale as LocaleTypes)}
<<<<<<< HEAD
        className="antialiased"
=======
        className={` antialiased`}
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
  
}
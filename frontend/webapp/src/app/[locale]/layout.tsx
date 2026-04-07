import { Suspense } from "react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
// import { Vazirmatn } from "next/font/google";
import { notFound } from "next/navigation";

import { Providers } from "@/components/providers";
import { routing } from "@/i18n/routing";
import { LocalePageProps } from "@/types/next";

import "../globals.css";

import { LoadingSpinner } from "@/components/loading-spinner";
import { getDirection } from "@/config/locales";
import { LocaleTypes } from "@/types/common";

// const vazirmatn = Vazirmatn({
//   subsets: ["latin"],
//   variable: "--font-vazirmatn",
//   display: "swap",
// });

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

const RootSkeleton = () => {
  return (
    <div className="bg-background flex min-h-screen w-full animate-pulse items-center justify-center">
      <LoadingSpinner className="size-16" />
    </div>
  );
};

export default async function LocaleLayout({
  children,
  params,
}: LocalePageProps) {
  return (
    <Suspense fallback={<RootSkeleton />}>
      <SuspenseBoundary params={params}>
        <Providers>{children}</Providers>
      </SuspenseBoundary>
    </Suspense>
  );
}

const SuspenseBoundary = async ({ children, params }: LocalePageProps) => {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);
  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        dir={getDirection(locale as LocaleTypes)}
        className={` antialiased`}
        suppressHydrationWarning
      >
        <NextIntlClientProvider locale={locale}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
};

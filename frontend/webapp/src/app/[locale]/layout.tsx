import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Providers } from "@/components/providers";
import { routing } from "@/i18n/routing";
import { LocalePageProps } from "@/types/next";

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

  // <html>/<body>, lang and dir live in the root layout (src/app/layout.tsx).
  // This layout only wires up the locale providers for the segment.
  return (
    <NextIntlClientProvider locale={locale}>
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
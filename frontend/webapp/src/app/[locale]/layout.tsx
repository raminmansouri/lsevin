import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Providers } from "@/components/providers";
import { env } from "@/config/env/client";
import { getClientMessages } from "@/i18n/client-messages";
import { routing } from "@/i18n/routing";
import { LocalePageProps } from "@/types/next";

// Render localized pages dynamically (per request) instead of statically
// prerendering them at build time. Many pages fetch from the API / Postgres,
// which aren't reachable during `next build`, so prerendering them would time
// out. This matches how the app runs under `next dev`.
export const dynamic = "force-dynamic";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: Omit<LocalePageProps, "children">
) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "LocaleLayout" });

  return {
    // Without this every relative URL in an openGraph/twitter block resolves
    // against localhost at build time and Next logs a warning per page. Pages
    // that set `alternates` still supply their own absolute canonical.
    metadataBase: new URL(env.NEXT_PUBLIC_URL),
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
  //
  // Only the core namespaces go in here. Each top-level segment mounts its own
  // provider with the full set it needs, so a customer on the mobile app never
  // downloads the admin or provider-portal catalogs. Omitting `messages` would
  // send all ~66 namespaces to every page — see @/i18n/client-messages.
  const messages = await getClientMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Providers>{children}</Providers>
    </NextIntlClientProvider>
  );
}
import { setRequestLocale } from "next-intl/server";

import { AppShell } from "../n/app-shell";

type LocalePageProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

/** Public editorial pages (/about-us, /terms-conditions, ...) in the customer app chrome. */
export default async function SitePagesLayout({ children, params }: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  return <AppShell locale={locale}>{children}</AppShell>;
}

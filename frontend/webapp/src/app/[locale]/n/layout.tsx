import { setRequestLocale } from "next-intl/server";

import { AppShell } from "./app-shell";

type LocalePageProps = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function MainLayout({
  children,
  params,
}: LocalePageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <AppShell locale={locale}>{children}</AppShell>;
}

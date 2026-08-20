import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import MobileAppBar from "@/components/mobile-app-bar";
import Shell from "@/components/shell";
import { BottomTabBar } from "./app/design-system/mobile-components";
import { getClientMessages } from "@/i18n/client-messages";

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

  // The mobile app's own translation set. The root layout only provides the core
  // namespaces, so this provider carries the full list this tree needs — nothing
  // from the admin or provider-portal catalogs comes down to a customer's phone.
  const messages = await getClientMessages("mobileApp");

  // Shell's default page padding would float the app bar away from the top edge,
  // which is the giveaway that you are looking at a website. The app tree owns its
  // own spacing instead.
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Shell className="gap-0 py-0">
        {/* No gap: the app bar and each page's own header must meet without a seam. */}
        <div className="flex flex-col">
          <MobileAppBar />
          {children}
          <BottomTabBar />
        </div>
      </Shell>
    </NextIntlClientProvider>
  );
}
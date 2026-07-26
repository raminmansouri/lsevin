import { setRequestLocale } from "next-intl/server";
import MobileAppBar from "@/components/mobile-app-bar";
import Shell from "@/components/shell";
import { BottomTabBar } from "./app/design-system/mobile-components";
import { SupportFloatingWidgetServer } from "@/features/support";
import { getSession } from "@/lib/auth/session";

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

  const session=await getSession()

  // Shell's default page padding would float the app bar away from the top edge,
  // which is the giveaway that you are looking at a website. The app tree owns its
  // own spacing instead.
  return (
    <Shell className="gap-0 py-0">
      {/* No gap: the app bar and each page's own header must meet without a seam. */}
      <div className="flex flex-col">
        <MobileAppBar />
        {children}
        <SupportFloatingWidgetServer locale={locale} customerUserId={session?.user?.id} />
        <BottomTabBar />
      </div>
    </Shell>
  );
}
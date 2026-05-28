import { setRequestLocale } from "next-intl/server";
import Navbar from "@/components/navbar";
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

  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <Navbar />
        {children}
        <SupportFloatingWidgetServer locale={locale} customerUserId={session?.user?.id} />
        <BottomTabBar />
      </div>
    </Shell>
  );
}
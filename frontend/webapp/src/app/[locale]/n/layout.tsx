<<<<<<< HEAD
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
=======
import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import Navbar from "@/components/navbar";
import Shell from "@/components/shell";
import { LocalePageProps } from "@/types/next";
import { BottomTabBar } from "./app/design-system/mobile-components";

const MainLayout = ({ children, params }: LocalePageProps) => {
  return (
    <Shell>
      <Suspense>
        <SuspenseBoundary params={params}>
          <div className="flex flex-col gap-4">
            <Navbar />
            {children}

            <BottomTabBar />
            
          </div>
        </SuspenseBoundary>
      </Suspense>
    </Shell>
  );
};

const SuspenseBoundary = async ({ children, params }: LocalePageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <div>{children}</div>;
};

export default MainLayout;
>>>>>>> d8568000f5551fc8b98d4ef0d4dbce5c6f700965

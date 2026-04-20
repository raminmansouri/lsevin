import { setRequestLocale } from "next-intl/server";
import Navbar from "@/components/navbar";
import Shell from "@/components/shell";
import { BottomTabBar } from "./app/design-system/mobile-components";

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

  return (
    <Shell>
      <div className="flex flex-col gap-4">
        <Navbar />
        {children}
        <BottomTabBar />
      </div>
    </Shell>
  );
}
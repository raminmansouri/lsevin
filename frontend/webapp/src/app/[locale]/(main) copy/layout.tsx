import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import Navbar from "@/components/navbar";
import Shell from "@/components/shell";
import { LocalePageProps } from "@/types/next";

const MainLayout = ({ children, params }: LocalePageProps) => {
  return (
    <Shell>
      <Suspense>
        <SuspenseBoundary params={params}>
          <div className="flex flex-col gap-4">
            <Navbar />
            {children}
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

import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import Navbar from "@/components/navbar";
import Shell from "@/components/shell";
import { getClientMessages } from "@/i18n/client-messages";
import { LocalePageProps } from "@/types/next";

const MainLayout = async ({ children, params }: LocalePageProps) => {
  // The public marketing tree — the browse/type pages and their filters.
  const messages = await getClientMessages("marketing");

  return (
    <NextIntlClientProvider messages={messages}>
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
    </NextIntlClientProvider>
  );
};

const SuspenseBoundary = async ({ children, params }: LocalePageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <div>{children}</div>;
};

export default MainLayout;

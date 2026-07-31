import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";

import { AuthContentSkeleton } from "@/features/auth/components/shared/auth-content-skeleton";
import AuthNav, {
  AuthNavSkeleton,
} from "@/features/auth/components/shared/auth-nav";
import { getClientMessages } from "@/i18n/client-messages";
import { LocalePageProps } from "@/types/next";

export default async function AuthLayout({ children, params }: LocalePageProps) {
  // Sign-in only needs the core chrome namespaces.
  const messages = await getClientMessages("auth");

  return (
    <NextIntlClientProvider messages={messages}>
      <div className="bg-background min-h-screen">
        <Suspense fallback={<AuthNavSkeleton />}>
          <SuspenseBoundary params={params}>
            <AuthNav />
          </SuspenseBoundary>
        </Suspense>

        <div className="min-h-screen-header relative flex flex-col items-center justify-center px-3 py-6 sm:px-6 sm:py-16 md:container lg:px-8">
          <Suspense fallback={<AuthContentSkeleton />}>
            <SuspenseBoundary params={params}>{children}</SuspenseBoundary>
          </Suspense>
        </div>
      </div>
    </NextIntlClientProvider>
  );
}

const SuspenseBoundary = async ({ children, params }: LocalePageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <div>{children}</div>;
};

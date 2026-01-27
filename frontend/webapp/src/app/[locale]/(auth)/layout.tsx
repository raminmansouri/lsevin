import { Suspense } from "react";
import { setRequestLocale } from "next-intl/server";

import { AuthContentSkeleton } from "@/features/auth/components/shared/auth-content-skeleton";
import AuthNav, {
  AuthNavSkeleton,
} from "@/features/auth/components/shared/auth-nav";
import { LocalePageProps } from "@/types/next";

export default function AuthLayout({ children, params }: LocalePageProps) {
  return (
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
  );
}

const SuspenseBoundary = async ({ children, params }: LocalePageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <div>{children}</div>;
};

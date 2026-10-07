import { privateMetadata } from "@/lib/seo/robots-policy";

export const metadata = privateMetadata;

import { Suspense } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { AuthContentSkeleton } from "@/features/auth/components/shared/auth-content-skeleton";
import AuthNav, {
  AuthNavSkeleton,
} from "@/features/auth/components/shared/auth-nav";
import { getClientMessages } from "@/i18n/client-messages";
import { Link } from "@/i18n/navigation";
import { LocalePageProps } from "@/types/next";

// This whole segment renders per request (session-gated dashboards / forms /
// marketing pages that read the DB). The dynamic floor that used to sit on
// `[locale]/layout.tsx` now lives here.
export const dynamic = "force-dynamic";


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
          <PrivacyPolicyLink params={params} />
        </div>
      </div>
    </NextIntlClientProvider>
  );
}

// Signed-out visitors can only be here (sign-in / sign-up / OTP / reset), so this is the
// place the public policy has to be reachable from.
const PrivacyPolicyLink = async ({ params }: { params: LocalePageProps["params"] }) => {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "MobileProfile.privacyPolicy" });
  return (
    <Link href="/privacy-policy" className="text-muted-foreground mt-6 text-xs underline underline-offset-4">
      {t("title")}
    </Link>
  );
};

const SuspenseBoundary = async ({ children, params }: LocalePageProps) => {
  const { locale } = await params;
  setRequestLocale(locale);

  return <div>{children}</div>;
};

import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { Skeleton } from "@/components/ui/skeleton";
import { TRANSLATION_KEY } from "@/features/auth/actions/verify-otp/types";
import { getAuthPageContent } from "@/features/auth/db/auth-content.queries";
import OtpForm, {
  OtpFormSkeleton,
} from "@/features/auth/components/otp/otp-form";
import AuthLinksContainer from "@/features/auth/components/shared/auth-links-container";
import AuthPageHeader from "@/features/auth/components/shared/auth-page-header";
import { readOtpChallengePhone } from "@/features/auth/lib/otp-challenge";
import { Link, redirect } from "@/i18n/navigation";
import { LocalePageProps, LocaleParams } from "@/types/next";

// This page is a gate: with no challenge cookie it must redirect, and a redirect
// thrown after a prerendered shell has been committed arrives as an instruction
// inside an HTTP 200 with markup already on the wire. Opting out of the static
// shell is what turns it back into a real 307 with no body.
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: Omit<LocalePageProps, "children">
) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: TRANSLATION_KEY });
  const content = await getAuthPageContent(locale, "otp", {
    title: t("page.title"),
    description: "",
  });

  return {
    title: content.title,
    description: content.description,
  };
}

const OtpBoundarySkeleton = () => {
  return (
    <>
      <div className="flex flex-col gap-2">
        <Skeleton className="h-5 w-64" />
      </div>
      <OtpFormSkeleton />
    </>
  );
};

const signInHref = (redirectTo?: string) =>
  redirectTo ? `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}` : "/sign-in";

const OtpPage = async ({
  params,
  searchParams,
}: {
  params: Promise<LocaleParams>;
  searchParams: Promise<{ redirectTo?: string }>;
}) => {
  // The number being verified comes from the httpOnly cookie that sign-in and
  // sign-up set, not from the URL. No cookie means the visitor either opened /otp
  // directly or let the challenge expire; either way there is nothing to verify.
  //
  // This check has to happen here rather than inside the Suspense boundary below:
  // a redirect thrown while streaming arrives as an instruction inside an HTTP 200
  // whose shell has already been sent. For a gate on an auth screen we want the
  // real 307 and no markup at all.
  const phoneNumber = await readOtpChallengePhone();
  if (!phoneNumber) {
    const { locale } = await params;
    const { redirectTo } = await searchParams;
    redirect({ href: signInHref(redirectTo), locale });
  }

  return (
    <Suspense fallback={<OtpBoundarySkeleton />}>
      <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
        {async (t) => {
          const { locale } = await params;
          const { redirectTo } = await searchParams;

          const content = await getAuthPageContent(locale, "otp", {
            title: t("page.title"),
            description: t("page.description", { mobile: phoneNumber }),
          });

          return (
            <div>
              <AuthPageHeader
                eyebrow={content.eyebrow}
                title={content.title}
                description={content.description}
                imageUrl={content.mediaUrl}
                imageAlt={content.alt}
              />
              <OtpForm phoneNumber={phoneNumber} redirectTo={redirectTo} />
              <AuthLinksContainer>
                <span className="text-xs">
                  {t("page.wrongNumber")}
                  <Link className="text-primary mx-1" href={signInHref(redirectTo)}>
                    {t("page.changeNumber")}
                  </Link>
                </span>
              </AuthLinksContainer>
            </div>
          );
        }}
      </LocaleBoundary>
    </Suspense>
  );
};

export default OtpPage;

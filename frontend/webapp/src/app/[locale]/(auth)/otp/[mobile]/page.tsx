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
import { Link } from "@/i18n/navigation";
import { LocalePageProps, LocaleParams } from "@/types/next";

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

type OtpPageParams = LocaleParams & {
  mobile: string;
};

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

const OtpPage = ({ params }: { params: Promise<OtpPageParams> }) => {
  return (
    <Suspense fallback={<OtpBoundarySkeleton />}>
      <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
        {async (t) => {
          const { locale, mobile } = await params;
          const decodedMobile = decodeURIComponent(mobile);
          const content = await getAuthPageContent(locale, "otp", {
            title: t("page.title"),
            description: t("page.description", { mobile: decodedMobile }),
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
              <OtpForm phoneNumber={decodedMobile} />
              <AuthLinksContainer>
                <span className="text-xs">
                  {t("page.wrongNumber")}
                  <Link className="text-primary mx-1" href="/sign-in">
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

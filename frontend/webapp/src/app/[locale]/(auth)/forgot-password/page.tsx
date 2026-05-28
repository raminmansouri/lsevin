import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { TRANSLATION_KEY } from "@/features/auth/actions/forgot-password/types";
import { getAuthPageContent } from "@/features/auth/db/auth-content.queries";
import ForgotPasswordForm, {
  ForgotPasswordFormSkeleton,
} from "@/features/auth/components/forgot-password/forgot-password-form";
import AuthLinksContainer from "@/features/auth/components/shared/auth-links-container";
import AuthPageHeader from "@/features/auth/components/shared/auth-page-header";
import { Link } from "@/i18n/navigation";
import { LocalePageProps, LocaleParams } from "@/types/next";

export async function generateMetadata(
  props: Omit<LocalePageProps, "children">
) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: TRANSLATION_KEY });
  const content = await getAuthPageContent(locale, "forgot-password", {
    title: t("page.title"),
    description: t("page.description"),
  });

  return {
    title: content.title,
    description: content.description,
  };
}

const ForgotPasswordPage = ({ params }: { params: Promise<LocaleParams> }) => {
  return (
    <Suspense fallback={<ForgotPasswordFormSkeleton />}>
      <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
        {async (t) => {
          const { locale } = await params;
          const content = await getAuthPageContent(locale, "forgot-password", {
            title: t("page.title"),
            description: t("page.description"),
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
              <Suspense fallback={<ForgotPasswordFormSkeleton />}>
                <ForgotPasswordForm />
              </Suspense>
              <AuthLinksContainer>
                <span className="text-xs">
                  {t("page.rememberPassword")}
                  <Link className="text-primary mx-1" href="/sign-in">
                    {t("page.login")}
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

export default ForgotPasswordPage;

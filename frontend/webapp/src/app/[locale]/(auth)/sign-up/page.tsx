import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { TRANSLATION_KEY } from "@/features/auth/actions/sign-up/types";
import { getAuthPageContent } from "@/features/auth/db/auth-content.queries";
import AuthLinksContainer from "@/features/auth/components/shared/auth-links-container";
import AuthPageHeader from "@/features/auth/components/shared/auth-page-header";
import SignUpForm, {
  SignUpFormSkeleton,
} from "@/features/auth/components/sign-up/sign-up-form";
import { Link } from "@/i18n/navigation";
import { LocalePageProps, LocaleParams } from "@/types/next";

export async function generateMetadata(
  props: Omit<LocalePageProps, "children">
) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: TRANSLATION_KEY });
  const content = await getAuthPageContent(locale, "sign-up", {
    title: t("page.title"),
    description: t("page.description"),
  });

  return {
    title: content.title,
    description: content.description,
  };
}

const SignUpPage = ({ params, searchParams }: { params: Promise<LocaleParams>; searchParams: Promise<{ redirectTo?: string }> }) => {
  return (
    <Suspense fallback={<SignUpFormSkeleton />}>
      <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
        {async (t) => {
          const { locale } = await params;
          const content = await getAuthPageContent(locale, "sign-up", {
            title: t("page.title"),
            description: t("page.description"),
          });
          const { redirectTo } = await searchParams;

          return (
            <div>
              <AuthPageHeader
                eyebrow={content.eyebrow}
                title={content.title}
                description={content.description}
                imageUrl={content.mediaUrl}
                imageAlt={content.alt}
              />
              <Suspense fallback={<SignUpFormSkeleton />}>
                <SignUpForm />
              </Suspense>
              <AuthLinksContainer className="justify-center">
                <span className="text-xs">
                  {t("page.alreadyHaveAccount")}
                  <Link className="text-primary mx-1" href={redirectTo ? `/sign-in?redirectTo=${encodeURIComponent(redirectTo)}` : "/sign-in"}>
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

export default SignUpPage;

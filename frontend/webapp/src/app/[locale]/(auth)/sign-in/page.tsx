import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import { TRANSLATION_KEY } from "@/features/auth/actions/sign-in/types";
import AuthLinksContainer from "@/features/auth/components/shared/auth-links-container";
import AuthPageHeader from "@/features/auth/components/shared/auth-page-header";
import SignInForm, {
  SignInFormSkeleton,
} from "@/features/auth/components/sign-in/sign-in-form";
import { Link } from "@/i18n/navigation";
import { LocalePageProps, LocaleParams } from "@/types/next";

export async function generateMetadata(
  props: Omit<LocalePageProps, "children">
) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: TRANSLATION_KEY });
  return {
    title: t("page.title"),
  };
}

const SignInPage = ({ params }: { params: Promise<LocaleParams> }) => {
  return (
    <Suspense fallback={<SignInFormSkeleton />}>
      <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
        {(t) => (
          <div>
            <AuthPageHeader
              title={t("page.title")}
              description={t("page.description")}
            />
            <Suspense fallback={<SignInFormSkeleton />}>
              <SignInForm />
            </Suspense>
            <AuthLinksContainer>
              <span className="text-xs">
                {t("page.noAccount")}
                <Link className="text-primary mx-1" href="/sign-up">
                  {t("page.signUp")}
                </Link>
              </span>
              <Link href="/forgot-password">
                <span className="text-primary text-xs">
                  {t("page.forgotPassword")}
                </span>
              </Link>
            </AuthLinksContainer>
          </div>
        )}
      </LocaleBoundary>
    </Suspense>
  );
};

export default SignInPage;

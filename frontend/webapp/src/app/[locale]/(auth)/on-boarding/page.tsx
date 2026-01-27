import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import OnBoardingCard, {
  OnBoardingCardSkeleton,
} from "@/features/auth/components/on-boarding/on-boarding-card";
import { LocalePageProps, LocaleParams } from "@/types/next";

const TRANSLATION_KEY = "Auth.OnBoarding";

export async function generateMetadata(
  props: Omit<LocalePageProps, "children">
) {
  const { locale } = await props.params;
  const t = await getTranslations({ locale, namespace: "Manifest" });

  return {
    title: t("name"),
  };
}

const OnBoardingPage = ({ params }: { params: Promise<LocaleParams> }) => {
  return (
    <Suspense fallback={<OnBoardingCardSkeleton />}>
      <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
        {(_) => <OnBoardingCard />}
      </LocaleBoundary>
    </Suspense>
  );
};

export default OnBoardingPage;

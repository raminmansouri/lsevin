import { Suspense } from "react";
import { getTranslations } from "next-intl/server";

import LocaleBoundary from "@/components/locale/locale-boundary";
import {
  getAuthOnboardingSteps,
  type AuthOnboardingStepContent,
} from "@/features/auth/db/auth-content.queries";
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

function buildFallbackSteps(t: (key: string) => string): AuthOnboardingStepContent[] {
  return [
    {
      itemKey: "step-1",
      title: t("step1.title"),
      description: t("step1.description"),
      mediaUrl: "/images/board-step-1.png",
      primaryButton: t("step1.primaryButton"),
      secondaryButton: t("step1.secondaryButton"),
      secondaryButtonUrl: "/sign-in",
    },
    {
      itemKey: "step-2",
      title: t("step2.title"),
      description: t("step2.description"),
      mediaUrl: "/images/board-step-2.png",
      primaryButton: t("step2.primaryButton"),
      primaryButtonUrl: "/sign-up",
      secondaryButton: t("step2.secondaryButton"),
      secondaryButtonUrl: "/sign-in",
    },
  ];
}

const OnBoardingPage = ({ params }: { params: Promise<LocaleParams> }) => {
  return (
    <Suspense fallback={<OnBoardingCardSkeleton />}>
      <LocaleBoundary params={params} tanslationNameSpace={TRANSLATION_KEY}>
        {async (t) => {
          const { locale } = await params;
          const steps = await getAuthOnboardingSteps(locale, buildFallbackSteps(t));

          return <OnBoardingCard steps={steps} />;
        }}
      </LocaleBoundary>
    </Suspense>
  );
};

export default OnBoardingPage;

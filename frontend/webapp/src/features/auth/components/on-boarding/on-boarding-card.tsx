"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Skeleton } from "@/components/ui/skeleton";
import { useCarouselNavigation } from "@/components/ui/use-carousel-navigation";
import { useRouter } from "@/i18n/navigation";
import { type AuthOnboardingStepContent } from "@/features/auth-content/types/auth-content.types";

type Props = {
  steps: AuthOnboardingStepContent[];
};

const DEFAULT_PRIMARY_URL = "/sign-up";
const DEFAULT_SECONDARY_URL = "/sign-in";

const OnBoardingCard = ({ steps }: Props) => {
  const router = useRouter();
  const safeSteps = steps.length ? steps : [];
  const { setApi, currentIndex, scrollToIndex } = useCarouselNavigation();

  const handleNext = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();

    if (currentIndex < safeSteps.length - 1) {
      scrollToIndex(currentIndex + 1);
      return;
    }

    router.push(safeSteps[currentIndex]?.primaryButtonUrl || DEFAULT_PRIMARY_URL);
  };

  const handleSecondaryButton = () => {
    router.push(safeSteps[currentIndex]?.secondaryButtonUrl || DEFAULT_SECONDARY_URL);
  };

  const step = safeSteps[currentIndex];

  return (
    <div className="max-w-md p-1 md:p-0">
      <Card className="border-primary bg-primary p-2 shadow-lg">
        <Carousel
          setApi={setApi}
          className="w-full cursor-grab active:cursor-grabbing"
          opts={{
            align: "start",
            loop: false,
          }}
        >
          <CarouselContent className="cursor-grab active:cursor-grabbing">
            {safeSteps.map((step, index) => (
              <CarouselItem key={step.id || step.itemKey || index}>
                <div className="bg-background mb-1 rounded-lg">
                  <div className="relative flex h-[216px] w-full items-center justify-center">
                    <img
                      src={step.mediaUrl || "/placeholder.png"}
                      alt={step.alt || step.title || "LSevin onboarding"}
                      className="max-h-full max-w-full object-contain"
                      loading={index === 0 ? "eager" : "lazy"}
                    />
                  </div>
                </div>

                <CardContent className="space-y-4 p-4 text-right">
                  <div className="space-y-2">
                    {step.eyebrow ? (
                      <p className="text-primary-foreground/80 text-center text-xs font-semibold uppercase tracking-[0.16em] md:text-start">
                        {step.eyebrow}
                      </p>
                    ) : null}
                    <h2 className="text-primary-foreground text-center text-2xl font-bold md:text-start">
                      {step.title}
                    </h2>
                    {step.description ? (
                      <p className="text-primary-foreground/90 text-center text-base leading-relaxed md:text-start">
                        {step.description}
                      </p>
                    ) : null}
                  </div>
                </CardContent>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        <div className="flex flex-col-reverse items-center justify-between gap-2 px-6 pb-4 md:flex-row">
          <div className="flex gap-2">
            {safeSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToIndex(index)}
                className={`size-2 rounded-full transition-all hover:scale-150 ${
                  index === currentIndex ? "bg-background" : "bg-background/30"
                }`}
                aria-label={`Go to step ${index + 1}`}
              />
            ))}
          </div>

          <div className="flex w-full flex-col-reverse gap-2 md:w-auto md:flex-row">
            {step?.secondaryButton ? (
              <Button
                variant="ghost"
                className="text-primary-foreground hover:bg-background/10 hover:text-primary-foreground"
                onClick={handleSecondaryButton}
              >
                {step.secondaryButton}
              </Button>
            ) : null}
            <Button
              variant="secondary"
              onClick={handleNext}
              className="bg-background text-primary hover:bg-background/90 hover:text-primary flex ltr:flex-row-reverse"
            >
              <ArrowLeft className="mr-2 size-4 ltr:rotate-180" />
              {step?.primaryButton || step?.buttonTitle || "Continue"}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export const OnBoardingCardSkeleton = () => {
  return (
    <div className="max-w-md p-1 md:p-0">
      <Card className="border-primary bg-primary p-2 shadow-lg">
        <div className="bg-background mb-1 rounded-lg">
          <div className="relative flex h-[216px] w-full items-center justify-center">
            <Skeleton className="h-full w-full" />
          </div>
        </div>
        <CardContent className="space-y-4 p-4 text-right">
          <div className="space-y-2">
            <Skeleton className="mx-auto h-8 w-3/4 md:mx-0" />
            <Skeleton className="mx-auto h-20 w-full md:mx-0" />
          </div>
        </CardContent>
        <div className="flex flex-col-reverse items-center justify-between gap-2 px-6 pb-4 md:flex-row">
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="size-2 rounded-full" />
            ))}
          </div>
          <div className="flex w-full flex-col-reverse gap-2 md:w-auto md:flex-row">
            <Skeleton className="h-10 w-20" />
            <Skeleton className="h-10 w-28" />
          </div>
        </div>
      </Card>
    </div>
  );
};

export default OnBoardingCard;

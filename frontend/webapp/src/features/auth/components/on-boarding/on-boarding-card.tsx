"use client";

import { ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";

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

const TRANSLATION_KEY = "Auth.OnBoarding";

const OnBoardingCard = () => {
  const router = useRouter();
  const t = useTranslations(TRANSLATION_KEY);

  const steps = [
    {
      title: t("step1.title"),
      description: t("step1.description"),
      image: "/images/board-step-1.png",
      primaryButton: t("step1.primaryButton"),
      secondaryButton: t("step1.secondaryButton"),
    },
    {
      title: t("step2.title"),
      description: t("step2.description"),
      image: "/images/board-step-2.png",
      primaryButton: t("step2.primaryButton"),
      secondaryButton: t("step2.secondaryButton"),
    },
  ];

  const { setApi, currentIndex, scrollToIndex } = useCarouselNavigation();

  const handleNext = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (currentIndex < steps.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollToIndex(nextIndex);
    } else {
      router.push("/sign-up");
    }
  };

  const handleSecondaryButton = () => {
    router.push("/sign-in");
  };

  const step = steps[currentIndex];
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
            {steps.map((step, index) => (
              <CarouselItem key={index}>
                {/* Image Container */}
                <div className="bg-background mb-1 rounded-lg">
                  <div className="relative flex h-[216px] w-full items-center justify-center">
                    <Image
                      src={step.image || "/placeholder.png"}
                      alt="Medical illustration"
                      width={287}
                      height={216}
                      className="object-contain"
                      priority
                    />
                  </div>
                </div>

                <CardContent className="space-y-4 p-4 text-right">
                  {/* Text Content */}
                  <div className="space-y-2">
                    <h2 className="text-primary-foreground text-center text-2xl font-bold md:text-start">
                      {step.title}
                    </h2>
                    <p className="text-primary-foreground/90 text-center text-base leading-relaxed md:text-start">
                      {step.description}
                    </p>
                  </div>
                </CardContent>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>

        {/* Footer */}
        <div className="flex flex-col-reverse items-center justify-between gap-2 px-6 pb-4 md:flex-row">
          {/* Progress Dots */}
          <div className="flex gap-2">
            {steps.map((_, index) => (
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

          {/* Buttons */}
          <div className="flex w-full flex-col-reverse gap-2 md:w-auto md:flex-row">
            <Button
              variant="ghost"
              className="text-primary-foreground hover:bg-background/10 hover:text-primary-foreground"
              onClick={handleSecondaryButton}
            >
              {step?.secondaryButton}
            </Button>
            <Button
              variant="secondary"
              onClick={handleNext}
              className="bg-background text-primary hover:bg-background/90 hover:text-primary flex ltr:flex-row-reverse"
            >
              <ArrowLeft className="mr-2 size-4 ltr:rotate-180" />
              {step?.primaryButton}
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

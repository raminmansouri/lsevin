import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";

import { getDirection } from "@/config/locales";
import { LocaleTypes } from "@/types/common";

import { type CarouselApi } from "./carousel";

type UseCarouselNavigationOptions = {
  initialIndex?: number;
  onIndexChange?: (index: number) => void;
};

/**
 * Reusable hook for carousel navigation with RTL support
 * Handles current index tracking, navigation, and cleanup
 * Note: Navigation calls are swapped in RTL to match visual direction
 */
export const useCarouselNavigation = (
  options: UseCarouselNavigationOptions = {}
) => {
  const { initialIndex = 0, onIndexChange } = options;
  const locale = useLocale();
  const direction = getDirection(locale as LocaleTypes);
  const isRTL = direction === "rtl";
  const [api, setApi] = useState<CarouselApi>();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const hasScrolledToInitial = useRef(false);
  const initialIndexRef = useRef(initialIndex);

  // Track current slide with proper event cleanup
  useEffect(() => {
    if (!api) return;

    const updateIndex = () => {
      const newIndex = api.selectedScrollSnap();
      setCurrentIndex(newIndex);
      onIndexChange?.(newIndex);
    };

    // Set initial state
    updateIndex();

    // Register event listeners
    api.on("select", updateIndex);
    api.on("reInit", updateIndex);

    // Cleanup
    return () => {
      api.off("select", updateIndex);
      api.off("reInit", updateIndex);
    };
  }, [api, onIndexChange]);

  // Scroll to initial index when API is ready (only once)
  // Using refs to track one-time execution without triggering re-renders
  useEffect(() => {
    if (
      api &&
      !hasScrolledToInitial.current &&
      initialIndexRef.current !== undefined
    ) {
      api.scrollTo(initialIndexRef.current, true);
      hasScrolledToInitial.current = true;
    }
  }, [api]); // Only re-run when api changes

  // Navigation handlers
  // Note: scrollTo works correctly in both LTR and RTL
  const scrollToIndex = (index: number) => {
    api?.scrollTo(index);
  };

  // In RTL, visual prev/next is opposite of logical prev/next
  // So we swap the calls to match user expectations
  // Note: Embla is configured with direction in Carousel, but we still need to swap
  // because the API methods (scrollNext/scrollPrev) are logical, not visual
  const scrollPrev = () => {
    if (!api) return;
    if (isRTL) {
      api.scrollNext();
    } else {
      api.scrollPrev();
    }
  };

  const scrollNext = () => {
    if (!api) return;
    if (isRTL) {
      api.scrollPrev();
    } else {
      api.scrollNext();
    }
  };

  const canScrollPrev = api?.canScrollPrev() ?? false;
  const canScrollNext = api?.canScrollNext() ?? false;

  return {
    api,
    setApi,
    currentIndex,
    scrollToIndex,
    scrollPrev,
    scrollNext,
    canScrollPrev,
    canScrollNext,
  };
};

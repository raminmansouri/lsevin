"use client";

import React, { useTransition } from "react";
import { useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useHomeFilters } from "@/features/home/hooks/use-home-filters";
import { cn } from "@/lib/utils";

type LocationType = "country" | "city";

interface LocationItem {
  id: string;
  code: string;
  value: string;
  parentId?: string;
}

interface LocationSwitcherProps {
  type: LocationType;
  items: LocationItem[];
  className?: string;
  showLabel?: boolean;
}

const LocationSwitcher = ({
  type,
  items,
  className,
  showLabel = true,
}: LocationSwitcherProps) => {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("HomePage.locationSwitcher");
  const [api, setApi] = React.useState<CarouselApi>();

  const { countryCode, cityCode, handleCountryChange, handleCityChange } =
    useHomeFilters({ startTransition });

  const isCountry = type === "country";
  const currentValue = isCountry ? countryCode : cityCode;
  const handleChange = isCountry ? handleCountryChange : handleCityChange;

  const allItems = [
    {
      id: "all",
      code: "",
      value: isCountry ? t("allCountries") : t("allCities"),
    },
    ...items,
  ];

  // Find the index of the selected item
  const selectedIndex = allItems.findIndex(
    (item) => item.code === currentValue
  );

  // Scroll to selected item when carousel API is ready or selection changes
  React.useEffect(() => {
    if (api && selectedIndex !== -1) {
      // Small delay to ensure carousel is fully rendered
      setTimeout(() => {
        api.scrollTo(selectedIndex, false); // false = no animation on initial load
      }, 100);
    }
  }, [api, selectedIndex]);

  const handleValueChange = (value: string) => {
    handleChange(value);
  };

  const label = isCountry ? t("countries") : t("cities");

  if (!allItems.length || allItems.length === 1) {
    return null;
  }

  return (
    <div className={cn("space-y-3", className)}>
      {showLabel && (
        <div className="flex items-center">
          <h3 className="text-lg font-semibold">{label}</h3>
          {isPending && (
            <Badge variant="secondary" className="text-xs">
              {t("loading")}
            </Badge>
          )}
        </div>
      )}

      {/* Mobile: Horizontal Carousel */}
      <div className="block md:hidden">
        <Carousel
          opts={{
            align: "start",
            loop: false,
            containScroll: "trimSnaps",
            dragThreshold: 10,
            skipSnaps: false,
            watchDrag: true,
          }}
          setApi={setApi} // Add this to get carousel API
          className="w-full max-w-full overflow-hidden"
        >
          <ToggleGroup
            type="single"
            value={currentValue}
            onValueChange={handleValueChange}
            className="w-full"
          >
            <CarouselContent className="-ms-2 touch-pan-x">
              {allItems.map((item, index) => (
                <CarouselItem
                  key={item.id}
                  className={cn(
                    "min-w-0 basis-auto ps-2",
                    index === allItems.length - 1 && "pe-4"
                  )}
                >
                  <ToggleGroupItem
                    value={item.code}
                    variant="outline"
                    className={cn(
                      "touch-manipulation py-2 text-sm whitespace-nowrap transition-all duration-200",
                      currentValue === item.code &&
                        "bg-primary text-primary-foreground",
                      item.id === "all" && "border-2 font-medium",
                      !currentValue &&
                        item.id === "all" &&
                        "bg-primary text-primary-foreground"
                    )}
                  >
                    {item.value}
                  </ToggleGroupItem>
                </CarouselItem>
              ))}
            </CarouselContent>
          </ToggleGroup>
        </Carousel>
      </div>

      {/* Desktop: Scroll Area with Wrapped Layout */}
      <div className="hidden md:block">
        <ScrollArea className="w-full">
          <ToggleGroup
            type="single"
            value={currentValue}
            onValueChange={handleValueChange}
            className="w-full"
          >
            <div className="flex flex-wrap">
              {allItems.map((item) => (
                <ToggleGroupItem
                  key={item.id}
                  value={item.code}
                  variant="outline"
                  className={cn(
                    "flex-none px-3 py-2 transition-all duration-200",
                    currentValue === item.code &&
                      "bg-primary text-primary-foreground",
                    item.id === "all" && "border-2 font-medium",
                    !currentValue &&
                      item.id === "all" &&
                      "bg-primary text-primary-foreground"
                  )}
                >
                  {item.value}
                </ToggleGroupItem>
              ))}
            </div>
          </ToggleGroup>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};

interface LocationSwitcherSkeletonProps {
  type: LocationType;
  className?: string;
  showLabel?: boolean;
  itemCount?: number;
}

export const LocationSwitcherSkeleton = ({
  className,
  showLabel = true,
  itemCount = 5,
}: LocationSwitcherSkeletonProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {showLabel && (
        <div className="flex items-center">
          <Skeleton className="h-6 w-20" />
        </div>
      )}

      {/* Mobile: Horizontal Carousel Skeleton */}
      <div className="relative block md:hidden">
        <Carousel
          opts={{
            align: "start",
            loop: false,
            containScroll: "trimSnaps",
            dragThreshold: 10,
            skipSnaps: false,
            watchDrag: true,
          }}
          className="w-full max-w-full overflow-hidden"
        >
          <CarouselContent className="-ms-2 touch-pan-x pe-2">
            {Array.from({ length: itemCount }, (_, index) => (
              <CarouselItem key={index} className="min-w-0 basis-auto ps-2">
                <Skeleton className="h-10 w-24 rounded-md" />
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      {/* Desktop: Wrapped Layout Skeleton */}
      <div className="hidden md:block">
        <ScrollArea className="w-full">
          <div className="flex flex-wrap justify-start">
            {Array.from({ length: itemCount }, (_, index) => (
              <Skeleton key={index} className="h-10 w-24 rounded-md" />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};

export default LocationSwitcher;

"use client";

import React, { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

import { ILocationCity, ILocationCountry } from "../types/location";

interface LocationSelectorProps {
  countries: ILocationCountry[];
  cities: ILocationCity[];
  selectedCountryCode?: string;
  selectedCityCode?: string;
  onCountryChange: (countryCode: string) => void;
  onCityChange: (cityCode: string) => void;
  disabled?: boolean;
  className?: string;
}

export const LocationSelector = ({
  countries,
  cities,
  selectedCountryCode,
  selectedCityCode,
  onCountryChange,
  onCityChange,
  disabled = false,
  className,
}: LocationSelectorProps) => {
  const t = useTranslations("Common.Location");
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Reset city selection when country changes
  useEffect(() => {
    if (selectedCityCode && cities.length > 0) {
      const cityExists = cities.some((city) => city.code === selectedCityCode);
      if (!cityExists) {
        onCityChange("");
      }
    }
  }, [cities, selectedCityCode, onCityChange]);

  const handleCountryChange = (countryCode: string) => {
    setIsLoadingCities(true);
    onCountryChange(countryCode);
    onCityChange(""); // Reset city when country changes
    // The loading state will be managed by the parent component
    setTimeout(() => setIsLoadingCities(false), 500);
  };

  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Country Selector */}
        <div className="space-y-2">
          <Select
            disabled={disabled}
            onValueChange={handleCountryChange}
            value={selectedCountryCode || ""}
          >
            <SelectTrigger>
              <SelectValue placeholder={t("selectCountry")} />
            </SelectTrigger>
            <SelectContent>
              {countries.map((country) => (
                <SelectItem key={country.code} value={country.code}>
                  {country.value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* City Selector */}
        <div className="space-y-2">
          {isLoadingCities ? (
            <Skeleton className="h-10 w-full" />
          ) : (
            <Select
              disabled={disabled || !selectedCountryCode || cities.length === 0}
              onValueChange={onCityChange}
              value={selectedCityCode || ""}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedCountryCode
                      ? t("noCountrySelected")
                      : cities.length === 0
                        ? t("noCitiesAvailable")
                        : t("selectCity")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {cities.map((city) => (
                  <SelectItem key={city.code} value={city.code}>
                    {city.value}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>
    </div>
  );
};

interface LocationSelectorSkeletonProps {
  className?: string;
}

export const LocationSelectorSkeleton = ({
  className,
}: LocationSelectorSkeletonProps) => {
  return (
    <div className={className}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
};

export default LocationSelector;

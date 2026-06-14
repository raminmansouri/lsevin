"use client";

import { useEffect } from "react";
import { LocationSingleSelect } from "./location-single-select";
// import { LocationSingleSelect } from "./location-single-select";

type Props = {
  countryId: string | null | undefined;
  cityId: string | null | undefined;

  onCountryChange: (value: string | null) => void;
  onCityChange: (value: string | null) => void;

  locale?: string;
  fallbackLocale?: string;
  disabled?: boolean;
  className?: string;

  countryLabel?: string;
  cityLabel?: string;
};

export function CountryCitySelect({
  countryId,
  cityId,
  onCountryChange,
  onCityChange,
  locale = "en",
  fallbackLocale = "en",
  disabled = false,
  className,
  countryLabel = "Country",
  cityLabel = "City",
}: Props) {
  useEffect(() => {
    if (!countryId && cityId) {
      onCityChange(null);
    }
  }, [countryId, cityId, onCityChange]);

  return (
    <div className={className ?? "grid gap-4 md:grid-cols-2"}>
      <LocationSingleSelect
        value={countryId}
        onChange={(nextCountryId) => {
          const changed = nextCountryId !== (countryId ?? null);
          onCountryChange(nextCountryId);

          if (changed) {
            onCityChange(null);
          }
        }}
        locationTypeId={1}
        locale={locale}
        fallbackLocale={fallbackLocale}
        label={countryLabel}
        placeholder="Select country"
        searchPlaceholder="Search countries..."
        disabled={disabled}
      />

      <LocationSingleSelect
        key={countryId ?? "no-country"}
        value={cityId}
        onChange={onCityChange}
        locationTypeId={2}
        parentId={countryId ?? null}
        locale={locale}
        fallbackLocale={fallbackLocale}
        label={cityLabel}
        placeholder={countryId ? "Select city" : "Select country first"}
        searchPlaceholder="Search cities..."
        disabled={disabled || !countryId}
      />
    </div>
  );
}
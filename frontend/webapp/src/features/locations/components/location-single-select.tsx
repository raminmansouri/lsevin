"use client";

import { MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { AsyncSingleSelect } from "./async-single-select";
import { getLocationByIdAction, searchLocationsAction } from "../actions/location-select.actions";
import type { LocationTypeId } from "../location-select.types";

type Props = {
  value: string | null | undefined;
  onChange: (value: string | null) => void;

  locationTypeId: LocationTypeId;
  parentId?: string | null;

  locale?: string;
  fallbackLocale?: string;

  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  pageSize?: number;
  clearable?: boolean;
  className?: string;
};

export function LocationSingleSelect({
  value,
  onChange,
  locationTypeId,
  parentId = null,
  locale = "en",
  fallbackLocale = "en",
  label,
  placeholder,
  searchPlaceholder,
  disabled,
  pageSize = 20,
  clearable = true,
  className,
}: Props) {
  const t = useTranslations("Common.Location");
  const cacheKey = `locations|type:${locationTypeId}|parent:${parentId ?? "root"}|locale:${locale}|fallback:${fallbackLocale}`;

  const defaultPlaceholder =
    locationTypeId === 1
      ? t("selectCountry")
      : locationTypeId === 3
        ? t("selectProvince")
        : t("selectCity");

  const defaultSearchPlaceholder =
    locationTypeId === 1
      ? t("searchCountries")
      : locationTypeId === 3
        ? t("searchProvinces")
        : t("searchCities");

  return (
    <div className={className}>
      {label ? (
        <div className="mb-2 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-zinc-500" />
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
            {label}
          </span>
        </div>
      ) : null}

      <AsyncSingleSelect
        value={value}
        onChange={(nextValue) => onChange(nextValue)}
        cacheKey={cacheKey}
        disabled={disabled}
        pageSize={pageSize}
        clearable={clearable}
        placeholder={placeholder ?? defaultPlaceholder}
        searchPlaceholder={searchPlaceholder ?? defaultSearchPlaceholder}
        loadOptions={(params) =>
          searchLocationsAction({
            locationTypeId,
            parentId,
            search: params.search,
            page: params.page,
            pageSize: params.pageSize,
            locale,
            fallbackLocale,
          })
        }
        loadByValue={(id) =>
          getLocationByIdAction({
            id,
            locale,
            fallbackLocale,
          })
        }
      />
    </div>
  );
}

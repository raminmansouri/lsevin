"use client";

import { MapPin } from "lucide-react";
import { AsyncSingleSelect } from "./async-single-select";
import { getLocationByIdAction, searchLocationsAction } from "../actions/location-select.actions";
// import {
//   getLocationByIdAction,
//   searchLocationsAction,
// } from "@/features/locations/location-select.actions";

type Props = {
  value: string | null | undefined;
  onChange: (value: string | null) => void;

  locationTypeId: 1 | 2;
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
  const cacheKey = `locations|type:${locationTypeId}|parent:${parentId ?? "root"}|locale:${locale}|fallback:${fallbackLocale}`;

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
        placeholder={
          placeholder ??
          (locationTypeId === 1 ? "Select country" : "Select city")
        }
        searchPlaceholder={
          searchPlaceholder ??
          (locationTypeId === 1 ? "Search countries..." : "Search cities...")
        }
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
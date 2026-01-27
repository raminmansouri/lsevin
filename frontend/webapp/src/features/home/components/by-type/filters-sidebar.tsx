"use client";

import { useCallback } from "react";
import { ChevronDown, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDebouncedCallback } from "use-debounce";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { AttributeFilterValue } from "@/features/home/types";
import type { ProviderAttributeDefinition } from "@/features/provider-types/types/provider-type";
import type {
  AvailableCity,
  AvailableCountry,
} from "@/features/service-providers/types";
import { cn } from "@/lib/utils";

import { BY_TYPE_TRANSLATION_KEY } from "../../types/constants";
import { AttributeFilters } from "./attribute-filters";

interface FiltersSidebarProps {
  countries: AvailableCountry[];
  cities: AvailableCity[];
  attributes: ProviderAttributeDefinition[];
  search?: string;
  selectedCountry?: string;
  selectedCity?: string;
  selectedAttributeFilters: AttributeFilterValue[];
  onSearchChange: (value: string) => void;
  onCountryChange: (code: string) => void;
  onCityChange: (code: string) => void;
  onAttributeFilterAdd: (filter: AttributeFilterValue) => void;
  onAttributeFilterRemove: (attributeId: string, value: string) => void;
  onAttributeFiltersClear: () => void;
  onClearAll: () => void;
  isLoadingCities?: boolean;
}

export function FiltersSidebar({
  countries,
  cities,
  attributes,
  search,
  selectedCountry,
  selectedCity,
  selectedAttributeFilters,
  onSearchChange,
  onCountryChange,
  onCityChange,
  onAttributeFilterAdd,
  onAttributeFilterRemove,
  onAttributeFiltersClear,
  onClearAll,
  isLoadingCities = false,
}: FiltersSidebarProps) {
  const t = useTranslations(`${BY_TYPE_TRANSLATION_KEY}.filters`);

  const debouncedSearch = useDebouncedCallback((value: string) => {
    onSearchChange(value);
  }, 300);

  const handleSearchChange = useCallback(
    (value: string) => {
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

  const hasAnyFilter =
    search ||
    selectedCountry ||
    selectedCity ||
    selectedAttributeFilters.length > 0;

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          {hasAnyFilter && (
            <Button variant="ghost" size="sm" onClick={onClearAll}>
              {t("clearAll")}
            </Button>
          )}
        </div>
      </div>

      {/* Filters Content */}
      <ScrollArea className="flex-1">
        <div className="flex flex-col gap-4 p-4">
          {/* Search Section */}
          <div className="flex flex-col gap-2">
            <Label className="text-sm">{t("search")}</Label>
            <div className="relative">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
              <Input
                type="text"
                placeholder={t("searchPlaceholder")}
                defaultValue={search || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Location Section */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger
              className={cn(
                "bg-muted/20 hover:bg-muted/80 flex w-full items-center justify-between rounded-lg p-3"
              )}
            >
              <span className="font-medium">{t("location")}</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent className="flex flex-col gap-3 pt-3">
              {/* Country Selector */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm">{t("country")}</Label>
                <Select
                  value={selectedCountry || "all"}
                  onValueChange={(value) =>
                    onCountryChange(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectCountry")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allCountries")}</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country.code} value={country.code}>
                        {country.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City Selector */}
              <div className="flex flex-col gap-2">
                <Label className="text-sm">{t("city")}</Label>
                <Select
                  value={selectedCity || "all"}
                  onValueChange={(value) =>
                    onCityChange(value === "all" ? "" : value)
                  }
                  disabled={!selectedCountry || isLoadingCities}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        !selectedCountry
                          ? t("selectCountryFirst")
                          : isLoadingCities
                            ? t("loadingCities")
                            : t("selectCity")
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t("allCities")}</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city.code} value={city.code}>
                        {city.value}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Attributes Section */}
          <Collapsible defaultOpen>
            <CollapsibleTrigger
              className={cn(
                "bg-muted/20 hover:bg-muted/80 flex w-full items-center justify-between rounded-lg p-3"
              )}
            >
              <div className="flex items-center gap-2">
                <span className="font-medium">{t("attributes")}</span>
                {selectedAttributeFilters.length > 0 && (
                  <Badge variant="default" className="mr-2">
                    {selectedAttributeFilters.length}
                  </Badge>
                )}
              </div>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <Separator className="my-4" />
            <CollapsibleContent>
              <AttributeFilters
                attributes={attributes}
                selectedFilters={selectedAttributeFilters}
                onFilterAdd={onAttributeFilterAdd}
                onFilterRemove={onAttributeFilterRemove}
                onClearAll={onAttributeFiltersClear}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      </ScrollArea>
    </div>
  );
}

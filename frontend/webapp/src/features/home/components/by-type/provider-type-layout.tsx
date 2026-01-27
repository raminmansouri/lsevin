"use client";

import { useState, useTransition } from "react";
import { SlidersHorizontal } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import ClientFetchResult from "@/components/fetcher/fetch.client";
import { InfiniteScroll } from "@/components/fetcher/infinite-scroll";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Skeleton } from "@/components/ui/skeleton";
import type { AttributeFilterValue } from "@/features/home/types";
import type { ProviderAttributeDefinition } from "@/features/provider-types/types/provider-type";
import { useServiceProvidersByType } from "@/features/service-providers/api/client/get-service-providers-by-type";
import ServiceProviderCard from "@/features/service-providers/components/service-provider-card";
import type {
  AvailableCity,
  AvailableCountry,
  IServiceProvider,
} from "@/features/service-providers/types";
import { useAllCitiesByCountry } from "@/features/shared/api/client/get-all-cities-by-country";

import { useByTypeFilters } from "../../hooks/use-by-type-filters";
import { BY_TYPE_TRANSLATION_KEY } from "../../types/constants";
import { FiltersSidebar } from "./filters-sidebar";

interface ProviderTypeLayoutProps {
  providerTypeId: string;
  providerTypeName?: string;
  countries: AvailableCountry[];
  attributes: ProviderAttributeDefinition[];
}

export function ProviderTypeLayout({
  providerTypeId,
  providerTypeName,
  countries,
  attributes,
}: ProviderTypeLayoutProps) {
  const [, startTransition] = useTransition();
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const locale = useLocale();
  const t = useTranslations(BY_TYPE_TRANSLATION_KEY);

  const {
    search,
    countryCode,
    cityCode,
    attributeFilters,
    handleSearchChange,
    handleCountryChange,
    handleCityChange,
    handleAttributeFilterAdd,
    handleAttributeFilterRemove,
    handleAttributeFiltersClear,
    handleClearAll,
  } = useByTypeFilters({ startTransition });

  // Fetch cities when country is selected
  const { data: cities = [], isFetching: isLoadingCities } =
    useAllCitiesByCountry(countryCode || "", locale);

  // Fetch service providers with infinite scroll
  const {
    data: allProviders,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isFetching,
    error,
  } = useServiceProvidersByType(
    providerTypeId,
    search || "",
    countryCode || undefined,
    cityCode || undefined,
    (attributeFilters as AttributeFilterValue[]) || undefined,
    locale
  );
  return (
    <div>
      {/* Page Title */}
      <div className="mb-6">
        <h1 className="text-lg font-bold md:text-3xl">
          {providerTypeName ? (
            <div className="flex items-center gap-2">
              <span>{t("title")}</span>-
              <span className="text-primary">{providerTypeName}</span>
            </div>
          ) : (
            t("loading")
          )}
        </h1>
      </div>

      <ResizablePanelGroup direction="horizontal" className="min-h-[600px]">
        {/* Sidebar - Desktop only */}
        <ResizablePanel
          defaultSize={25}
          minSize={20}
          maxSize={40}
          className="hidden md:block"
        >
          <div className="h-full border-r">
            <FiltersSidebar
              countries={countries}
              cities={cities as AvailableCity[]}
              attributes={attributes}
              search={search || undefined}
              selectedCountry={countryCode || undefined}
              selectedCity={cityCode || undefined}
              selectedAttributeFilters={
                (attributeFilters as AttributeFilterValue[]) || []
              }
              onSearchChange={handleSearchChange}
              onCountryChange={handleCountryChange}
              onCityChange={handleCityChange}
              onAttributeFilterAdd={handleAttributeFilterAdd}
              onAttributeFilterRemove={handleAttributeFilterRemove}
              onAttributeFiltersClear={handleAttributeFiltersClear}
              onClearAll={handleClearAll}
              isLoadingCities={isLoadingCities}
            />
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle className="hidden md:flex" />

        {/* Main Content */}
        <ResizablePanel defaultSize={75}>
          <div className="h-full overflow-auto p-0 md:p-6">
            {/* Mobile Filter Button */}
            <div className="mb-6 md:hidden">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setIsFiltersOpen(true)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                {t("filters.title")}
              </Button>
            </div>

            <ClientFetchResult
              isFetching={isFetching}
              error={error || undefined}
              hasData={allProviders.length > 0}
              singleData={false}
              fallBack={
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Skeleton key={i} className="h-64 w-full" />
                  ))}
                </div>
              }
            >
              {allProviders.length === 0 ? (
                <div className="text-muted-foreground text-center">
                  <p>{t("noResults")}</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {allProviders.map((provider: IServiceProvider) => (
                      <ServiceProviderCard
                        key={provider.id}
                        provider={provider}
                      />
                    ))}
                  </div>

                  {/* Infinite Scroll Trigger */}
                  <div className="mt-8">
                    <InfiniteScroll
                      hasNextPage={hasNextPage}
                      isFetchingNextPage={isFetchingNextPage}
                      fetchNextPage={fetchNextPage}
                    />
                  </div>
                </>
              )}
            </ClientFetchResult>
          </div>
        </ResizablePanel>
      </ResizablePanelGroup>

      {/* Mobile Filters Drawer */}
      <Drawer open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="border-b">
            <DrawerTitle>{t("filters.title")}</DrawerTitle>
          </DrawerHeader>
          <div className="overflow-y-auto">
            <FiltersSidebar
              countries={countries}
              cities={cities as AvailableCity[]}
              attributes={attributes}
              search={search || undefined}
              selectedCountry={countryCode || undefined}
              selectedCity={cityCode || undefined}
              selectedAttributeFilters={
                (attributeFilters as AttributeFilterValue[]) || []
              }
              onSearchChange={handleSearchChange}
              onCountryChange={handleCountryChange}
              onCityChange={handleCityChange}
              onAttributeFilterAdd={handleAttributeFilterAdd}
              onAttributeFilterRemove={handleAttributeFilterRemove}
              onAttributeFiltersClear={handleAttributeFiltersClear}
              onClearAll={handleClearAll}
              isLoadingCities={isLoadingCities}
            />
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

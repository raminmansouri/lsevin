"use client";

import { useState, useTransition } from "react";
import { Check, PlusCircle } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useQueryState } from "nuqs";

import { InfiniteScroll } from "@/components/fetcher/infinite-scroll";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { useProviderTypesBySearch } from "@/features/provider-types/api/client/get-provider-types-by-search";
import { defaultQueryStateOptions } from "@/hooks/use-filter-params";
import { cn } from "@/lib/utils";
import { filterParams } from "@/types/filter";

import { useProviderTypeFilter } from "../../hooks/use-provider-type-filter";

interface ProviderTypeFacetedFilterProps {
  title: string;
}

export function ProviderTypeFacetedFilter({
  title,
}: ProviderTypeFacetedFilterProps) {
  const locale = useLocale();
  const t = useTranslations("Common.DataTable");
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState("");

  // Use nuqs directly for pagination to avoid race conditions
  const [, setPageNumber] = useQueryState(
    "pageNumber",
    filterParams.pageNumber.withOptions({
      ...defaultQueryStateOptions,
      startTransition,
    })
  );

  const { providerTypeIds, setProviderTypeFilter, resetProviderTypeFilter } =
    useProviderTypeFilter({
      startTransition,
    });

  // Fetch provider types with search and infinite scroll
  const {
    data: providerTypeOptions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProviderTypesBySearch(search, locale);

  const selectedValues = new Set(providerTypeIds);

  const handleSelect = (value: string) => {
    const newSelectedValues = new Set(selectedValues);
    if (newSelectedValues.has(value)) {
      newSelectedValues.delete(value);
    } else {
      newSelectedValues.add(value);
    }

    const filterValues = Array.from(newSelectedValues);

    // Update both filter and pagination in sequence
    startTransition(() => {
      setProviderTypeFilter(filterValues);
      setPageNumber(1);
    });
  };

  const handleClear = () => {
    startTransition(() => {
      resetProviderTypeFilter();
      setPageNumber(1);
    });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 border-dashed">
          <PlusCircle className="mr-2 size-4" />
          {title}
          {selectedValues?.size > 0 && (
            <>
              <Separator orientation="vertical" className="mx-2 h-4" />
              <Badge
                variant="secondary"
                className="rounded-sm px-1 font-normal lg:hidden"
              >
                {selectedValues.size}
              </Badge>
              <div className="hidden space-x-1 lg:flex">
                {selectedValues.size > 2 ? (
                  <Badge
                    variant="secondary"
                    className="rounded-sm px-1 font-normal"
                  >
                    {selectedValues.size} selected
                  </Badge>
                ) : (
                  providerTypeOptions
                    .filter((option) => selectedValues.has(option.id))
                    .map((option) => (
                      <Badge
                        variant="secondary"
                        key={option.id}
                        className="rounded-sm px-1 font-normal"
                      >
                        {option.name}
                      </Badge>
                    ))
                )}
              </div>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={title}
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            <CommandEmpty>{t("noResults")}</CommandEmpty>
            <CommandGroup>
              {providerTypeOptions.map((option) => {
                const isSelected = selectedValues.has(option.id);
                return (
                  <CommandItem
                    key={option.id}
                    onSelect={() => handleSelect(option.id)}
                  >
                    <div
                      className={cn(
                        "border-primary mr-2 flex size-4 items-center justify-center rounded-sm border",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <Check className={cn("size-4")} />
                    </div>
                    <span>{option.name}</span>
                  </CommandItem>
                );
              })}
              {hasNextPage && (
                <CommandItem>
                  <InfiniteScroll
                    isManual
                    hasNextPage={hasNextPage}
                    isFetchingNextPage={isFetchingNextPage}
                    fetchNextPage={fetchNextPage || (() => {})}
                  />
                </CommandItem>
              )}
            </CommandGroup>
            {selectedValues.size > 0 && (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    onSelect={handleClear}
                    className="justify-center text-center"
                  >
                    {t("clearFilters")}
                  </CommandItem>
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

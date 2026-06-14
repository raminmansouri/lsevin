"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { LexicalRenderer } from "@/components/editor/lexical-renderer";
import { InfiniteScroll } from "@/components/fetcher/infinite-scroll";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { useProviderTypesBySearch } from "../api/client/get-provider-types-by-search";

interface ProviderTypeSelectorWithInfiniteScrollProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
}

export function ProviderTypeSelectorWithInfiniteScroll({
  value,
  onValueChange,
  placeholder,
  disabled = false,
}: ProviderTypeSelectorWithInfiniteScrollProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const locale = useLocale();

  const t = useTranslations("ProviderType");

  // Use React Query for infinite scroll provider types
  const {
    data: providerTypeOptions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useProviderTypesBySearch(search, locale);

  const selectedOption = value
    ? providerTypeOptions.find((option) => option.id === value)
    : undefined;

  const handleSelect = (optionId: string) => {
    if (value === optionId) {
      onValueChange?.(undefined);
    } else {
      onValueChange?.(optionId);
    }
    setOpen(false);
  };

  const handleRemove = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onValueChange?.(undefined);
  };

  const handleSearch = (searchValue: string) => {
    setSearch(searchValue);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <div className="ltr:text-left rtl:text-right">
                <div className="font-medium">{selectedOption.name}</div>
                {selectedOption.description && (
                  <div className="text-muted-foreground text-xs">
                    <LexicalRenderer content={selectedOption.description} />
                  </div>
                )}
              </div>
              {value && (
                <div
                  className="hover:bg-muted-foreground/20 ml-auto cursor-pointer rounded-full p-0.5"
                  onClick={handleRemove}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleRemove(e);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </div>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {placeholder || t("form.selectProviderType")}
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("search.placeholder")}
            onValueChange={handleSearch}
          />
          <CommandList>
            <CommandEmpty>{t("search.noResults")}</CommandEmpty>
            <CommandGroup>
              {providerTypeOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.name}
                  onSelect={() => handleSelect(option.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.id ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{option.name}</div>
                    {option.description && (
                      <div className="text-muted-foreground line-clamp-1 text-xs">
                        <LexicalRenderer content={option.description} />
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
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
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

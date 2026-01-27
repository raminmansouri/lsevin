"use client";

import { useState as useLocalState } from "react";
import { ChevronsUpDown, X } from "lucide-react";
import { useTranslations } from "next-intl";

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

import { CategoryOption } from "./category-selector";

interface CategorySelectorWithInfiniteScrollProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  onCategoryChange?: (
    categoryId: string | undefined,
    categoryName: string | undefined
  ) => void;
  options: CategoryOption[];
  onSearch?: (search: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
  className?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}

export function CategorySelectorWithInfiniteScroll({
  value,
  onValueChange,
  onCategoryChange,
  options,
  onSearch,
  placeholder,
  disabled = false,
  hasNextPage = false,
  fetchNextPage,
  isFetchingNextPage = false,
  className,
  searchPlaceholder,
  emptyMessage,
}: CategorySelectorWithInfiniteScrollProps) {
  const [open, setOpen] = useLocalState(false);
  const t = useTranslations("Category");

  const selectedOption = value
    ? options.find((option) => option.categoryId === value)
    : undefined;

  const formatDisplayName = (option: CategoryOption) => {
    return option.parentName
      ? `${option.parentName} > ${option.name}`
      : option.name;
  };

  const handleSelect = (optionId: string) => {
    const selectedCategory = options.find(
      (option) => option.categoryId === optionId
    );

    if (value === optionId) {
      onValueChange?.(undefined);
      onCategoryChange?.(undefined, undefined);
    } else {
      onValueChange?.(optionId);
      onCategoryChange?.(optionId, selectedCategory?.name);
    }
    setOpen(false);
  };

  const handleRemove = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.stopPropagation();
    onValueChange?.(undefined);
    onCategoryChange?.(undefined, undefined);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
          disabled={disabled}
        >
          {selectedOption ? (
            <span className="flex items-center gap-2">
              {formatDisplayName(selectedOption)}
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
              {placeholder || t("form.parentIdPlaceholder")}
            </span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={searchPlaceholder || "Search categories..."}
            onValueChange={onSearch}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage || "No category found."}</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.categoryId}
                  value={option.name}
                  data-selected={option.categoryId === value}
                  onSelect={() => handleSelect(option.categoryId)}
                >
                  {formatDisplayName(option)}
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

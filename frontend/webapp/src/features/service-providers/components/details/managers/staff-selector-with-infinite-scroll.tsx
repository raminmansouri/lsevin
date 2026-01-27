"use client";

import { useCallback, useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDebouncedCallback } from "use-debounce";

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
import {
  StaffOption,
  useStaffBySearch,
} from "@/features/staff/api/client/get-staff-by-search";
import { cn } from "@/lib/utils";

interface StaffSelectorWithInfiniteScrollProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  excludeIds?: string[];
}

function StaffSelectorWithInfiniteScroll({
  value,
  onValueChange,
  placeholder = "Select staff member...",
  disabled = false,
  excludeIds = [],
}: StaffSelectorWithInfiniteScrollProps) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const t = useTranslations("ServiceProvider");

  const {
    data: staffOptions,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useStaffBySearch(searchTerm);

  // Filter out excluded staff IDs
  const filteredStaffOptions = staffOptions.filter(
    (option) => !excludeIds.includes(option.id)
  );

  const selectedOption = value
    ? filteredStaffOptions.find((option) => option.id === value)
    : undefined;

  const formatDisplayName = (option: StaffOption) => {
    return option.name;
  };

  const formatDescription = (option: StaffOption) => {
    const parts = [];
    if (option.title) parts.push(option.title);
    // if (option.biography) parts.push(option.biography);
    return parts.join(" • ");
  };

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

  const debouncedSearch = useDebouncedCallback((term: string) => {
    setSearchTerm(term);
  }, 300);

  const handleSearchChange = useCallback(
    (value: string) => {
      debouncedSearch(value);
    },
    [debouncedSearch]
  );

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
                <div className="font-medium">
                  {formatDisplayName(selectedOption)}
                </div>
                {selectedOption.title && (
                  <div className="text-muted-foreground text-xs">
                    {formatDescription(selectedOption)}
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
            placeholder
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={t("search.placeholder")}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>{t("search.noResults")}</CommandEmpty>
            <CommandGroup>
              {filteredStaffOptions.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={() => handleSelect(option.id)}
                  className="cursor-pointer"
                >
                  <div className="flex flex-1 items-center gap-2">
                    <Check
                      className={cn(
                        "h-4 w-4",
                        value === option.id ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="flex-1 ltr:text-left rtl:text-right">
                      <div className="font-medium">
                        {formatDisplayName(option)}
                      </div>
                      {option.title && (
                        <div className="text-muted-foreground text-xs">
                          {formatDescription(option)}
                        </div>
                      )}
                    </div>
                    {!option.isActive && (
                      <div className="text-muted-foreground text-xs">
                        {t("status.inactive")}
                      </div>
                    )}
                  </div>
                </CommandItem>
              ))}
              <InfiniteScroll
                hasNextPage={hasNextPage}
                fetchNextPage={fetchNextPage}
                isFetchingNextPage={isFetchingNextPage}
              />
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export default StaffSelectorWithInfiniteScroll;

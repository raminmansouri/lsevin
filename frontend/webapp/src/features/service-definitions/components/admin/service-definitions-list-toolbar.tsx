"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Check, ChevronsUpDown, PlusCircle, Search, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

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
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useRouter as useI18nRouter } from "@/i18n/navigation";

import type { AdminServiceDefinitionCategoryOption } from "../../db/admin-service-definitions.queries";

type Props = {
  categories: AdminServiceDefinitionCategoryOption[];
};

export function ServiceDefinitionsListToolbar({ categories }: Props) {
  const i18nRouter = useI18nRouter();
  const nextRouter = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(searchParams.get("filters") || "");
  const [categorySearch, setCategorySearch] = useState("");
  const [categoryOpen, setCategoryOpen] = useState(false);
  const selectedCategoryId = searchParams.get("categoryId") || "";

  useEffect(() => {
    setSearch(searchParams.get("filters") || "");
  }, [searchParams]);

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === selectedCategoryId) || null,
    [categories, selectedCategoryId],
  );

  const filteredCategories = useMemo(() => {
    const normalized = categorySearch.trim().toLowerCase();
    if (!normalized) return categories;
    return categories.filter((category) => category.name.toLowerCase().includes(normalized));
  }, [categories, categorySearch]);

  const replaceQuery = (mutator: (params: URLSearchParams) => void) => {
    const params = new URLSearchParams(searchParams.toString());
    mutator(params);
    params.delete("pageNumber");
    params.delete("page");

    startTransition(() => {
      const query = params.toString();
      nextRouter.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    });
  };

  const commitSearch = useDebouncedCallback((value: string) => {
    replaceQuery((params) => {
      const normalized = value.trim();
      if (normalized) {
        params.set("filters", normalized);
      } else {
        params.delete("filters");
        params.delete("search");
        params.delete("q");
        params.delete("query");
      }
    });
  }, 350);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    commitSearch(value);
  };

  const handleClearSearch = () => {
    setSearch("");
    commitSearch("");
  };

  const handleCategorySelect = (categoryId: string) => {
    replaceQuery((params) => {
      if (categoryId && categoryId !== selectedCategoryId) {
        params.set("categoryId", categoryId);
      } else {
        params.delete("categoryId");
      }
    });
    setCategoryOpen(false);
  };

  const handleClearCategory = () => {
    replaceQuery((params) => params.delete("categoryId"));
    setCategoryOpen(false);
  };

  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search service definitions, descriptions, category..."
            className="h-8 pl-9 pr-9"
          />
          {search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2"
              onClick={handleClearSearch}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear search</span>
            </Button>
          ) : null}
        </div>

        <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 justify-between border-dashed sm:min-w-[220px]">
              <span className="truncate">
                {selectedCategory ? selectedCategory.name : "Filter by category"}
              </span>
              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[280px] p-0" align="start">
            <Command shouldFilter={false}>
              <CommandInput
                placeholder="Search category..."
                value={categorySearch}
                onValueChange={setCategorySearch}
              />
              <CommandList>
                <CommandEmpty>No category found.</CommandEmpty>
                <CommandGroup>
                  {filteredCategories.map((category) => {
                    const isSelected = selectedCategoryId === category.id;
                    return (
                      <CommandItem
                        key={category.id}
                        value={category.id}
                        onSelect={() => handleCategorySelect(category.id)}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            isSelected ? "opacity-100" : "opacity-0",
                          )}
                        />
                        <span className="flex-1 truncate">{category.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {category.serviceDefinitionCount}
                        </span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
                {selectedCategoryId ? (
                  <>
                    <CommandSeparator />
                    <CommandGroup>
                      <CommandItem onSelect={handleClearCategory} className="justify-center text-center">
                        Clear category filter
                      </CommandItem>
                    </CommandGroup>
                  </>
                ) : null}
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
      </div>

      <Button onClick={() => i18nRouter.push("/admin/service-definitions/add")}>
        <PlusCircle className="mr-2 h-4 w-4" />
        Add service definition
      </Button>
    </div>
  );
}

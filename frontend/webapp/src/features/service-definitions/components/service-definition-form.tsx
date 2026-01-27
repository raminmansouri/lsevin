"use client";

import { useState as useLocalState, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { InfiniteScroll } from "@/components/fetcher/infinite-scroll";
import { ZodErrorProvider } from "@/components/providers/zod-error-provider";
import { CategoryOption } from "@/components/selectors/category-selector";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoriesBySearch } from "@/features/categories/api/client";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import {
  createEmptyLocalizedContent,
  normalizeLocalizedFields,
} from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

import { createServiceDefinitionAction } from "../actions/create-service-definition";
import { updateServiceDefinitionAction } from "../actions/update-service-definition";
import { useServiceDefinitionsAllLocalesBySearchCacheManagement } from "../api/client/get-service-definitions-all-locales-by-search";
import { useServiceDefinitionsBySearchCacheManagement } from "../api/client/get-service-definitions-by-search";
import { SERVICE_DEFINITION_TRANSLATION_KEY } from "../constants";
import {
  ServiceDefinitionFormInput,
  ServiceDefinitionFormSchema,
} from "../schemas";
import { ServiceDefinitionDetails } from "../types/service-definition";

interface ServiceDefinitionFormProps {
  serviceDefinition?: ServiceDefinitionDetails;
}

// CategorySelectorWithInfiniteScroll component
interface CategorySelectorWithInfiniteScrollProps {
  value?: string;
  onValueChange?: (value: string | undefined) => void;
  options: CategoryOption[];
  onSearch?: (search: string) => void;
  placeholder?: string;
  disabled?: boolean;
  hasNextPage?: boolean;
  fetchNextPage?: () => void;
  isFetchingNextPage?: boolean;
}

function CategorySelectorWithInfiniteScroll({
  value,
  onValueChange,
  options,
  onSearch,
  placeholder,
  disabled = false,
  hasNextPage = false,
  fetchNextPage,
  isFetchingNextPage = false,
}: CategorySelectorWithInfiniteScrollProps) {
  const [open, setOpen] = useLocalState(false);

  const selectedOption = value
    ? options.find((option) => option.categoryId === value)
    : undefined;

  const formatDisplayName = (option: CategoryOption) => {
    return option.parentName
      ? `${option.parentName} > ${option.name}`
      : option.name;
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
            <span className="text-muted-foreground">{placeholder || ""}</span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search categories..."
            onValueChange={onSearch}
          />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.categoryId}
                  value={option.name}
                  onSelect={() => handleSelect(option.categoryId)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === option.categoryId ? "opacity-100" : "opacity-0"
                    )}
                  />
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

export function ServiceDefinitionForm({
  serviceDefinition,
}: ServiceDefinitionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categorySearch, setCategorySearch] = useState("");
  const locale = useLocale();

  const componentT = useTranslations(SERVICE_DEFINITION_TRANSLATION_KEY);
  const { invalidateAllCache } = useServiceDefinitionsBySearchCacheManagement();
  const { invalidateAllCache: invalidateAllLocalesCache } =
    useServiceDefinitionsAllLocalesBySearchCacheManagement();

  // Create pricing models array using translations
  // const PRICING_MODELS = [
  //   { value: "Fixed", label: componentT("pricingModels.Fixed") },
  //   { value: "Variable", label: componentT("pricingModels.Variable") },
  //   { value: "Hourly", label: componentT("pricingModels.Hourly") },
  //   { value: "Package", label: componentT("pricingModels.Package") },
  // ];

  // Use React Query for infinite scroll categories
  const {
    data: categoryOptions,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useCategoriesBySearch(categorySearch, locale);

  const isEdit = !!serviceDefinition;

  const form = useForm<ServiceDefinitionFormInput>({
    defaultValues: {
      serviceDefinitionId: serviceDefinition?.id,
      name: serviceDefinition?.name
        ? { translations: serviceDefinition.name.translations }
        : createEmptyLocalizedContent(),
      description: serviceDefinition?.description
        ? { translations: serviceDefinition.description.translations }
        : createEmptyLocalizedContent(),
      categoryId: serviceDefinition?.categoryId,
      durationMinutes: serviceDefinition?.durationMinutes ?? 0,
      currency: serviceDefinition?.currency ?? "USD",
      value: serviceDefinition?.basePrice ?? 0,
      pricingModel: serviceDefinition?.pricingModel ?? "Fixed",
      isActive: serviceDefinition?.isActive ?? true,
    },
    resolver: zodResolver(ServiceDefinitionFormSchema),
  });

  const action = isEdit
    ? updateServiceDefinitionAction
    : createServiceDefinitionAction;
  const { execute } = useAction(action, {
    startTransition,
    onSuccess: () => {
      toast.success(componentT("messages.success"));
      invalidateAllCache();
      invalidateAllLocalesCache();
      router.push("/admin/service-definitions");
    },
    onError: (error) => {
      toast.error(error.detail || componentT("messages.error"));
    },
  });

  const onSubmit = async (values: ServiceDefinitionFormInput) => {
    // Normalize localized content by removing empty translations
    const normalizedFields = normalizeLocalizedFields({
      name: values.name,
      description: values.description,
    });

    const payload = {
      ...values,
      ...normalizedFields,
      currency: values.currency.trim(),
      pricingModel: values.pricingModel.trim(),
    };

    startTransition(async () => {
      await execute(payload);
    });
  };

  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={SERVICE_DEFINITION_TRANSLATION_KEY}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="form-container space-y-6"
          >
            {isEdit && (
              <FormField
                control={form.control}
                name="serviceDefinitionId"
                render={({ field }) => (
                  <Input {...field} type="hidden" disabled />
                )}
              />
            )}

            {/* Name Field */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <LocalizedInput
                      label={componentT("form.name.label")}
                      value={field.value}
                      onChange={field.onChange}
                      required
                      maxLength={100}
                      error={form.formState.errors.name?.message}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Description Field */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <LocalizedInput
                      label={componentT("form.description.label")}
                      value={field.value}
                      onChange={field.onChange}
                      richText
                      rows={3}
                      maxLength={2000}
                      error={form.formState.errors.description?.message}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {/* Category Field */}
            <FormField
              control={form.control}
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{componentT("form.categoryId.label")}</FormLabel>
                  <FormControl>
                    <CategorySelectorWithInfiniteScroll
                      value={field.value}
                      onValueChange={field.onChange}
                      options={categoryOptions}
                      onSearch={setCategorySearch}
                      placeholder={componentT("form.categoryId.placeholder")}
                      disabled={isPending}
                      hasNextPage={hasNextPage}
                      fetchNextPage={fetchNextPage}
                      isFetchingNextPage={isFetchingNextPage}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Duration Field */}
            {/* <FormField
              control={form.control}
              name="durationMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {componentT("form.durationMinutes.label")}
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min="0"
                      placeholder={componentT(
                        "form.durationMinutes.placeholder"
                      )}
                      disabled={isPending}
                      onChange={(e) =>
                        field.onChange(parseInt(e.target.value) || 0)
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            /> */}

            {/* Pricing Section */}
            {/* <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <FormField
                control={form.control}
                name="currency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{componentT("form.currency.label")}</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={componentT(
                              "form.currency.placeholder"
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {CURRENCIES.map((currency) => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{componentT("form.value.label")}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder={componentT("form.value.placeholder")}
                        disabled={isPending}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pricingModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {componentT("form.pricingModel.label")}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isPending}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={componentT(
                              "form.pricingModel.placeholder"
                            )}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {PRICING_MODELS.map((model) => (
                          <SelectItem key={model.value} value={model.value}>
                            {model.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div> */}

            {/* Active Field */}
            {/* <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      {componentT("form.isActive")}
                    </FormLabel>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      disabled={isPending}
                    />
                  </FormControl>
                </FormItem>
              )}
            /> */}

            {/* {isEdit && serviceDefinition && (
              <div className="space-y-6 border-t pt-6">
                <ServiceAttributeDefinitionManager
                  serviceDefinition={serviceDefinition}
                  onUpdate={() => {
                    toast.success(componentT("messages.updated"));
                  }}
                />
                <ServiceRequirementManager
                  serviceDefinition={serviceDefinition}
                  onUpdate={() => {
                    toast.success(componentT("messages.updated"));
                  }}
                />
              </div>
            )} */}

            {/* Submit Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEdit
                    ? componentT("form.updating")
                    : componentT("form.creating")
                  : isEdit
                    ? componentT("form.update")
                    : componentT("form.create")}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin/service-definitions")}
                disabled={isPending}
              >
                {componentT("form.cancel")}
              </Button>
            </div>
          </form>
        </Form>
      </ZodErrorProvider>
    </CardContent>
  );
}

export function ServiceDefinitionFormSkeleton() {
  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={SERVICE_DEFINITION_TRANSLATION_KEY}>
        <div className="space-y-6">
          {/* Name Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>

          {/* Description Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-20 w-full rounded-md" />
          </div>

          {/* Category Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>

          {/* Duration Field */}
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-9 w-full rounded-md" />
          </div>

          {/* Pricing Section */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-4 pt-4">
            <Skeleton className="h-9 w-32 rounded-md" />
            <Skeleton className="h-9 w-20 rounded-md" />
          </div>
        </div>
      </ZodErrorProvider>
    </CardContent>
  );
}

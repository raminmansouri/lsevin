"use client";

import { useState, useTransition } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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

const CURRENCIES = ["USD", "EUR", "GBP", "AED", "TRY", "IRR", "OMR"];
const PRICING_MODELS = ["Fixed", "StartingFrom", "Variable", "Hourly", "Package", "Free"];

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
  const [open, setOpen] = useState(false);
  const selectedOption = value ? options.find((option) => option.categoryId === value) : undefined;
  const formatDisplayName = (option: CategoryOption) =>
    option.parentName ? `${option.parentName} > ${option.name}` : option.name;

  const handleSelect = (optionId: string) => {
    onValueChange?.(value === optionId ? undefined : optionId);
    setOpen(false);
  };

  const handleRemove = (event: React.MouseEvent | React.KeyboardEvent) => {
    event.stopPropagation();
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
                <span
                  className="hover:bg-muted-foreground/20 ml-auto cursor-pointer rounded-full p-0.5"
                  onClick={handleRemove}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleRemove(event);
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </span>
              )}
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder || "Select category"}</span>
          )}
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search categories..." onValueChange={onSearch} />
          <CommandList>
            <CommandEmpty>No category found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.categoryId} value={option.name} onSelect={() => handleSelect(option.categoryId)}>
                  <Check className={cn("mr-2 h-4 w-4", value === option.categoryId ? "opacity-100" : "opacity-0")} />
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

export function ServiceDefinitionForm({ serviceDefinition }: ServiceDefinitionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [categorySearch, setCategorySearch] = useState("");
  const locale = useLocale();
  const componentT = useTranslations(SERVICE_DEFINITION_TRANSLATION_KEY);
  const { invalidateAllCache } = useServiceDefinitionsBySearchCacheManagement();
  const { invalidateAllCache: invalidateAllLocalesCache } = useServiceDefinitionsAllLocalesBySearchCacheManagement();

  const { data: categoryOptions, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useCategoriesBySearch(categorySearch, locale);

  const isEdit = !!serviceDefinition;
  const form = useForm<ServiceDefinitionFormInput>({
    defaultValues: {
      serviceDefinitionId: serviceDefinition?.id,
      name: serviceDefinition?.name ? { translations: serviceDefinition.name.translations } : createEmptyLocalizedContent(),
      description: serviceDefinition?.description ? { translations: serviceDefinition.description.translations } : createEmptyLocalizedContent(),
      categoryId: serviceDefinition?.categoryId,
      durationMinutes: serviceDefinition?.durationMinutes ?? 0,
      currency: serviceDefinition?.currency ?? "USD",
      value: serviceDefinition?.basePrice ?? 0,
      pricingModel: serviceDefinition?.pricingModel ?? "Fixed",
      isActive: serviceDefinition?.isActive ?? true,
    },
    resolver: zodResolver(ServiceDefinitionFormSchema),
  });

  const action = isEdit ? updateServiceDefinitionAction : createServiceDefinitionAction;
  const { execute } = useAction(action, {
    startTransition,
    onSuccess: () => {
      toast.success(componentT("messages.success"));
      invalidateAllCache();
      invalidateAllLocalesCache();
      router.push("/admin/service-definitions");
    },
    onError: (error) => toast.error(error.detail || componentT("messages.error")),
  });

  const onSubmit = async (values: ServiceDefinitionFormInput) => {
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

    startTransition(async () => execute(payload));
  };

  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={SERVICE_DEFINITION_TRANSLATION_KEY}>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="form-container space-y-6">
            {isEdit && (
              <FormField control={form.control} name="serviceDefinitionId" render={({ field }) => <Input {...field} type="hidden" disabled />} />
            )}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
              <div className="space-y-6">
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
                          rows={5}
                          maxLength={2000}
                          error={form.formState.errors.description?.message}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4 rounded-2xl border bg-muted/20 p-4">
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
                          options={categoryOptions ?? []}
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

                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{componentT("form.durationMinutes.label")}</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" disabled={isPending} onChange={(event) => field.onChange(Number(event.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="currency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{componentT("form.currency.label")}</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                          <FormControl>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {CURRENCIES.map((currency) => <SelectItem key={currency} value={currency}>{currency}</SelectItem>)}
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
                          <Input {...field} type="number" min="0" step="0.01" disabled={isPending} onChange={(event) => field.onChange(Number(event.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="pricingModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{componentT("form.pricingModel.label")}</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange} disabled={isPending}>
                        <FormControl>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PRICING_MODELS.map((model) => <SelectItem key={model} value={model}>{model}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-xl border bg-background p-4">
                      <div>
                        <FormLabel>{componentT("form.isActive.label")}</FormLabel>
                        <p className="text-muted-foreground text-xs">Show this service definition in provider setup and booking flows.</p>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} disabled={isPending} />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 border-t pt-6">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/service-definitions")} disabled={isPending}>
                {componentT("actions.cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isEdit ? componentT("actions.update") : componentT("actions.create")}
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
    <CardContent className="space-y-6">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-40 w-full" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </CardContent>
  );
}

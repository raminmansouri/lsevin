"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { ZodErrorProvider } from "@/components/providers/zod-error-provider";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import {
  createEmptyLocalizedContent,
  normalizeLocalizedFields,
} from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

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
import { LazyServiceDefinitionLookupSelect } from "./lazy-service-definition-lookup-select";

interface ServiceDefinitionFormProps {
  serviceDefinition?: ServiceDefinitionDetails;
}

const CURRENCY_OPTIONS = ["USD", "EUR", "GBP", "AED", "TRY", "IRR", "OMR"].map((currency) => ({
  value: currency,
  label: currency,
}));

const PRICING_MODEL_OPTIONS = [
  { value: "Fixed", label: "Fixed" },
  { value: "StartingFrom", label: "Starting from" },
  { value: "Variable", label: "Variable" },
  { value: "Hourly", label: "Hourly" },
  { value: "Package", label: "Package" },
  { value: "Free", label: "Free" },
];

export function ServiceDefinitionForm({ serviceDefinition }: ServiceDefinitionFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();
  const componentT = useTranslations(SERVICE_DEFINITION_TRANSLATION_KEY);
  const { invalidateAllCache } = useServiceDefinitionsBySearchCacheManagement();
  const { invalidateAllCache: invalidateAllLocalesCache } = useServiceDefinitionsAllLocalesBySearchCacheManagement();

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

  const initialCategoryOptions = serviceDefinition?.categoryId
    ? [
        {
          value: serviceDefinition.categoryId,
          label: serviceDefinition.categoryName || serviceDefinition.categoryId,
        },
      ]
    : [];

  const initialCurrencyOptions = serviceDefinition?.currency
    ? [{ value: serviceDefinition.currency, label: serviceDefinition.currency }, ...CURRENCY_OPTIONS]
    : CURRENCY_OPTIONS;

  const initialPricingModelOptions = serviceDefinition?.pricingModel
    ? [
        {
          value: serviceDefinition.pricingModel,
          label: serviceDefinition.pricingModel,
        },
        ...PRICING_MODEL_OPTIONS,
      ]
    : PRICING_MODEL_OPTIONS;

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
                        <LazyServiceDefinitionLookupSelect
                          lookupType="categories"
                          locale={locale}
                          value={field.value}
                          onValueChange={(nextValue) => field.onChange(nextValue ?? "")}
                          placeholder={componentT("form.categoryId.placeholder")}
                          searchPlaceholder="Search categories..."
                          emptyMessage="No category found."
                          initialOptions={initialCategoryOptions}
                          disabled={isPending}
                          allowClear={false}
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
                        <FormControl>
                          <LazyServiceDefinitionLookupSelect
                            lookupType="currencies"
                            locale={locale}
                            value={field.value}
                            onValueChange={(nextValue) => field.onChange(nextValue ?? "")}
                            placeholder="Currency"
                            searchPlaceholder="Search currencies..."
                            emptyMessage="No currency found."
                            initialOptions={initialCurrencyOptions}
                            disabled={isPending}
                            allowClear={false}
                          />
                        </FormControl>
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
                      <FormControl>
                        <LazyServiceDefinitionLookupSelect
                          lookupType="pricingModels"
                          locale={locale}
                          value={field.value}
                          onValueChange={(nextValue) => field.onChange(nextValue ?? "")}
                          placeholder="Pricing model"
                          searchPlaceholder="Search pricing models..."
                          emptyMessage="No pricing model found."
                          initialOptions={initialPricingModelOptions}
                          disabled={isPending}
                          allowClear={false}
                        />
                      </FormControl>
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

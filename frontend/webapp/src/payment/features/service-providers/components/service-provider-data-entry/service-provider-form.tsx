"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { CountryCode, getCountryCallingCode } from "libphonenumber-js";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { PhoneInput } from "@/components/form/phone-input";
import { MapPicker } from "@/components/map/map-picker";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { ProviderTypeSelectorWithInfiniteScroll } from "@/features/provider-types/components/provider-type-selector-with-infinite-scroll";
import { useAllCitiesByCountry } from "@/features/shared/api/client/get-all-cities-by-country";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import { ILocationCountry } from "@/features/shared/types/location";
import {
  createEmptyLocalizedContent,
  normalizeLocalizedContent,
} from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

import { createServiceProviderAction } from "../../actions/create-service-provider";
import { updateServiceProviderAction } from "../../actions/update-service-provider";
import { useServiceProvidersByTypeCacheManagement } from "../../api/client/get-service-providers-by-type";
import {
  ServiceProviderFormInput,
  ServiceProviderFormSchema,
} from "../../schemas";
import {
  idToGrade,
  ServiceProviderDetails,
  ServiceProviderGrade,
  ServiceProviderGradeDisplayMap,
} from "../../types";
import {
  SERVICE_PROVIDERS_ROUTES,
  TRANSLATION_KEY,
} from "../../types/constants";

interface ServiceProviderFormProps {
  serviceProvider?: ServiceProviderDetails;
  countries?: ILocationCountry[];
}

export function ServiceProviderForm({
  serviceProvider,
  countries = [],
}: ServiceProviderFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const locale = useLocale();

  const componentT = useTranslations(TRANSLATION_KEY);
  const { invalidateAllCache: invalidateServiceProviderDetailsCache } =
    useServiceProvidersByTypeCacheManagement();
  const isEdit = !!serviceProvider;

  // Format phone number for form if editing
  const formattedPhoneNumber =
    serviceProvider?.phoneNumber && serviceProvider?.phoneNumberCountryCode
      ? `+${getCountryCallingCode(serviceProvider.phoneNumberCountryCode as CountryCode)}${serviceProvider.phoneNumber}`
      : "";

  const gradeEnumValue = serviceProvider?.gradeId
    ? idToGrade(serviceProvider.gradeId)
    : undefined;

  const form = useForm<ServiceProviderFormInput>({
    defaultValues: {
      serviceProviderId: serviceProvider?.id,
      name: serviceProvider?.name || createEmptyLocalizedContent(),
      description:
        serviceProvider?.description || createEmptyLocalizedContent(),
      providerTypeId: serviceProvider?.providerTypeId ?? "",
      country: serviceProvider?.country ?? "",
      city: serviceProvider?.city ?? "",
      street: serviceProvider?.street || createEmptyLocalizedContent(),
      detail: serviceProvider?.detail || createEmptyLocalizedContent(),
      zipCode: serviceProvider?.zipCode ?? "",
      coordinates: serviceProvider?.coordinates || null,
      email: serviceProvider?.email ?? "",
      phoneNumber: formattedPhoneNumber,
      phoneNumberCountryCode: serviceProvider?.phoneNumberCountryCode ?? "",
      grade: gradeEnumValue,
      isActive: serviceProvider?.isActive ?? true,
    },
    resolver: zodResolver(ServiceProviderFormSchema),
  });

  const selectedCountryCode = useWatch({
    name: "country",
    control: form.control,
  });

  const { data: cities, isFetching: isLoadingCities } = useAllCitiesByCountry(
    selectedCountryCode || serviceProvider?.country || "",
    locale
  );

  const action = isEdit
    ? updateServiceProviderAction
    : createServiceProviderAction;
  const { execute } = useAction(action, {
    startTransition,
    onSuccess: () => {
      toast.success(componentT("messages.success"));
      invalidateServiceProviderDetailsCache();
      router.push(SERVICE_PROVIDERS_ROUTES.LIST);
    },
    onError: (error) => {
      toast.error(error.detail || componentT("messages.error"));
    },
  });

  const onSubmit = async (values: ServiceProviderFormInput) => {
    // Normalize localized fields
    const payload = {
      ...values,
      name: normalizeLocalizedContent(values.name),
      description: normalizeLocalizedContent(values.description),
      street: values.street
        ? normalizeLocalizedContent(values.street)
        : undefined,
      detail: values.detail
        ? normalizeLocalizedContent(values.detail)
        : undefined,
      coordinates: values.coordinates || null,
      email: values.email.trim(),
      zipCode: values.zipCode?.trim() || undefined,
      phoneNumber: values.phoneNumber?.trim() || undefined,
      phoneNumberCountryCode:
        values.phoneNumberCountryCode?.trim() || undefined,
    };

    startTransition(async () => {
      await execute(payload);
    });
  };

  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={TRANSLATION_KEY}>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="form-container space-y-6"
          >
            {isEdit && (
              <FormField
                control={form.control}
                name="serviceProviderId"
                render={({ field }) => (
                  <Input {...field} type="hidden" disabled />
                )}
              />
            )}

            {/* Basic Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {componentT("form.sections.basicInfo")}
              </h3>

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
                        error={form.formState.errors.name?.message}
                        required
                        maxLength={100}
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
                        error={form.formState.errors.description?.message}
                        richText
                        rows={4}
                        maxLength={2000}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="providerTypeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {componentT("form.providerTypeId.label")}
                    </FormLabel>
                    <FormControl>
                      <ProviderTypeSelectorWithInfiniteScroll
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder={componentT(
                          "form.providerTypeId.placeholder"
                        )}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{componentT("form.grade.label")}</FormLabel>
                    <Select
                      disabled={isPending}
                      onValueChange={(value) => {
                        // Convert "NONE" to undefined, otherwise use the value
                        field.onChange(value === "NONE" ? undefined : value);
                      }}
                      value={field.value || "NONE"}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={componentT("form.grade.placeholder")}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="NONE">
                          {componentT("form.grade.none")}
                        </SelectItem>
                        {Object.values(ServiceProviderGrade).map(
                          (gradeValue) => (
                            <SelectItem key={gradeValue} value={gradeValue}>
                              {ServiceProviderGradeDisplayMap[gradeValue]}
                            </SelectItem>
                          )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/*
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {componentT("form.fields.isActive.label")}
                      </FormLabel>
                      <div className="text-muted-foreground text-sm">
                        {componentT("form.fields.isActive.description")}
                      </div>
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
            </div>

            {/* Address Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {componentT("form.sections.addressInfo")}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{componentT("form.country.label")}</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          const nextCountry = String(value || "").trim();
                          const currentCountry = String(field.value || "").trim();

                          field.onChange(nextCountry);

                          if (nextCountry !== currentCountry) {
                            form.setValue("city", "", {
                              shouldDirty: true,
                              shouldTouch: false,
                              shouldValidate: false,
                            });
                            form.clearErrors("city");
                          }
                        }}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger disabled={isPending}>
                            <SelectValue
                              placeholder={componentT(
                                "form.country.placeholder"
                              )}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.value}
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
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{componentT("form.city.label")}</FormLabel>
                      <Select
                        onValueChange={(value) => {
                          form.setValue("city", String(value || "").trim(), {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          });
                        }}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger
                            disabled={
                              isPending ||
                              isLoadingCities ||
                              !selectedCountryCode
                            }
                          >
                            <SelectValue
                              placeholder={
                                !selectedCountryCode
                                  ? componentT("form.selectCountryFirst")
                                  : !cities?.length
                                    ? componentT("form.noCitiesAvailable")
                                    : componentT("form.city.placeholder")
                              }
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {cities?.map((city) => (
                            <SelectItem key={city.code} value={city.code}>
                              {city.value}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="street"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <LocalizedInput
                        label={componentT("form.street.label")}
                        value={field.value}
                        onChange={field.onChange}
                        error={form.formState.errors.street?.message}
                        maxLength={200}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="detail"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <LocalizedInput
                        label={componentT("form.detail.label")}
                        value={field.value}
                        onChange={field.onChange}
                        error={form.formState.errors.detail?.message}
                        rows={3}
                        maxLength={1000}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="zipCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{componentT("form.zipCode.label")}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={componentT("form.zipCode.placeholder")}
                        {...field}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <MapPicker
                namePrefix="coordinates"
                disabled={isPending}
                label={componentT("form.coordinates.label")}
                description={componentT("form.coordinates.description")}
              />
            </div>

            {/* Contact Information Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">
                {componentT("form.sections.contactInfo")}
              </h3>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{componentT("form.email.label")}</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={componentT("form.email.placeholder")}
                          {...field}
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phoneNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {componentT("form.phoneNumber.label")}
                      </FormLabel>
                      <FormControl>
                        <PhoneInput
                          disabled={isPending}
                          defaultCountry={
                            (serviceProvider?.phoneNumberCountryCode as CountryCode) ||
                            "US"
                          }
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(SERVICE_PROVIDERS_ROUTES.LIST)}
                disabled={isPending}
              >
                {componentT("form.actions.cancel")}
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? componentT("form.actions.saving")
                  : componentT("form.actions.save")}
              </Button>
            </div>
          </form>
        </Form>
      </ZodErrorProvider>
    </CardContent>
  );
}

export function ServiceProviderFormSkeleton() {
  return (
    <CardContent>
      <ZodErrorProvider componentNamespace={TRANSLATION_KEY}>
        <div className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" /> {/* Section title */}
            {/* Name Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            {/* Description Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
            {/* Provider Type Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            {/* Active Status Field */}
            {/* <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-11 rounded-full" />
            </div> */}
          </div>

          {/* Address Information Section */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-44" /> {/* Section title */}
            {/* Country and City Fields */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            </div>
            {/* Street Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-18" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
            {/* Detail Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-20 w-full rounded-md" />
            </div>
            {/* Zip Code Field */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </div>

          {/* Contact Information Section */}
          <div className="space-y-4">
            <Skeleton className="h-6 w-48" /> {/* Section title */}
            {/* Email and Phone Fields - 2 columns on desktop */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <Skeleton className="h-9 w-20 rounded-md" />
            <Skeleton className="h-9 w-32 rounded-md" />
          </div>
        </div>
      </ZodErrorProvider>
    </CardContent>
  );
}

export default ServiceProviderForm;

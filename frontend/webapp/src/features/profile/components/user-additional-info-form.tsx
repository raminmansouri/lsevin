"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import DatePicker from "@/components/form/date-picker";
import { ZodErrorProvider } from "@/components/providers/zod-error-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { useAllCitiesByCountry } from "@/features/shared/api/client/get-all-cities-by-country";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
// import {
//   LocationSelector,
//   LocationSelectorSkeleton,
// } from "@/features/shared/components/location-selector";
import { Gender, GenderValueMap } from "@/features/shared/types/common";
import { ILocationCountry } from "@/features/shared/types/location";
import { ICurrentUser } from "@/features/shared/types/user";
import {
  createEmptyLocalizedContent,
  normalizeLocalizedContent,
} from "@/features/shared/utils/localization";
import useAction from "@/hooks/use-action";
import { formatDateForForm } from "@/lib/formatters";

import { updateAdditionalInfo } from "../actions/update-additional-info";
import { UpdateAdditionalInfoSchema } from "../actions/update-additional-info/schema";
import {
  InputType,
  TRANSLATION_KEY,
} from "../actions/update-additional-info/types";

type Props = Pick<ICurrentUser, "birthDate" | "address" | "gender"> & {
  countries: ILocationCountry[];
};

export const UserAdditionalInfoForm = ({
  birthDate,
  address,
  gender,
  countries,
}: Props) => {
  const [isPending, startTransition] = useTransition();

  const t = useTranslations(TRANSLATION_KEY);
  const commonT = useTranslations("Common");

  const locale = useLocale();

  // Convert string gender from API to numeric value for the form
  const numericGender =
    gender && typeof gender === "string"
      ? GenderValueMap[gender as keyof typeof GenderValueMap]
      : Gender.Male;

  const form = useForm<InputType>({
    resolver: zodResolver(UpdateAdditionalInfoSchema),
    mode: "onSubmit",
    defaultValues: {
      birthDate: birthDate ? formatDateForForm(birthDate) : "",
      address: {
        countryCode: address?.country || "",
        cityCode: address?.city || "",
        street: address?.street || createEmptyLocalizedContent(),
        detail: address?.detail || createEmptyLocalizedContent(),
        zipCode: address?.zipCode || "",
      },
      gender: numericGender,
    },
  });

  const selectedCountryCode = useWatch({
    name: "address.countryCode",
    control: form.control,
  });

  const { data: cities, isFetching: isLoadingCities } = useAllCitiesByCountry(
    selectedCountryCode || address?.country || "",
    locale
  );

  const { execute } = useAction(updateAdditionalInfo, {
    startTransition,
    onSuccess: () => {
      toast.success(t("messages.updateSuccess"));
    },
    onError: (error) => {
      toast.error(error?.detail || t("errors.updateFailed"));
    },
  });

  function onSubmit(values: InputType) {
    // Normalize localized address fields
    const normalizedAddress = {
      ...values.address,
      street: values.address.street
        ? normalizeLocalizedContent(values.address.street)
        : undefined,
      detail: values.address.detail
        ? normalizeLocalizedContent(values.address.detail)
        : undefined,
    };

    const payload = {
      ...values,
      address: normalizedAddress,
    };

    startTransition(async () => {
      execute(payload);
    });
  }

  return (
    <ZodErrorProvider componentNamespace={TRANSLATION_KEY}>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("personalInfo.title")}</CardTitle>
              <CardDescription>{t("page.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="birthDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>{t("form.birthDate.label")}</FormLabel>
                      <FormControl>
                        <DatePicker
                          value={field.value}
                          onChange={field.onChange}
                          placeholder={t("placeholders.birthDate")}
                          disabled={isPending}
                          enableMonthSelect
                          enableYearSelect
                          disableFuture={true}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t("form.gender.label")}</FormLabel>
                      <Select
                        disabled={isPending}
                        onValueChange={(value) => field.onChange(Number(value))}
                        defaultValue={field.value?.toString()}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={commonT("Gender.title")}
                            />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={Gender.Male.toString()}>
                            {commonT("Gender.male")}
                          </SelectItem>
                          <SelectItem value={Gender.Female.toString()}>
                            {commonT("Gender.female")}
                          </SelectItem>
                          <SelectItem value={Gender.Other.toString()}>
                            {commonT("Gender.other")}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">
                  {commonT("Address.title")}
                </h3>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {/* Country Selector with FormField */}
                  <FormField
                    control={form.control}
                    name="address.countryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {commonT("Location.selectCountry")}
                        </FormLabel>
                        <Select
                          disabled={isPending}
                          onValueChange={(value) => {
                            field.onChange(value);
                            // Reset city when country changes
                            form.setValue("address.cityCode", "");
                          }}
                          value={field.value || ""}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={commonT("Location.selectCountry")}
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem
                                key={country.code}
                                value={country.code}
                              >
                                {country.value}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* City Selector with FormField */}
                  <FormField
                    control={form.control}
                    name="address.cityCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{commonT("Location.selectCity")}</FormLabel>
                        {isLoadingCities ? (
                          <Skeleton className="h-10 w-full" />
                        ) : (
                          <Select
                            disabled={
                              isPending ||
                              !selectedCountryCode ||
                              !cities?.length
                            }
                            onValueChange={field.onChange}
                            value={field.value || ""}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    !selectedCountryCode
                                      ? commonT("Location.noCountrySelected")
                                      : !cities?.length
                                        ? commonT("Location.noCitiesAvailable")
                                        : commonT("Location.selectCity")
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
                        )}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="address.street"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormControl>
                          <LocalizedInput
                            label={t("form.address.street")}
                            value={field.value}
                            onChange={field.onChange}
                            error={
                              form.formState.errors.address?.street?.message
                            }
                            maxLength={200}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.zipCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t("form.address.zipCode")}</FormLabel>
                        <FormControl>
                          <Input disabled={isPending} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="address.detail"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <LocalizedInput
                            label={t("form.address.detail")}
                            value={field.value}
                            onChange={field.onChange}
                            error={
                              form.formState.errors.address?.detail?.message
                            }
                            maxLength={1000}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isPending} className="ml-auto">
                {t("buttons.save")}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    </ZodErrorProvider>
  );
};

export const UserAdditionalInfoFormSkeleton = () => {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>

        <div className="space-y-4">
          <Skeleton className="h-6 w-1/5" />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Skeleton className="ml-auto h-10 w-24" />
      </CardFooter>
    </Card>
  );
};

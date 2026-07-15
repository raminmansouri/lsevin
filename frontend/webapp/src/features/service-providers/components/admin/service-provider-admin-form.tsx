"use client";


import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, ArrowLeft } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORTED_LOCALE_HEADERS } from "@/config/locales";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

import { saveServiceProviderProfileAction } from "../../actions/admin";
import {
  normalizeLocalizedContentForDatabase,
  normalizeMediaPickerValue,
  toLocalizedInputValue,
  type AdminLocalizedInputValue,
} from "../../lib/admin-form-normalizers";
import {
  saveServiceProviderProfileSchema,
  type SaveServiceProviderProfileInput,
} from "../../schemas/admin-service-provider.schemas";
import { LazyAdminLookupSelect } from "./lazy-admin-lookup-select";
import type {
  AdminLookupOption,
  AdminProviderLookupData,
  AdminServiceProviderDetails,
} from "../../db/admin-service-providers.queries";
import { RHFSingleMediaPickerField } from "../service-provider-data-entry/media-picker-adapter";

type Props = {
  provider?: AdminServiceProviderDetails;
  lookups: AdminProviderLookupData;
  locale: string;
};

type ServiceProviderAdminFormValues = Omit<
  SaveServiceProviderProfileInput,
  "name" | "description" | "street" | "detail" | "imageUrl"
> & {
  name: AdminLocalizedInputValue;
  description: AdminLocalizedInputValue;
  street: AdminLocalizedInputValue;
  detail: AdminLocalizedInputValue;
  imageUrl: unknown;
};

function translationsOrEmpty(value?: unknown, locale?: string): AdminLocalizedInputValue {
  return toLocalizedInputValue(value, locale, SUPPORTED_LOCALE_HEADERS);
}

function buildServiceProviderDefaultValues(
  provider: AdminServiceProviderDetails | undefined,
  locale: string
): ServiceProviderAdminFormValues {
  return {
    serviceProviderId: provider?.id,
    name: translationsOrEmpty(provider?.name, locale),
    description: translationsOrEmpty(provider?.description, locale),
    providerTypeId: provider?.providerTypeId ?? "",
    isActive: provider?.isActive ?? true,
    country: provider?.country ?? "",
    city: provider?.city ?? "",
    street: translationsOrEmpty(provider?.street, locale),
    detail: translationsOrEmpty(provider?.detail, locale),
    zipCode: provider?.zipCode ?? "",
    email: provider?.email ?? "",
    phoneNumberCountryCode: provider?.phoneNumberCountryCode ?? "+98",
    phoneNumber: provider?.phoneNumber ?? "",
    gradeId: provider?.gradeId ?? undefined,
    latitude: provider?.latitude ?? undefined,
    longitude: provider?.longitude ?? undefined,
    rating: provider?.rating ?? 0,
    reviewCount: provider?.reviewCount ?? 0,
    accredited: provider?.accredited ?? false,
    responseTime: provider?.responseTime ?? "",
    establishedYear: provider?.establishedYear ?? undefined,
    totalPatients: provider?.totalPatients ?? "",
    successRate: provider?.successRate ?? "",
    languagesText: provider?.languages?.join(", ") ?? "",
    isSponsored: provider?.isSponsored ?? false,
    sponsoredTag: provider?.sponsoredTag ?? "",
    specialtiesText: provider?.specialties?.join(", ") ?? "",
    featuredScore: provider?.featuredScore ?? 0,
    internationalPriceMultiplier: provider?.internationalPriceMultiplier ?? null,
    imageUrl: provider?.imageUrl ?? "",
    timezoneId: provider?.timezoneId ?? "UTC",
  };
}

function parseCoordinatePair(value: string) {
  const matches = value
    .replace(/[،؛]/g, ",")
    .match(/-?\d+(?:[.,]\d+)?/g);

  if (!matches || matches.length < 2) return null;

  const latitude = Number(matches[0].replace(",", "."));
  const longitude = Number(matches[1].replace(",", "."));

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) return null;

  return { latitude, longitude };
}

function getLookupValueKey(option: AdminLookupOption) {
  return option.code ? String(option.code) : String(option.id);
}

function uniqueLookupOptions(options: AdminLookupOption[]) {
  const seen = new Set<string>();
  const result: AdminLookupOption[] = [];

  for (const option of options) {
    const key = getLookupValueKey(option);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(option);
  }

  return result;
}


type LocalizedInputBridgeProps = {
  label: string;
  value: unknown;
  onChange: (value: AdminLocalizedInputValue) => void;
  locale: string;
  required?: boolean;
  maxLength?: number;
  description?: string;
  error?: string;
  multiline?: boolean;
  rows?: number;
  richText?: boolean;
};

function LocalizedInputBridge({
  value,
  onChange,
  locale,
  ...props
}: LocalizedInputBridgeProps) {
  const normalizedValue = useMemo(
    () => toLocalizedInputValue(value, locale, SUPPORTED_LOCALE_HEADERS),
    [value, locale]
  );

  return (
    <LocalizedInput
      {...props}
      value={normalizedValue}
      onChange={(nextValue) =>
        onChange(toLocalizedInputValue(nextValue, locale, SUPPORTED_LOCALE_HEADERS))
      }
      supportedLocales={SUPPORTED_LOCALE_HEADERS}
    />
  );
}

export function ServiceProviderAdminForm({ provider, lookups, locale }: Props) {
  const tAdmin = useTranslations("AdminGenerated");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [coordinatesText, setCoordinatesText] = useState(
    provider?.latitude !== null && provider?.latitude !== undefined && provider?.longitude !== null && provider?.longitude !== undefined
      ? `${provider.latitude}, ${provider.longitude}`
      : ""
  );
  const isEdit = Boolean(provider?.id);

  const defaultValues = useMemo(
    () => buildServiceProviderDefaultValues(provider, locale),
    [provider, locale]
  );

  const form = useForm<ServiceProviderAdminFormValues>({
    resolver: zodResolver(saveServiceProviderProfileSchema) as any,
    defaultValues,
  });

  useEffect(() => {
    form.reset(defaultValues);
    setCoordinatesText(
      provider?.latitude !== null &&
        provider?.latitude !== undefined &&
        provider?.longitude !== null &&
        provider?.longitude !== undefined
        ? `${provider.latitude}, ${provider.longitude}`
        : ""
    );
  }, [defaultValues, form, provider?.latitude, provider?.longitude]);

  const { execute } = useAction(saveServiceProviderProfileAction, {
    startTransition,
    onSuccess: (id) => {
      toast.success(isEdit ? "Service provider updated." : "Service provider created.");
      router.push(`/admin/service-providers/${id}/details`);
      router.refresh();
    },
    onError: (error) => {
      toast.error(error.detail || error.title || "Could not save service provider.");
    },
  });

  const onSubmit = (values: ServiceProviderAdminFormValues) => {
    startTransition(async () => {
      await execute({
        ...values,
        name: normalizeLocalizedContentForDatabase(values.name, locale, SUPPORTED_LOCALE_HEADERS),
        description: normalizeLocalizedContentForDatabase(values.description, locale, SUPPORTED_LOCALE_HEADERS),
        street: values.street ? normalizeLocalizedContentForDatabase(values.street, locale, SUPPORTED_LOCALE_HEADERS) : {},
        detail: values.detail ? normalizeLocalizedContentForDatabase(values.detail, locale, SUPPORTED_LOCALE_HEADERS) : {},
        email: values.email.trim(),
        phoneNumberCountryCode: values.phoneNumberCountryCode.trim(),
        phoneNumber: values.phoneNumber.trim(),
        zipCode: values.zipCode?.trim() || null,
        responseTime: values.responseTime?.trim() || null,
        totalPatients: values.totalPatients?.trim() || null,
        successRate: values.successRate?.trim() || null,
        sponsoredTag: values.sponsoredTag?.trim() || null,
        imageUrl: normalizeMediaPickerValue(values.imageUrl) || null,
        timezoneId: values.timezoneId?.trim() || "UTC",
      });
    });
  };

  const selectedCountry = form.watch("country");
  const selectedCountryValue = String(selectedCountry || "").trim();
  const selectedCountryLookup = useMemo(() => {
    const normalizedSelectedCountry = selectedCountryValue.toLowerCase();

    return lookups.countries.find((item) =>
      [item.code, item.label, String(item.id)].some(
        (candidate) =>
          String(candidate || "").trim().toLowerCase() === normalizedSelectedCountry
      )
    );
  }, [lookups.countries, selectedCountryValue]);
  const cityParentId = selectedCountryLookup
    ? String(selectedCountryLookup.id)
    : selectedCountryValue;
  const initialCityOptions = useMemo(
    () =>
      selectedCountryLookup
        ? lookups.cities.filter(
            (city) => city.parentId === String(selectedCountryLookup.id)
          )
        : [],
    [lookups.cities, selectedCountryLookup]
  );
  const [cityOptions, setCityOptions] = useState<AdminLookupOption[]>(() =>
    uniqueLookupOptions(initialCityOptions)
  );

  useEffect(() => {
    if (!selectedCountryValue) {
      setCityOptions([]);
      return;
    }

    const controller = new AbortController();
    setCityOptions(uniqueLookupOptions(initialCityOptions));

    const params = new URLSearchParams();
    params.set("type", "cities");
    params.set("locale", locale || "fa-IR");
    params.set("q", "");
    params.set("page", "1");
    params.set("pageSize", "100");
    params.set("parentId", cityParentId);

    fetch(`/api/admin/service-provider-lookups?${params.toString()}`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) throw new Error(`Lookup request failed with ${response.status}`);
        return response.json() as Promise<{ items?: AdminLookupOption[] }>;
      })
      .then((payload) => {
        setCityOptions(
          uniqueLookupOptions([
            ...initialCityOptions,
            ...(Array.isArray(payload.items) ? payload.items : []),
          ])
        );
      })
      .catch((error) => {
        if ((error as Error).name !== "AbortError") {
          setCityOptions(uniqueLookupOptions(initialCityOptions));
        }
      });

    return () => controller.abort();
  }, [cityParentId, initialCityOptions, locale, selectedCountryValue]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{isEdit ? "Edit service provider" : "Create service provider"}</CardTitle>
            <CardDescription>
              Manage the complete provider profile directly from PostgreSQL. Image fields store the selected media URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <section className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold">{tAdmin("identity")}</h3>
                    <p className="text-sm text-muted-foreground">{tAdmin("nameDescriptionProviderTypeStatusAndVisualIdentity")}</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <LocalizedInputBridge label={tAdmin("name")} value={field.value} onChange={field.onChange} locale={locale} required maxLength={200} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <LocalizedInputBridge label={tAdmin("description")} value={field.value} onChange={field.onChange} locale={locale} richText rows={5} maxLength={3000} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="providerTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tAdmin("providerType")}</FormLabel>
                          <FormControl>
                            <LazyAdminLookupSelect
                              lookupType="providerTypes"
                              locale={locale}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder={tAdmin("selectProviderType")}
                              initialOptions={lookups.providerTypes}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="gradeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tAdmin("grade")}</FormLabel>
                          <FormControl>
                            <LazyAdminLookupSelect
                              lookupType="grades"
                              locale={locale}
                              value={field.value ? String(field.value) : ""}
                              onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                              placeholder={tAdmin("selectGrade")}
                              initialOptions={lookups.grades}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <RHFSingleMediaPickerField
                    control={form.control}
                    name="imageUrl"
                    label={tAdmin("providerImage")}
                    placeholder={tAdmin("pickImage")}
                    mediaType="image"
                    helperText="Stores the selected media URL in service_providers.image_url."
                    modalTitle="Pick provider image"
                    key="imageUrl"
                  />
                </section>

                <section className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold">{tAdmin("locationAndContact")}</h3>
                    <p className="text-sm text-muted-foreground">{tAdmin("countryCityCodesShouldMatchCategoryLocationsWhenPossible")}</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tAdmin("country")}</FormLabel>
                          <FormControl>
                            <LazyAdminLookupSelect
                              lookupType="countries"
                              locale={locale}
                              value={field.value}
                              onValueChange={(value) => {
                                const nextCountry = String(value || "").trim();
                                const currentCountry = String(field.value || "").trim();

                                form.setValue("country", nextCountry, {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: false,
                                });
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
                              placeholder={tAdmin("selectCountry")}
                              initialOptions={lookups.countries}
                              valueField="code"
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{tAdmin("city")}</FormLabel>
                          <FormControl>
                            <LazyAdminLookupSelect
                              lookupType="cities"
                              locale={locale}
                              value={field.value}
                              onValueChange={(value) => {
                                form.setValue("city", String(value || "").trim(), {
                                  shouldDirty: true,
                                  shouldTouch: true,
                                  shouldValidate: true,
                                });
                              }}
                              placeholder={tAdmin("selectCity")}
                              initialOptions={cityOptions}
                              valueField="code"
                              queryParams={{ parentId: cityParentId }}
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="zipCode" render={({ field }) => (
                      <FormItem><FormLabel>{tAdmin("zipCode")}</FormLabel><FormControl><Input {...field} value={field.value || ""} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="timezoneId" render={({ field }) => (
                      <FormItem><FormLabel>{tAdmin("timezone")}</FormLabel><FormControl><Input {...field} placeholder={tAdmin("uTC")} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="street" render={({ field }) => (
                    <FormItem><FormControl><LocalizedInputBridge label={tAdmin("street")} value={field.value} onChange={field.onChange} locale={locale} maxLength={500} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <FormField control={form.control} name="detail" render={({ field }) => (
                    <FormItem><FormControl><LocalizedInputBridge label={tAdmin("addressDetails")} value={field.value} onChange={field.onChange} locale={locale} rows={3} maxLength={1000} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <div className="space-y-3 rounded-2xl border p-4">
                    <div className="space-y-1">
                      <FormLabel>{tAdmin("googleMapsCoordinates")}</FormLabel>
                      <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                        <Input
                          dir="ltr"
                          value={coordinatesText}
                          onChange={(event) => {
                            const raw = event.target.value;
                            setCoordinatesText(raw);
                            const parsed = parseCoordinatePair(raw);
                            if (parsed) {
                              form.setValue("latitude", parsed.latitude, { shouldDirty: true, shouldValidate: true });
                              form.setValue("longitude", parsed.longitude, { shouldDirty: true, shouldValidate: true });
                            }
                          }}
                          onBlur={() => {
                            const parsed = parseCoordinatePair(coordinatesText);
                            if (parsed) setCoordinatesText(`${parsed.latitude}, ${parsed.longitude}`);
                          }}
                          placeholder="35.6892, 51.3890"
                          disabled={isPending}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending || !parseCoordinatePair(coordinatesText)}
                          onClick={() => {
                            const parsed = parseCoordinatePair(coordinatesText);
                            if (!parsed) return;
                            form.setValue("latitude", parsed.latitude, { shouldDirty: true, shouldValidate: true });
                            form.setValue("longitude", parsed.longitude, { shouldDirty: true, shouldValidate: true });
                            setCoordinatesText(`${parsed.latitude}, ${parsed.longitude}`);
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{tAdmin("pasteDirectlyFromGoogleMapsTheFirstNumberIsLatitudeAndTheSec3db775e6")}</p>
                    </div>

                    <FormField control={form.control} name="latitude" render={({ field }) => (
                      <input type="hidden" name={field.name} value={field.value ?? ""} ref={field.ref} readOnly />
                    )} />
                    <FormField control={form.control} name="longitude" render={({ field }) => (
                      <input type="hidden" name={field.name} value={field.value ?? ""} ref={field.ref} readOnly />
                    )} />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr]">
                    <FormField control={form.control} name="phoneNumberCountryCode" render={({ field }) => (
                      <FormItem><FormLabel>{tAdmin("phoneCountryCode")}</FormLabel><FormControl><Input {...field} placeholder="+98" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                      <FormItem><FormLabel>{tAdmin("phoneNumber")}</FormLabel><FormControl><Input {...field} dir="ltr" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>{tAdmin("email")}</FormLabel><FormControl><Input type="email" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                  )} />
                </section>
              </div>

              <aside className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">{tAdmin("publishing")}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="isActive" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-xl border p-3">
                        <FormLabel>{tAdmin("active")}</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="accredited" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-xl border p-3">
                        <FormLabel>{tAdmin("accredited")}</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="isSponsored" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-xl border p-3">
                        <FormLabel>{tAdmin("sponsored")}</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="sponsoredTag" render={({ field }) => (
                      <FormItem><FormLabel>{tAdmin("sponsoredTag")}</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder={tAdmin("featured")} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="featuredScore" render={({ field }) => (
                      <FormItem><FormLabel>{tAdmin("featuredScore")}</FormLabel><FormControl><Input type="number" step="0.01" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="internationalPriceMultiplier" render={({ field }) => (
                      <FormItem>
                        <FormLabel>{tAdmin("internationalPriceMultiplier")}</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            step="0.1"
                            min="0"
                            inputMode="decimal"
                            placeholder={tAdmin("internationalPriceMultiplierPlaceholder")}
                            disabled={isPending}
                            value={field.value ?? ""}
                            onChange={(event) => field.onChange(event.target.value === "" ? null : event.target.value)}
                            onBlur={field.onBlur}
                            name={field.name}
                            ref={field.ref}
                          />
                        </FormControl>
                        <FormDescription>{tAdmin("internationalPriceMultiplierHint")}</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">{tAdmin("trustAndDiscovery")}</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="rating" render={({ field }) => (
                        <FormItem><FormLabel>{tAdmin("rating")}</FormLabel><FormControl><Input type="number" step="0.01" min="0" max="5" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="reviewCount" render={({ field }) => (
                        <FormItem><FormLabel>{tAdmin("reviews")}</FormLabel><FormControl><Input type="number" min="0" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="responseTime" render={({ field }) => (
                      <FormItem><FormLabel>{tAdmin("responseTime")}</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder={tAdmin("usuallyRepliesIn1Hour")} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="establishedYear" render={({ field }) => (
                      <FormItem><FormLabel>{tAdmin("establishedYear")}</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="totalPatients" render={({ field }) => (
                      <FormItem><FormLabel>{tAdmin("totalPatients")}</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="10,000+" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="successRate" render={({ field }) => (
                      <FormItem><FormLabel>{tAdmin("successRate")}</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="98%" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="languagesText" render={({ field }) => (
                      <FormItem><FormLabel>{tAdmin("languages")}</FormLabel><FormControl><Textarea {...field} value={field.value || ""} placeholder={tAdmin("enFaArTr")} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="specialtiesText" render={({ field }) => (
                      <FormItem><FormLabel>{tAdmin("specialties")}</FormLabel><FormControl><Textarea {...field} value={field.value || ""} placeholder={tAdmin("hairTransplantDentalSpa")} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </CardContent>
                </Card>
              </aside>
            </div>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-20 flex justify-end gap-3 rounded-2xl border bg-background/95 p-3 shadow-lg backdrop-blur">
          <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button type="submit" disabled={isPending}>
            <Save className="mr-2 h-4 w-4" /> {isPending ? "Saving..." : "Save provider"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

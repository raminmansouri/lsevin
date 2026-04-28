"use client";

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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SUPPORTED_LOCALE_HEADERS } from "@/config/locales";
import { LocalizedInput } from "@/features/shared/components/LocalizedInput";
import { createEmptyLocalizedContent } from "@/features/shared/utils/localization";
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
import {
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

function translationsOrEmpty(value?: Record<string, string> | null, locale?: string): AdminLocalizedInputValue {
  const normalized = toLocalizedInputValue(value, locale, SUPPORTED_LOCALE_HEADERS);
  return Object.keys(normalized.translations).length
    ? normalized
    : (createEmptyLocalizedContent() as AdminLocalizedInputValue);
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

export function ServiceProviderAdminForm({ provider, lookups, locale }: Props) {
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
        name: normalizeLocalizedContentForDatabase(values.name),
        description: normalizeLocalizedContentForDatabase(values.description),
        street: values.street ? normalizeLocalizedContentForDatabase(values.street) : {},
        detail: values.detail ? normalizeLocalizedContentForDatabase(values.detail) : {},
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
  const selectedCountryLookup = lookups.countries.find(
    (item) => item.code === selectedCountry || item.label === selectedCountry || String(item.id) === selectedCountry
  );
  const initialCityOptions = selectedCountryLookup
    ? lookups.cities.filter((city) => city.parentId === String(selectedCountryLookup.id))
    : [];

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{isEdit ? "Edit service provider" : "Create service provider"}</CardTitle>
            <CardDescription>
              Manage the complete provider profile directly from PostgreSQL. Image fields store the selected media id or URL.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8 pt-6">
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <section className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold">Identity</h3>
                    <p className="text-sm text-muted-foreground">Name, description, provider type, status, and visual identity.</p>
                  </div>

                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <LocalizedInput label="Name" value={field.value} onChange={field.onChange} supportedLocales={SUPPORTED_LOCALE_HEADERS} required maxLength={200} />
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
                          <LocalizedInput label="Description" value={field.value} onChange={field.onChange} supportedLocales={SUPPORTED_LOCALE_HEADERS} richText rows={5} maxLength={3000} />
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
                          <FormLabel>Provider type</FormLabel>
                          <FormControl>
                            <LazyAdminLookupSelect
                              lookupType="providerTypes"
                              locale={locale}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select provider type"
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
                          <FormLabel>Grade</FormLabel>
                          <FormControl>
                            <LazyAdminLookupSelect
                              lookupType="grades"
                              locale={locale}
                              value={field.value ? String(field.value) : ""}
                              onValueChange={(value) => field.onChange(value ? Number(value) : null)}
                              placeholder="Select grade"
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
                    label="Provider image"
                    placeholder="Pick image"
                    mediaType="image"
                    helperText="Stores one media id in service_providers.image_url."
                    modalTitle="Pick provider image"
                    key="imageUrl"
                  />
                </section>

                <section className="space-y-4">
                  <div>
                    <h3 className="text-base font-semibold">Location and contact</h3>
                    <p className="text-sm text-muted-foreground">Country/city codes should match category.locations when possible.</p>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Country</FormLabel>
                          <FormControl>
                            <LazyAdminLookupSelect
                              lookupType="countries"
                              locale={locale}
                              value={field.value}
                              onValueChange={(value) => { field.onChange(value); form.setValue("city", ""); }}
                              placeholder="Select country"
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
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <LazyAdminLookupSelect
                              lookupType="cities"
                              locale={locale}
                              value={field.value}
                              onValueChange={field.onChange}
                              placeholder="Select city"
                              initialOptions={initialCityOptions}
                              valueField="code"
                              queryParams={{ parentId: selectedCountry }}
                              disabled={isPending || !selectedCountry}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <FormField control={form.control} name="zipCode" render={({ field }) => (
                      <FormItem><FormLabel>Zip code</FormLabel><FormControl><Input {...field} value={field.value || ""} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="timezoneId" render={({ field }) => (
                      <FormItem><FormLabel>Timezone</FormLabel><FormControl><Input {...field} placeholder="UTC" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="street" render={({ field }) => (
                    <FormItem><FormControl><LocalizedInput label="Street" value={field.value || createEmptyLocalizedContent()} onChange={field.onChange} supportedLocales={SUPPORTED_LOCALE_HEADERS} maxLength={500} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <FormField control={form.control} name="detail" render={({ field }) => (
                    <FormItem><FormControl><LocalizedInput label="Address details" value={field.value || createEmptyLocalizedContent()} onChange={field.onChange} supportedLocales={SUPPORTED_LOCALE_HEADERS} rows={3} maxLength={1000} /></FormControl><FormMessage /></FormItem>
                  )} />

                  <div className="space-y-3 rounded-2xl border p-4">
                    <div className="space-y-1">
                      <FormLabel>Google Maps coordinates</FormLabel>
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
                      <p className="text-xs text-muted-foreground">Paste directly from Google Maps. The first number is latitude and the second is longitude.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <FormField control={form.control} name="latitude" render={({ field }) => (
                        <FormItem><FormLabel>Latitude</FormLabel><FormControl><Input type="number" step="0.0000001" {...field} value={field.value ?? ""} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="longitude" render={({ field }) => (
                        <FormItem><FormLabel>Longitude</FormLabel><FormControl><Input type="number" step="0.0000001" {...field} value={field.value ?? ""} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-[160px_1fr]">
                    <FormField control={form.control} name="phoneNumberCountryCode" render={({ field }) => (
                      <FormItem><FormLabel>Phone country code</FormLabel><FormControl><Input {...field} placeholder="+98" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                      <FormItem><FormLabel>Phone number</FormLabel><FormControl><Input {...field} dir="ltr" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <FormField control={form.control} name="email" render={({ field }) => (
                    <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                  )} />
                </section>
              </div>

              <aside className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-base">Publishing</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <FormField control={form.control} name="isActive" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-xl border p-3">
                        <FormLabel>Active</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="accredited" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-xl border p-3">
                        <FormLabel>Accredited</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="isSponsored" render={({ field }) => (
                      <FormItem className="flex items-center justify-between rounded-xl border p-3">
                        <FormLabel>Sponsored</FormLabel><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      </FormItem>
                    )} />
                    <FormField control={form.control} name="sponsoredTag" render={({ field }) => (
                      <FormItem><FormLabel>Sponsored tag</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Featured" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="featuredScore" render={({ field }) => (
                      <FormItem><FormLabel>Featured score</FormLabel><FormControl><Input type="number" step="0.01" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-base">Trust and discovery</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField control={form.control} name="rating" render={({ field }) => (
                        <FormItem><FormLabel>Rating</FormLabel><FormControl><Input type="number" step="0.01" min="0" max="5" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="reviewCount" render={({ field }) => (
                        <FormItem><FormLabel>Reviews</FormLabel><FormControl><Input type="number" min="0" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="responseTime" render={({ field }) => (
                      <FormItem><FormLabel>Response time</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="Usually replies in 1 hour" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="establishedYear" render={({ field }) => (
                      <FormItem><FormLabel>Established year</FormLabel><FormControl><Input type="number" {...field} value={field.value ?? ""} disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="totalPatients" render={({ field }) => (
                      <FormItem><FormLabel>Total patients</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="10,000+" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="successRate" render={({ field }) => (
                      <FormItem><FormLabel>Success rate</FormLabel><FormControl><Input {...field} value={field.value || ""} placeholder="98%" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="languagesText" render={({ field }) => (
                      <FormItem><FormLabel>Languages</FormLabel><FormControl><Textarea {...field} value={field.value || ""} placeholder="en, fa, ar, tr" disabled={isPending} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="specialtiesText" render={({ field }) => (
                      <FormItem><FormLabel>Specialties</FormLabel><FormControl><Textarea {...field} value={field.value || ""} placeholder="Hair transplant, Dental, Spa" disabled={isPending} /></FormControl><FormMessage /></FormItem>
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

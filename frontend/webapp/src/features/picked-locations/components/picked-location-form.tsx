"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Save } from "lucide-react";
import { useLocale } from "next-intl";
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
import { SingleMediaPickerInput } from "@/features/media-picker-addon";
import { RHFCountryCitySelect } from "@/features/locations/components/rhf-country-city-select";
import useAction from "@/hooks/use-action";
import { useRouter } from "@/i18n/navigation";

import { savePickedLocationAction } from "../actions/save-picked-location";
import { PickedLocationFormInput, PickedLocationFormSchema } from "../schemas";
import { PickedLocationDetails } from "../types";

type Props = {
  pickedLocation?: PickedLocationDetails;
};

function defaultValues(pickedLocation?: PickedLocationDetails): PickedLocationFormInput {
  return {
    pickedLocationId: pickedLocation?.id,
    countryId: pickedLocation?.countryId ?? null,
    locationId: pickedLocation?.locationId ?? "",
    image: pickedLocation?.image ?? "",
    latitude: pickedLocation?.latitude ?? null,
    longitude: pickedLocation?.longitude ?? null,
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

export function PickedLocationForm({ pickedLocation }: Props) {
  const router = useRouter();
  const locale = useLocale();
  const [isPending, startTransition] = useTransition();
  const [coordinatesText, setCoordinatesText] = useState(
    pickedLocation?.latitude !== null &&
      pickedLocation?.latitude !== undefined &&
      pickedLocation?.longitude !== null &&
      pickedLocation?.longitude !== undefined
      ? `${pickedLocation.latitude}, ${pickedLocation.longitude}`
      : "",
  );
  const isEdit = Boolean(pickedLocation);
  const initialValues = useMemo(() => defaultValues(pickedLocation), [pickedLocation]);

  const form = useForm<PickedLocationFormInput>({
    defaultValues: initialValues,
    resolver: zodResolver(PickedLocationFormSchema) as any,
  });

  useEffect(() => {
    form.reset(initialValues);
  }, [form, initialValues]);

  const { execute } = useAction(savePickedLocationAction, {
    startTransition,
    onSuccess: () => {
      toast.success(isEdit ? "Picked location updated." : "Picked location created.");
      router.push("/admin/picked-locations");
      router.refresh();
    },
    onError: (error) => toast.error(error.detail || error.title || "Could not save picked location."),
  });

  const applyCoordinateText = () => {
    const parsed = parseCoordinatePair(coordinatesText);
    if (!parsed) {
      toast.error("Could not read coordinates. Use a format like: 35.6892, 51.3890");
      return;
    }

    form.setValue("latitude", parsed.latitude, { shouldDirty: true, shouldValidate: true });
    form.setValue("longitude", parsed.longitude, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = (values: PickedLocationFormInput) => {
    const { countryId: _countryId, ...payload } = values;

    startTransition(async () => {
      await execute({
        ...payload,
        latitude: payload.latitude ?? null,
        longitude: payload.longitude ?? null,
      });
    });
  };

  return (
    <CardContent className="pt-6">
      <ZodErrorProvider componentNamespace="PickedLocations">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {isEdit ? (
              <FormField
                control={form.control}
                name="pickedLocationId"
                render={({ field }) => <Input {...field} type="hidden" disabled />}
              />
            ) : null}

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
              <div className="space-y-6">
                <section className="space-y-4 rounded-2xl border bg-muted/20 p-4">
                  <div>
                    <h3 className="text-base font-semibold">Location</h3>
                    <p className="text-sm text-muted-foreground">
                      Pick a country and city. The selected city is saved into category.picked_locations.locationid.
                    </p>
                  </div>

                  <RHFCountryCitySelect
                    control={form.control}
                    countryName="countryId"
                    cityName="locationId"
                    locale={locale}
                    fallbackLocale="en-US"
                    disabled={isPending}
                    countryLabel="Country"
                    cityLabel="City"
                  />

                  <FormField
                    control={form.control}
                    name="locationId"
                    render={() => (
                      <FormItem>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </section>

                <section className="space-y-4 rounded-2xl border bg-muted/20 p-4">
                  <div>
                    <h3 className="text-base font-semibold">Coordinates</h3>
                    <p className="text-sm text-muted-foreground">
                      Optional latitude and longitude for map positioning and nearby location logic.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <Input
                      value={coordinatesText}
                      onChange={(event) => setCoordinatesText(event.target.value)}
                      placeholder="Paste coordinates, e.g. 35.6892, 51.3890"
                      dir="ltr"
                      disabled={isPending}
                    />
                    <Button type="button" variant="outline" onClick={applyCoordinateText} disabled={isPending || !coordinatesText.trim()}>
                      Apply
                    </Button>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="latitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Latitude</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.0000001"
                              min="-90"
                              max="90"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              dir="ltr"
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="longitude"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Longitude</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.0000001"
                              min="-180"
                              max="180"
                              value={field.value ?? ""}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                              dir="ltr"
                              disabled={isPending}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </section>
              </div>

              <aside className="space-y-4 rounded-2xl border bg-muted/20 p-4">
                <div>
                  <h3 className="text-base font-semibold">Hero image</h3>
                  <p className="text-sm text-muted-foreground">
                    Stores a media id or URL in the existing image column.
                  </p>
                </div>

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SingleMediaPickerInput
                          name={field.name}
                          value={field.value ?? ""}
                          onValueChange={field.onChange}
                          label="Picked location image"
                          placeholder="Pick an image"
                          mediaType="image"
                          modalTitle="Pick location image"
                          helperText="Recommended: wide city photo. Existing media ids and legacy URLs are supported."
                          disabled={isPending}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </aside>
            </div>

            <div className="flex flex-col-reverse gap-3 border-t pt-4 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" onClick={() => router.push("/admin/picked-locations")} disabled={isPending}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to list
              </Button>
              <Button type="submit" disabled={isPending}>
                <Save className="mr-2 h-4 w-4" />
                {isPending ? "Saving..." : isEdit ? "Save changes" : "Create picked location"}
              </Button>
            </div>
          </form>
        </Form>
      </ZodErrorProvider>
    </CardContent>
  );
}

export function PickedLocationFormSkeleton() {
  return (
    <CardContent className="space-y-6 pt-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_340px]">
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
      <div className="flex justify-between border-t pt-4">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-40" />
      </div>
    </CardContent>
  );
}

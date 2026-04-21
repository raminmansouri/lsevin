"use client";

import React, { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronRight, MapPin, X } from "lucide-react";
import { useFetchPicketLocations } from "@/features/customer/api/client/fetch-picked-locations";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { RHFCountryCitySelect } from "@/features/locations/components/rhf-country-city-select";
import { ImageWithFallback } from "../../../components/figma/ImageWithFallback";
import { env } from "@/config/env/client";

const formSchema = z.object({
  countryId: z.string().uuid().nullable().optional(),
  cityId: z.string().uuid().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type PickedLocation = {
  city: string;
  country: string;
  image?: string | null;
  cityId?: string | null;
  countryId?: string | null;
};

export default function LocationPicker() {
  const { data, isLoading } = useFetchPicketLocations();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      countryId: null,
      cityId: null,
    },
  });

  const locations = useMemo(
    () => (Array.isArray(data) ? (data as PickedLocation[]) : []),
    [data]
  );

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<PickedLocation>({
    city: "Dubai",
    country: "UAE",
    image: null,
    cityId: null,
    countryId: null,
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!showLocationPicker) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showLocationPicker]);

  const handleSelectLocation = (location: PickedLocation) => {
    setSelectedLocation(location);

    if (location.countryId) {
      form.setValue("countryId", location.countryId);
    }

    if (location.cityId) {
      form.setValue("cityId", location.cityId);
    }

    setShowLocationPicker(false);
  };

  const modal =
    mounted && showLocationPicker
      ? createPortal(
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/45 backdrop-blur-[3px]">
            <div className="flex min-h-screen items-start justify-center p-4 sm:p-6">
              <div className="mt-2 w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-[#083f30] via-[#0b4c3d] to-[#0f6b56] px-5 py-5 text-white sm:px-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                      Destination
                    </p>
                    <h3 className="mt-1 text-xl font-bold sm:text-2xl">
                      Select Location
                    </h3>
                    <p className="mt-1 text-sm text-white/80">
                      Choose a featured destination or select country and city manually.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-slate-900">
                        Manual selection
                      </h4>
                      <p className="mt-1 text-xs text-slate-500">
                        Use the selectors below if your destination is not listed in featured locations.
                      </p>
                    </div>

                    <RHFCountryCitySelect
                      control={form.control}
                      countryName="countryId"
                      cityName="cityId"
                      locale="en"
                      fallbackLocale="en"
                      countryLabel="Country"
                      cityLabel="City"
                    />
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">
                        Featured destinations
                      </h4>
                      <p className="text-sm text-slate-500">
                        Quick picks for popular locations
                      </p>
                    </div>

                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {locations.length} available
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div
                          key={index}
                          className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3"
                        >
                          <div className="mb-3 aspect-[4/3] animate-pulse rounded-2xl bg-slate-200" />
                          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                        </div>
                      ))}
                    </div>
                  ) : locations.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {locations.map((location, index) => {
                        const isSelected =
                          selectedLocation.city === location.city &&
                          selectedLocation.country === location.country;

                        return (
                          <button
                            key={`${location.country}-${location.city}-${index}`}
                            type="button"
                            onClick={() => handleSelectLocation(location)}
                            className={`group relative overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                              isSelected
                                ? "border-emerald-500 ring-2 ring-emerald-200"
                                : "border-slate-200 hover:border-emerald-200"
                            }`}
                          >
                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                              {location.image ? (
                                <ImageWithFallback
                                  src={`${env.NEXT_PUBLIC_FILES_URL}/${location.image}`}
                                  alt={location.city}
                                  className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                  <MapPin className="text-slate-400" size={28} />
                                </div>
                              )}

                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/15 to-transparent" />

                              {isSelected && (
                                <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-600 shadow-md">
                                  <Check size={16} />
                                </div>
                              )}

                              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <div className="text-base font-bold leading-tight">
                                  {location.city}
                                </div>
                                <div className="mt-1 text-sm text-white/85">
                                  {location.country}
                                </div>
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200">
                        <MapPin className="text-slate-500" size={20} />
                      </div>
                      <h4 className="text-sm font-semibold text-slate-900">
                        No featured locations found
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        You can still select country and city manually above.
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                  <div className="text-sm text-slate-500">
                    Selected:{" "}
                    <span className="font-semibold text-slate-900">
                      {selectedLocation.city}, {selectedLocation.country}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(false)}
                    className="rounded-2xl bg-[#083f30] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a513f]"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <form
        onSubmit={form.handleSubmit((values) => {
          console.log(values);
        })}
        className="space-y-6"
      >
        <button
          type="button"
          onClick={() => setShowLocationPicker(true)}
          className="group flex w-full items-center justify-between rounded-2xl border border-emerald-100 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#083f30] to-[#0f6b56] text-white shadow-sm">
              <MapPin size={18} />
            </div>

            <div className="text-left">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Current location
              </div>
              <div className="text-sm font-semibold text-gray-900 sm:text-base">
                {selectedLocation.city}, {selectedLocation.country}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm font-medium text-[#083f30]">
            <span className="hidden sm:inline">Change</span>
            <ChevronRight
              size={18}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </div>
        </button>
      </form>

      {modal}
    </>
  );
}
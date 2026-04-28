'use client';

import React, { useMemo, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight, MapPin, X } from 'lucide-react';

import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { RHFCountryCitySelect } from '@/features/locations/components/rhf-country-city-select';
import { getPickedLocations, type HomePickedLocation } from '../actions/get-picked-locations';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';

const formSchema = z.object({
  countryId: z.string().uuid().nullable().optional(),
  cityId: z.string().uuid().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function LocationPicker() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      countryId: null,
      cityId: null,
    },
  });

  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [locations, setLocations] = useState<HomePickedLocation[]>([]);
  const [hasLoadedLocations, setHasLoadedLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<HomePickedLocation>({
    id: 'fallback-dubai',
    city: 'Dubai',
    country: 'UAE',
    image: null,
    cityId: null,
    countryId: null,
    cityCode: null,
    countryCode: null,
    latitude: null,
    longitude: null,
  });

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    if (!showLocationPicker) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showLocationPicker]);

  const loadLocations = () => {
    if (hasLoadedLocations) return;

    startTransition(async () => {
      const rows = await getPickedLocations();
      setLocations(rows);
      setHasLoadedLocations(true);
    });
  };

  const openLocationPicker = () => {
    setShowLocationPicker(true);
    loadLocations();
  };

  const handleSelectLocation = (location: HomePickedLocation) => {
    setSelectedLocation(location);

    if (location.countryId) form.setValue('countryId', location.countryId);
    if (location.cityId) form.setValue('cityId', location.cityId);

    const nextSearchParams = new URLSearchParams(searchParams.toString());
    if (location.countryCode) nextSearchParams.set('countryCode', location.countryCode);
    if (location.cityCode) nextSearchParams.set('cityCode', location.cityCode);
    const query = nextSearchParams.toString();
    router.push(query ? `${pathname}?${query}` : pathname);

    setShowLocationPicker(false);
  };

  const availableLocations = useMemo(() => locations.filter((item) => item.city && item.country), [locations]);

  const modal =
    mounted && showLocationPicker
      ? createPortal(
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/45 backdrop-blur-[3px]">
            <div className="flex min-h-screen items-start justify-center p-4 sm:p-6">
              <div className="mt-2 w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-[#083f30] via-[#0b4c3d] to-[#0f6b56] px-5 py-5 text-white sm:px-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">Destination</p>
                    <h3 className="mt-1 text-xl font-bold sm:text-2xl">Select Location</h3>
                    <p className="mt-1 text-sm text-white/80">
                      Choose a featured destination or select country and city manually.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    aria-label="Close location picker"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="p-5 sm:p-6">
                  <div className="mb-6 rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-slate-900">Manual selection</h4>
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
                      <h4 className="text-base font-bold text-slate-900">Featured destinations</h4>
                      <p className="text-sm text-slate-500">Quick picks for popular locations</p>
                    </div>

                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {availableLocations.length} available
                    </div>
                  </div>

                  {isPending ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="overflow-hidden rounded-3xl border border-slate-200 bg-white p-3">
                          <div className="mb-3 aspect-[4/3] animate-pulse rounded-2xl bg-slate-200" />
                          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-100" />
                        </div>
                      ))}
                    </div>
                  ) : availableLocations.length > 0 ? (
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                      {availableLocations.map((location) => {
                        const isSelected = selectedLocation.id === location.id;
                        const mediaUrl = resolveHomeMediaUrl(location.image);

                        return (
                          <button
                            key={location.id}
                            type="button"
                            onClick={() => handleSelectLocation(location)}
                            className={`group relative overflow-hidden rounded-3xl border bg-white text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl ${
                              isSelected
                                ? 'border-emerald-500 ring-2 ring-emerald-200'
                                : 'border-slate-200 hover:border-emerald-200'
                            }`}
                          >
                            <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                              {mediaUrl ? (
                                <ImageWithFallback
                                  fill
                                  src={mediaUrl}
                                  alt={location.city}
                                  sizes="(min-width: 640px) 33vw, 50vw"
                                  className="object-cover transition duration-500 group-hover:scale-105"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
                                  <MapPin className="text-slate-400" size={28} />
                                </div>
                              )}

                              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-900/15 to-transparent" />

                              {isSelected ? (
                                <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full bg-white text-emerald-600 shadow-md">
                                  <Check size={16} />
                                </div>
                              ) : null}

                              <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                                <div className="text-base font-bold leading-tight">{location.city}</div>
                                <div className="mt-1 text-sm text-white/85">{location.country}</div>
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
                      <h4 className="text-sm font-semibold text-slate-900">No featured locations found</h4>
                      <p className="mt-1 text-sm text-slate-500">Add picked locations in admin to show quick choices here.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        onClick={openLocationPicker}
        className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left transition hover:border-[#083f30]/20 hover:bg-white hover:shadow-sm"
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#083f30]/10 text-[#083f30]">
          <MapPin size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">Current destination</p>
          <p className="truncate text-sm font-bold text-gray-900">
            {selectedLocation.city}, {selectedLocation.country}
          </p>
        </div>
        <ChevronRight size={18} className="text-gray-400" />
      </button>

      {modal}
    </>
  );
}

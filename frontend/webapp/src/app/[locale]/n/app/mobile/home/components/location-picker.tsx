'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight, Loader2, LocateFixed, MapPin, Navigation, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

import { ImageWithFallback } from '@/components/ui/image-with-fallback';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { RHFCountryCitySelect } from '@/features/locations/components/rhf-country-city-select';
import { getPickedLocations, type HomePickedLocation } from '../actions/get-picked-locations';
import {
  getInitialHomeLocationAction,
  resolveHomeLocationFromDetectedIpAction,
  resolveHomeLocationFromCodesAction,
  resolveHomeLocationFromCoordinatesAction,
  resolveHomeLocationFromIdsAction,
  type HomeResolvedLocation,
} from '../actions/resolve-home-location';
import { saveCurrentLocationToProfileAction } from '../actions/save-profile-location';
import { resolveHomeMediaUrl } from '@/features/home/components/home-media';

const formSchema = z.object({
  countryId: z.string().uuid().nullable().optional(),
  cityId: z.string().uuid().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type NavigationMode = 'push' | 'replace' | false;

type ApplyLocationOptions = {
  navigation?: NavigationMode;
  persist?: boolean;
};

type DetectedIpGeoLocation = {
  countryCode: string | null;
  country: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
};

type Props = {
  locale?: string;
};

type LocationSourceLabels = {
  chooseOrDetect: string;
  gps: string;
  profile: string;
  phone: string;
  ip: string;
  saved: string;
  picked: string;
  manual: string;
  url: string;
  current: string;
};

const STORAGE_KEY = 'lsevin.home.selected-location.v1';
const INITIAL_LOCATION: HomeResolvedLocation = {
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
  source: 'manual',
};

function normalizeLocale(locale?: string | null) {
  const value = (locale || 'fa-IR').trim();
  if (value.toLowerCase() === 'en') return 'en-US';
  if (value.toLowerCase() === 'fa') return 'fa-IR';
  if (value.toLowerCase() === 'ar') return 'ar-SA';
  if (value.toLowerCase() === 'tr') return 'tr-TR';
  return value;
}

function toResolvedLocation(location: HomePickedLocation): HomeResolvedLocation {
  return {
    id: location.id,
    city: location.city,
    country: location.country,
    image: location.image,
    cityId: location.cityId,
    countryId: location.countryId,
    cityCode: location.cityCode,
    countryCode: location.countryCode,
    latitude: location.latitude,
    longitude: location.longitude,
    source: 'picked',
  };
}

function isPersistableLocation(value: unknown): value is HomeResolvedLocation {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<HomeResolvedLocation>;
  return Boolean(record.id && (record.countryCode || record.cityCode || record.country || record.city));
}

function parseStoredLocation() {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    return isPersistableLocation(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function persistLocation(location: HomeResolvedLocation) {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(location));
  } catch {
    // Local storage may be blocked by the browser; location still works through query params.
  }
}

function getLocationTitle(location: HomeResolvedLocation, fallback: string) {
  const city = location.city?.trim();
  const country = location.country?.trim();

  if (city && country && city.toLowerCase() !== country.toLowerCase()) return `${city}, ${country}`;
  return country || city || fallback;
}

function getLocationSourceLabel(location: HomeResolvedLocation, labels: LocationSourceLabels) {
  if (location.id === INITIAL_LOCATION.id) return labels.chooseOrDetect;

  switch (location.source) {
    case 'gps':
      return labels.gps;
    case 'profile':
      return labels.profile;
    case 'phone':
      return labels.phone;
    case 'ip':
      return labels.ip;
    case 'saved':
      return labels.saved;
    case 'picked':
      return labels.picked;
    case 'manual':
      return labels.manual;
    case 'url':
      return labels.url;
    default:
      return labels.current;
  }
}


function numberOrNull(value: unknown): number | null {
  if (value == null || value === '') return null;
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function stringOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function normalizeIpGeoPayload(payload: unknown): DetectedIpGeoLocation | null {
  if (!payload || typeof payload !== 'object') return null;

  const record = payload as Record<string, unknown>;

  if (record.error === true || record.success === false || record.status === 'fail') {
    return null;
  }

  const countryCode = stringOrNull(
    record.countryCode ?? record.country_code ?? record.country_code2 ?? record.countryCodeIso2 ?? record.country
  )?.toUpperCase() ?? null;
  const country = stringOrNull(record.countryName ?? record.country_name ?? record.country_name_en ?? record.country);
  const city = stringOrNull(record.city ?? record.cityName ?? record.regionName);
  const latitude = numberOrNull(record.latitude ?? record.lat);
  const longitude = numberOrNull(record.longitude ?? record.lon ?? record.lng);

  if (!countryCode && !country && !city && (latitude == null || longitude == null)) return null;

  return {
    countryCode,
    country,
    city,
    latitude,
    longitude,
  };
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 2000) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      signal: controller.signal,
    });

    // 204 (no resolvable public IP behind the proxy) and any empty body are
    // "ok" responses with no JSON — guard them so response.json() can't throw
    // "Unexpected end of JSON input" and crash the page.
    if (!response.ok || response.status === 204) return null;
    const text = await response.text();
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

async function lookupIpGeoWithoutGps(): Promise<DetectedIpGeoLocation | null> {
  if (typeof window === 'undefined') return null;

  // IP geolocation is done server-side via the same-origin route (which reads the
  // forwarded client IP and calls the geo provider). We must NOT call an external
  // geo API directly from the browser — it's always cross-origin (CORS-blocked) and
  // rate-limited (429), which spams the console and provides no value. If the
  // same-origin lookup yields nothing, fall back to the manual location picker.
  const sameOriginPayload = await fetchJsonWithTimeout('/api/location/client-ip-geo');
  return normalizeIpGeoPayload(sameOriginPayload);
}

export default function LocationPicker({ locale = 'fa-IR' }: Props) {
  const t = useTranslations('Home.location');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const localeForQueries = normalizeLocale(locale);

  const sourceLabels = useMemo<LocationSourceLabels>(
    () => ({
      chooseOrDetect: t('source.chooseOrDetect'),
      gps: t('source.gps'),
      profile: t('source.profile'),
      phone: t('source.phone'),
      ip: t('source.ip'),
      saved: t('source.saved'),
      picked: t('source.picked'),
      manual: t('source.manual'),
      url: t('source.url'),
      current: t('source.current'),
    }),
    [t]
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      countryId: null,
      cityId: null,
    },
  });

  const watchedCountryId = form.watch('countryId');
  const watchedCityId = form.watch('cityId');

  const initializedRef = useRef(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDetecting, setIsDetecting] = useState(false);
  const [locations, setLocations] = useState<HomePickedLocation[]>([]);
  const [hasLoadedLocations, setHasLoadedLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<HomeResolvedLocation>(INITIAL_LOCATION);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const locationTitleFallback = t('selectLocation');

  const applyLocation = useCallback(
    (location: HomeResolvedLocation, options: ApplyLocationOptions = {}) => {
      const navigation = options.navigation ?? 'push';
      const persist = options.persist ?? true;

      setSelectedLocation(location);
      setLocationMessage(null);

      form.setValue('countryId', location.countryId, { shouldDirty: false });
      form.setValue('cityId', location.cityId, { shouldDirty: false });

      if (persist && (location.countryCode || location.cityCode)) {
        persistLocation(location);
      }

      if (!navigation) return;

      const nextSearchParams = new URLSearchParams(searchParams.toString());

      if (location.countryCode) nextSearchParams.set('countryCode', location.countryCode);
      else nextSearchParams.delete('countryCode');

      if (location.cityCode) nextSearchParams.set('cityCode', location.cityCode);
      else nextSearchParams.delete('cityCode');

      const query = nextSearchParams.toString();
      const nextUrl = query ? `${pathname}?${query}` : pathname;
      const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

      if (nextUrl === currentUrl) return;

      if (navigation === 'replace') router.replace(nextUrl);
      else router.push(nextUrl);
    },
    [form, pathname, router, searchParams]
  );

  const detectFromAccountPhoneOrIp = useCallback(
    (navigation: NavigationMode = 'replace') => {
      setIsDetecting(true);
      setLocationMessage(t('messages.detectingAutomatic'));

      startTransition(async () => {
        try {
          const resolved = await getInitialHomeLocationAction({ locale: localeForQueries });

          if (resolved?.countryCode || resolved?.cityCode) {
            applyLocation(resolved, { navigation });
            setLocationMessage(
              t('messages.detectedFromSource', {
                source: getLocationSourceLabel(resolved, sourceLabels),
                location: getLocationTitle(resolved, locationTitleFallback),
              })
            );
            return;
          }

          const detectedIpLocation = await lookupIpGeoWithoutGps();

          if (detectedIpLocation) {
            const resolvedFromIp = await resolveHomeLocationFromDetectedIpAction({
              ...detectedIpLocation,
              locale: localeForQueries,
            });

            if (resolvedFromIp?.countryCode || resolvedFromIp?.cityCode) {
              applyLocation(resolvedFromIp, { navigation });
              setLocationMessage(
                t('messages.detectedFromSource', {
                  source: getLocationSourceLabel(resolvedFromIp, sourceLabels),
                  location: getLocationTitle(resolvedFromIp, locationTitleFallback),
                })
              );
              return;
            }
          }

          setLocationMessage(t('messages.autoDetectFailed'));
          setShowLocationPicker(true);
        } finally {
          setIsDetecting(false);
        }
      });
    },
    [applyLocation, localeForQueries, locationTitleFallback, sourceLabels, startTransition, t]
  );

  const requestBrowserLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationMessage(t('messages.browserUnsupported'));
      setShowLocationPicker(true);
      return;
    }

    setIsDetecting(true);
    setLocationMessage(t('messages.requestingPermission'));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        startTransition(async () => {
          try {
            const resolved = await resolveHomeLocationFromCoordinatesAction({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              locale: localeForQueries,
              source: 'gps',
            });

            if (resolved?.countryCode || resolved?.cityCode) {
              applyLocation(resolved, { navigation: 'replace' });
              setShowLocationPicker(false);
              setLocationMessage(
                t('messages.usingNearestDestination', {
                  location: getLocationTitle(resolved, locationTitleFallback),
                })
              );

              // Remember the real device location on the signed-in user's profile so
              // it persists across sessions and devices. No-op for guests.
              await saveCurrentLocationToProfileAction({
                countryId: resolved.countryId,
                cityId: resolved.cityId,
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              }).catch(() => null);

              return;
            }

            setLocationMessage(t('messages.noSupportedDestination'));
            setShowLocationPicker(true);
          } finally {
            setIsDetecting(false);
          }
        });
      },
      () => {
        setIsDetecting(false);
        setLocationMessage(t('messages.permissionDenied'));
        detectFromAccountPhoneOrIp('replace');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5 * 60 * 1000,
      }
    );
  }, [applyLocation, detectFromAccountPhoneOrIp, localeForQueries, locationTitleFallback, startTransition, t]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const countryCode = searchParams.get('countryCode');
    const cityCode = searchParams.get('cityCode');

    if (countryCode || cityCode) {
      startTransition(async () => {
        const resolved = await resolveHomeLocationFromCodesAction({
          countryCode,
          cityCode,
          locale: localeForQueries,
        });

        if (resolved) applyLocation(resolved, { navigation: false, persist: true });
      });
      return;
    }

    const stored = parseStoredLocation();
    if (stored?.countryCode || stored?.cityCode) {
      applyLocation(stored, { navigation: 'replace', persist: false });
      return;
    }

    detectFromAccountPhoneOrIp('replace');
  }, [applyLocation, detectFromAccountPhoneOrIp, localeForQueries, searchParams, startTransition]);

  useEffect(() => {
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
    applyLocation(toResolvedLocation(location), { navigation: 'push' });
    setShowLocationPicker(false);
  };

  const handleApplyManualSelection = () => {
    const values = form.getValues();
    if (!values.countryId && !values.cityId) {
      setLocationMessage(t('messages.selectCountryOrCity'));
      return;
    }

    setIsDetecting(true);
    setLocationMessage(t('messages.applyingSelected'));

    startTransition(async () => {
      try {
        const resolved = await resolveHomeLocationFromIdsAction({
          countryId: values.countryId,
          cityId: values.cityId,
          locale: localeForQueries,
        });

        if (resolved?.countryCode || resolved?.cityCode) {
          applyLocation(resolved, { navigation: 'push' });
          setShowLocationPicker(false);
          return;
        }

        setLocationMessage(t('messages.resolveFailed'));
      } finally {
        setIsDetecting(false);
      }
    });
  };

  const availableLocations = useMemo(() => locations.filter((item) => item.city && item.country), [locations]);
  const canApplyManualSelection = Boolean(watchedCountryId || watchedCityId);
  const isBusy = isPending || isDetecting;

  const modal =
    mounted && showLocationPicker
      ? createPortal(
          <div className="fixed inset-0 z-[9999] overflow-y-auto bg-slate-950/45 backdrop-blur-[3px]">
            <div className="flex min-h-screen items-start justify-center p-4 sm:p-6">
              <div className="mt-2 w-full max-w-3xl overflow-hidden rounded-[28px] border border-white/60 bg-white shadow-[0_25px_80px_rgba(0,0,0,0.25)]">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-[#083f30] via-[#0b4c3d] to-[#0f6b56] px-5 py-5 text-white sm:px-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">{t('modal.eyebrow')}</p>
                    <h3 className="mt-1 text-xl font-bold sm:text-2xl">{t('modal.title')}</h3>
                    <p className="mt-1 text-sm text-white/80">{t('modal.description')}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowLocationPicker(false)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
                    aria-label={t('modal.closeAria')}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-5 p-5 sm:p-6">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={requestBrowserLocation}
                      disabled={isBusy}
                      className="flex items-center gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-4 text-left transition hover:border-emerald-300 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-emerald-700 shadow-sm">
                        {isBusy ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-emerald-950">{t('currentLocation.title')}</div>
                        <p className="mt-0.5 text-xs leading-5 text-emerald-800/80">{t('currentLocation.description')}</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => detectFromAccountPhoneOrIp('replace')}
                      disabled={isBusy}
                      className="flex items-center gap-3 rounded-3xl border border-slate-200 bg-white p-4 text-left shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                        {isBusy ? <Loader2 className="animate-spin" size={20} /> : <Navigation size={20} />}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-950">{t('detectWithoutGps.title')}</div>
                        <p className="mt-0.5 text-xs leading-5 text-slate-500">{t('detectWithoutGps.description')}</p>
                      </div>
                    </button>
                  </div>

                  {locationMessage ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                      {locationMessage}
                    </div>
                  ) : null}

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4 shadow-sm">
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-slate-900">{t('manual.title')}</h4>
                      <p className="mt-1 text-xs text-slate-500">{t('manual.description')}</p>
                    </div>

                    <RHFCountryCitySelect
                      control={form.control}
                      countryName="countryId"
                      cityName="cityId"
                      locale={localeForQueries}
                      fallbackLocale="en-US"
                      countryLabel={t('manual.country')}
                      cityLabel={t('manual.city')}
                    />

                    <div className="mt-4 flex justify-end">
                      <button
                        type="button"
                        onClick={handleApplyManualSelection}
                        disabled={!canApplyManualSelection || isBusy}
                        className="rounded-2xl bg-[#083f30] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#0a513f] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBusy ? t('manual.applying') : t('manual.apply')}
                      </button>
                    </div>
                  </div>

                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-bold text-slate-900">{t('featuredDestinations.title')}</h4>
                      <p className="text-sm text-slate-500">{t('featuredDestinations.description')}</p>
                    </div>

                    <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {t('featuredDestinations.available', { count: availableLocations.length })}
                    </div>
                  </div>

                  {isPending && !hasLoadedLocations ? (
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
                      <h4 className="text-sm font-semibold text-slate-900">{t('featuredDestinations.emptyTitle')}</h4>
                      <p className="mt-1 text-sm text-slate-500">{t('featuredDestinations.emptyDescription')}</p>
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
      <div className="space-y-2">
        <button
          type="button"
          onClick={openLocationPicker}
          className="flex w-full items-center gap-3 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-left transition hover:border-[#083f30]/20 hover:bg-white hover:shadow-sm"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#083f30]/10 text-[#083f30]">
            <MapPin size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-gray-500">{t('currentDestination')}</p>
            <p className="truncate text-sm font-bold text-gray-900">{getLocationTitle(selectedLocation, locationTitleFallback)}</p>
            <p className="truncate text-[11px] font-medium text-gray-500">{getLocationSourceLabel(selectedLocation, sourceLabels)}</p>
          </div>
          {isBusy ? <Loader2 size={18} className="animate-spin text-gray-400" /> : <ChevronRight size={18} className="text-gray-400" />}
        </button>

        {selectedLocation.id === INITIAL_LOCATION.id ? (
          <button
            type="button"
            onClick={requestBrowserLocation}
            disabled={isBusy}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-2 text-xs font-semibold text-emerald-800 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
            {t('useMyCurrentLocation')}
          </button>
        ) : null}
      </div>

      {modal}
    </>
  );
}

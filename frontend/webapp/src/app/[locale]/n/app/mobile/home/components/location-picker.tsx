'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronRight, Loader2, LocateFixed, MapPin, X } from 'lucide-react';
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
import { hasExplicitLocaleChoice, localeForCountry } from '@/i18n/locale-by-country';

const formSchema = z.object({
  countryId: z.string().uuid().nullable().optional(),
  provinceId: z.string().uuid().nullable().optional(),
  cityId: z.string().uuid().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

type NavigationMode = 'push' | 'replace' | false;

type ApplyLocationOptions = {
  navigation?: NavigationMode;
  persist?: boolean;
  // When true, switch the app language to the detected country's language (if we
  // have a full translation for it, else English) — unless the visitor already
  // picked a language explicitly. Only the "where am I" detection flows set this.
  adoptLocale?: boolean;
  // Overrides which country drives the language decision. The resolved location's
  // countryCode is the nearest *destination* (a provider's country), which for a
  // far-away visitor isn't their real country — so the IP flow passes the true
  // country from IP geo here while still showing nearby providers for the location.
  localeCountryCode?: string | null;
};

// Language may only be adopted from signals that describe where the VISITOR is,
// never from a destination they (or a past session) chose. getInitialHomeLocationAction
// cascades through saved preferences and picked destinations too, and those carry a
// country that says nothing about the language the visitor reads.
const LOCALE_ADOPTING_SOURCES = new Set(['gps', 'ip', 'phone', 'profile']);

// A resolved destination further away than this is a "nearest supported destination"
// fallback, not the visitor's own country — so it must not drive the UI language.
const LOCALE_ADOPTION_MAX_KM = 150;

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
// Neutral placeholder shown before detection resolves. It deliberately carries NO
// city/country so the picker reads "select location" (via getLocationTitle's
// fallback) instead of flashing a hardcoded "Dubai, UAE" that then jumps to the
// visitor's real location — which looked like a detection bug.
const INITIAL_LOCATION: HomeResolvedLocation = {
  id: 'initial-unset',
  city: null,
  country: null,
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

function hasUsableCoordinates(value: Partial<HomeResolvedLocation>): boolean {
  return (
    typeof value.latitude === 'number' &&
    Number.isFinite(value.latitude) &&
    typeof value.longitude === 'number' &&
    Number.isFinite(value.longitude)
  );
}

function isPersistableLocation(value: unknown): value is HomeResolvedLocation {
  if (!value || typeof value !== 'object') return false;
  const record = value as Partial<HomeResolvedLocation>;
  return Boolean(
    record.id &&
      (record.countryCode || record.cityCode || record.country || record.city || hasUsableCoordinates(record))
  );
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

// Remembers that we already asked this browser for its location once. After the
// first attempt we never auto-detect or auto-open the picker again on return
// visits — the visitor can still open it manually from the location button.
const ASKED_KEY = 'lsevin.home.location-asked.v1';

function hasAskedForLocation() {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(ASKED_KEY) === '1';
  } catch {
    return false;
  }
}

function markLocationAsked() {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(ASKED_KEY, '1');
  } catch {
    // Best-effort; if storage is blocked the picker still works, just less sticky.
  }
}

// A coordinate-only location used when GPS succeeds but the visitor isn't near
// any supported destination — we still keep their real position so providers
// sort by distance and the map can pin them.
function makeCoordinateLocation(latitude: number, longitude: number): HomeResolvedLocation {
  return {
    ...INITIAL_LOCATION,
    id: 'gps-coordinates',
    city: null,
    country: null,
    image: null,
    cityId: null,
    countryId: null,
    cityCode: null,
    countryCode: null,
    latitude,
    longitude,
    source: 'gps',
  };
}

// Whether a featured-destination card points at the same place as the currently
// selected location. Ids are useless here — cards carry a category.picked_locations
// id while resolved locations carry a category.locations id — so compare the city
// the two rows resolve to, falling back to the city/country codes.
function isSameDestination(selected: HomeResolvedLocation, candidate: HomePickedLocation) {
  if (selected.id === candidate.id) return true;
  if (selected.cityId && candidate.cityId && selected.cityId === candidate.cityId) return true;

  const selectedCity = selected.cityCode?.toUpperCase();
  const candidateCity = candidate.cityCode?.toUpperCase();
  if (!selectedCity || !candidateCity || selectedCity !== candidateCity) return false;

  const selectedCountry = selected.countryCode?.toUpperCase();
  const candidateCountry = candidate.countryCode?.toUpperCase();
  // Same city code under different countries is a coincidence, not a match.
  if (selectedCountry && candidateCountry) return selectedCountry === candidateCountry;

  return true;
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

// CORS-enabled, key-less geo provider for the browser fallback below. geojs.io
// sends `Access-Control-Allow-Origin: *` AND does not block browser-origin
// requests, unlike ipwho.is / ipapi.co (which return 403 / CORS errors from a
// page). The leading slash-less https URL is reached cross-origin by the browser.
const BROWSER_IP_GEO_URL = 'https://get.geojs.io/v1/ip/geo.json';

// The same-origin route gives its own upstream provider 2500ms before giving up, so
// aborting at the 2000ms default threw away answers the server was about to return.
const SAME_ORIGIN_IP_GEO_TIMEOUT_MS = 3200;

async function lookupIpGeoWithoutGps(): Promise<DetectedIpGeoLocation | null> {
  if (typeof window === 'undefined') return null;

  // 1) Same-origin server route first — works when the host forwards the real
  //    client IP (X-Forwarded-For). Behind a proxy that strips it, this 204s.
  const sameOrigin = normalizeIpGeoPayload(
    await fetchJsonWithTimeout('/api/location/client-ip-geo', SAME_ORIGIN_IP_GEO_TIMEOUT_MS)
  );
  if (sameOrigin) return sameOrigin;

  // 2) Browser fallback: call the geo provider directly. The visitor's browser
  //    always reaches it with its own public IP, so this works even when the
  //    server never sees the real client IP (the cause of the 204 above).
  return normalizeIpGeoPayload(await fetchJsonWithTimeout(BROWSER_IP_GEO_URL, 3500));
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
      provinceId: null,
      cityId: null,
    },
  });

  const watchedCountryId = form.watch('countryId');
  const watchedProvinceId = form.watch('provinceId');
  const watchedCityId = form.watch('cityId');

  const initializedRef = useRef(false);
  // Guards every state write that can arrive from an async callback (geolocation
  // fires up to 15s after the click, and the component may be gone by then).
  const isMountedRef = useRef(true);
  const locationsRequestedRef = useRef(false);
  const geolocationWatchdogRef = useRef<number | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  // 'permission' asks before the browser does; 'choose' is the full picker.
  const [pickerStep, setPickerStep] = useState<'permission' | 'choose'>('permission');
  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isDetecting, setIsDetecting] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);
  const [locations, setLocations] = useState<HomePickedLocation[]>([]);
  const [hasLoadedLocations, setHasLoadedLocations] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<HomeResolvedLocation>(INITIAL_LOCATION);
  const [locationMessage, setLocationMessage] = useState<string | null>(null);

  const locationTitleFallback = t('selectLocation');

  const applyLocation = useCallback(
    (location: HomeResolvedLocation, options: ApplyLocationOptions = {}) => {
      const navigation = options.navigation ?? 'push';
      const persist = options.persist ?? true;
      const adoptLocale = options.adoptLocale ?? false;

      if (!isMountedRef.current) return;

      setSelectedLocation(location);
      setLocationMessage(null);

      form.setValue('countryId', location.countryId, { shouldDirty: false });
      // The resolver returns country + city only; the province select re-derives
      // itself from the city, so clear a stale one rather than leaving a province
      // from a previous country attached to the new selection.
      form.setValue('provinceId', null, { shouldDirty: false });
      form.setValue('cityId', location.cityId, { shouldDirty: false });

      const hasCoordinates = location.latitude != null && location.longitude != null;

      if (persist && (location.countryCode || location.cityCode || hasCoordinates)) {
        persistLocation(location);
        // A real location is on file — never auto-nag for it again.
        markLocationAsked();
      }

      if (!navigation) return;

      const nextSearchParams = new URLSearchParams(searchParams.toString());

      if (location.countryCode) nextSearchParams.set('countryCode', location.countryCode);
      else nextSearchParams.delete('countryCode');

      if (location.cityCode) nextSearchParams.set('cityCode', location.cityCode);
      else nextSearchParams.delete('cityCode');

      // Carry the visitor's real coordinates so server-side home queries can sort
      // providers nearest-first and the map can pin them.
      if (hasCoordinates) {
        nextSearchParams.set('lat', String(location.latitude));
        nextSearchParams.set('lng', String(location.longitude));
      } else {
        nextSearchParams.delete('lat');
        nextSearchParams.delete('lng');
      }

      const query = nextSearchParams.toString();

      // Adopt the visitor's language from their detected country (using a full
      // translation where we have one, otherwise English) — but never override an
      // explicit language choice. Switches the /[locale] segment + NEXT_LOCALE
      // cookie and carries the location params across in a single navigation.
      const localeCountryCode = options.localeCountryCode ?? location.countryCode;
      if (adoptLocale && localeCountryCode && !hasExplicitLocaleChoice()) {
        const segments = pathname.split('/');
        const currentUrlLocale = segments[1] || '';
        const targetLocale = localeForCountry(localeCountryCode);

        if (targetLocale && targetLocale !== currentUrlLocale) {
          const restPath = segments.slice(2).join('/');
          const localizedPath = restPath ? `/${targetLocale}/${restPath}` : `/${targetLocale}`;
          const localizedUrl = query ? `${localizedPath}?${query}` : localizedPath;

          try {
            document.cookie = `NEXT_LOCALE=${targetLocale};path=/;max-age=31536000;samesite=lax`;
          } catch {
            // Cookie blocked — the locale still switches for this navigation.
          }

          // Hard navigation: a language change must reload the message bundle and
          // flip text direction, and this runs inside an async geolocation/transition
          // callback where the soft router can no-op. window.location is reliable.
          if (typeof window !== 'undefined') {
            window.location.assign(localizedUrl);
            return;
          }
          router.replace(localizedUrl);
          return;
        }
      }

      const nextUrl = query ? `${pathname}?${query}` : pathname;
      const currentUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

      if (nextUrl === currentUrl) return;

      if (navigation === 'replace') router.replace(nextUrl);
      else router.push(nextUrl);
    },
    [form, pathname, router, searchParams]
  );

  const detectFromAccountPhoneOrIp = useCallback(
    (navigation: NavigationMode = 'replace', pendingMessage?: string) => {
      setIsDetecting(true);
      setLocationMessage(pendingMessage ?? t('messages.detectingAutomatic'));

      startTransition(async () => {
        try {
          const resolved = await getInitialHomeLocationAction({ locale: localeForQueries });

          if (resolved?.countryCode || resolved?.cityCode) {
            applyLocation(resolved, {
              navigation,
              // Only a source that describes where the visitor actually is may switch
              // the language — a 'saved'/'picked' destination must not.
              adoptLocale: LOCALE_ADOPTING_SOURCES.has(resolved.source),
            });
            if (!isMountedRef.current) return;
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
              // Keep the IP-detected coordinates (approximate, city-level) so home
              // can sort providers by distance and the map can center on the visitor.
              const withCoords =
                detectedIpLocation.latitude != null && detectedIpLocation.longitude != null
                  ? {
                      ...resolvedFromIp,
                      latitude: detectedIpLocation.latitude,
                      longitude: detectedIpLocation.longitude,
                    }
                  : resolvedFromIp;
              applyLocation(withCoords, {
                navigation,
                adoptLocale: true,
                // Language follows the visitor's REAL country (from IP geo), not the
                // nearest provider's country that `resolvedFromIp` may carry.
                localeCountryCode: detectedIpLocation.countryCode,
              });
              if (!isMountedRef.current) return;
              setLocationMessage(
                t('messages.detectedFromSource', {
                  source: getLocationSourceLabel(resolvedFromIp, sourceLabels),
                  location: getLocationTitle(resolvedFromIp, locationTitleFallback),
                })
              );
              return;
            }
          }

          if (!isMountedRef.current) return;
          setLocationMessage(t('messages.autoDetectFailed'));
          setPickerStep("choose");
          setShowLocationPicker(true);
        } catch {
          // A rejected server action inside startTransition is re-thrown to the
          // nearest error boundary on React 19, which would tear down the whole home
          // view over a failed location lookup. Degrade to the manual picker instead.
          if (!isMountedRef.current) return;
          setLocationMessage(t('messages.autoDetectFailed'));
          setPickerStep("choose");
          setShowLocationPicker(true);
        } finally {
          if (isMountedRef.current) setIsDetecting(false);
        }
      });
    },
    [applyLocation, localeForQueries, locationTitleFallback, sourceLabels, startTransition, t]
  );

  const requestBrowserLocation = useCallback(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setLocationMessage(t('messages.browserUnsupported'));
      setPickerStep("choose");
      setShowLocationPicker(true);
      return;
    }

    setIsDetecting(true);
    setLocationMessage(t('messages.requestingPermission'));
    // Any GPS attempt counts as "asked" so we don't auto-prompt again next time.
    markLocationAsked();

    // The `timeout` option below does not cover the time the permission prompt sits
    // unanswered, so neither callback ever fires if the visitor ignores it — which
    // used to leave every control in the picker spinning and disabled forever.
    if (geolocationWatchdogRef.current != null) window.clearTimeout(geolocationWatchdogRef.current);
    geolocationWatchdogRef.current = window.setTimeout(() => {
      geolocationWatchdogRef.current = null;
      if (!isMountedRef.current) return;
      setIsDetecting(false);
      setLocationMessage(t('messages.locationTimedOut'));
      setPickerStep("choose");
      setShowLocationPicker(true);
    }, 30000);

    const clearGeolocationWatchdog = () => {
      if (geolocationWatchdogRef.current == null) return false;
      window.clearTimeout(geolocationWatchdogRef.current);
      geolocationWatchdogRef.current = null;
      return true;
    };

    navigator.geolocation.getCurrentPosition(
      (position) => {
        // The watchdog already gave up and told the visitor so — don't yank the UI
        // out from under them with a late fix.
        if (!clearGeolocationWatchdog() || !isMountedRef.current) return;

        const userLatitude = position.coords.latitude;
        const userLongitude = position.coords.longitude;
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.info('[geo] home.gps.success', {
            lat: userLatitude,
            lng: userLongitude,
            accuracyM: Math.round(position.coords.accuracy),
          });
        }

        startTransition(async () => {
          try {
            const resolved = await resolveHomeLocationFromCoordinatesAction({
              latitude: userLatitude,
              longitude: userLongitude,
              locale: localeForQueries,
              source: 'gps',
            });

            if (resolved?.countryCode || resolved?.cityCode) {
              // Remember the real device location on the signed-in user's profile so
              // it persists across sessions and devices. No-op for guests. Fire-and-forget
              // on purpose: the location is already applied and the UI must not keep the
              // detection spinner (isBusy) alive waiting on this best-effort profile write,
              // which would hang if the API stalls. Issued BEFORE applyLocation because a
              // locale switch there navigates with window.location.assign, and a request
              // started after that races the document unload and is usually dropped.
              void saveCurrentLocationToProfileAction({
                countryId: resolved.countryId,
                cityId: resolved.cityId,
                latitude: userLatitude,
                longitude: userLongitude,
              }).catch(() => null);

              // The resolver answers with the NEAREST supported destination, which for a
              // visitor far from any provider can be a different country entirely. Adopt
              // its language only when that destination is genuinely near them.
              const destinationDistanceKm = resolved.accuracyKm;
              const isNearbyDestination =
                typeof destinationDistanceKm === 'number' &&
                Number.isFinite(destinationDistanceKm) &&
                destinationDistanceKm <= LOCALE_ADOPTION_MAX_KM;

              // Keep the visitor's REAL coordinates (not the matched city centroid)
              // so home + map reflect what's actually closest to them.
              applyLocation(
                { ...resolved, latitude: userLatitude, longitude: userLongitude },
                { navigation: 'replace', adoptLocale: isNearbyDestination }
              );

              if (!isMountedRef.current) return;
              setShowLocationPicker(false);
              setLocationMessage(
                t('messages.usingNearestDestination', {
                  location: getLocationTitle(resolved, locationTitleFallback),
                })
              );

              return;
            }

            // No supported destination matched, but we still have the visitor's
            // position — remember it so providers sort by distance and the map can
            // pin them. Don't keep the picker open.
            applyLocation(makeCoordinateLocation(userLatitude, userLongitude), { navigation: 'replace' });
            if (!isMountedRef.current) return;
            setShowLocationPicker(false);
            setLocationMessage(null);
          } catch {
            if (!isMountedRef.current) return;
            setLocationMessage(t('messages.loadFailed'));
            setPickerStep("choose");
            setShowLocationPicker(true);
          } finally {
            if (isMountedRef.current) setIsDetecting(false);
          }
        });
      },
      (error) => {
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.info('[geo] home.gps.error', { code: error.code, message: error.message });
        }
        if (!clearGeolocationWatchdog() || !isMountedRef.current) return;
        setIsDetecting(false);

        // All three failures used to report "permission denied", and the message was
        // then overwritten in the same batch by the fallback's own "detecting…" text,
        // so the visitor never learned why GPS failed. Carry the real reason into the
        // fallback instead of setting a message that is immediately replaced.
        const reason =
          error.code === error.PERMISSION_DENIED
            ? t('messages.permissionDenied')
            : error.code === error.TIMEOUT
              ? t('messages.locationTimedOut')
              : t('messages.locationUnavailable');

        detectFromAccountPhoneOrIp('replace', reason);
      },
      {
        // Ask for the GPS chip, never accept a stale cached fix, and give the
        // first lock enough time. maximumAge:0 was previously 5 min, which could
        // hand back an old position from a different place.
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  }, [applyLocation, detectFromAccountPhoneOrIp, localeForQueries, locationTitleFallback, startTransition, t]);

  useEffect(() => {
    isMountedRef.current = true;
    setMounted(true);

    return () => {
      isMountedRef.current = false;
      if (geolocationWatchdogRef.current != null) {
        window.clearTimeout(geolocationWatchdogRef.current);
        geolocationWatchdogRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const countryCode = searchParams.get('countryCode');
    const cityCode = searchParams.get('cityCode');
    const latParam = numberOrNull(searchParams.get('lat'));
    const lngParam = numberOrNull(searchParams.get('lng'));
    const hasCoordParams = latParam != null && lngParam != null;

    if (countryCode || cityCode) {
      startTransition(async () => {
        try {
          const resolved = await resolveHomeLocationFromCodesAction({
            countryCode,
            cityCode,
            locale: localeForQueries,
          });

          if (resolved) {
            const withCoords = hasCoordParams
              ? { ...resolved, latitude: latParam, longitude: lngParam }
              : resolved;
            applyLocation(withCoords, { navigation: false, persist: true });
            return;
          }

          // A stale or mistyped deep link (a destination that no longer exists).
          // Previously this branch did nothing at all: the bad params stayed in the
          // URL, no detection ran, and the picker showed no location and no reason.
          if (!isMountedRef.current) return;
          setLocationMessage(t('messages.linkLocationNotFound'));
          detectFromAccountPhoneOrIp('replace', t('messages.linkLocationNotFound'));
        } catch {
          if (!isMountedRef.current) return;
          setLocationMessage(t('messages.loadFailed'));
        }
      });
      return;
    }

    if (hasCoordParams && latParam != null && lngParam != null) {
      // URL carries raw coordinates (our own GPS replace, or a shared deep link).
      startTransition(async () => {
        try {
          const resolved = await resolveHomeLocationFromCoordinatesAction({
            latitude: latParam,
            longitude: lngParam,
            locale: localeForQueries,
            source: 'gps',
          });

          const base =
            resolved?.countryCode || resolved?.cityCode
              ? { ...resolved, latitude: latParam, longitude: lngParam }
              : makeCoordinateLocation(latParam, lngParam);

          applyLocation(base, { navigation: false, persist: true });
        } catch {
          // Still honour the coordinates the link carried, so home can sort by distance.
          applyLocation(makeCoordinateLocation(latParam, lngParam), {
            navigation: false,
            persist: true,
          });
        }
      });
      return;
    }

    const stored = parseStoredLocation();
    if (stored && (stored.countryCode || stored.cityCode || hasUsableCoordinates(stored))) {
      applyLocation(stored, { navigation: 'replace', persist: false });
      return;
    }

    // Nothing on file anywhere. Auto-detect (and maybe open the picker) exactly
    // once per browser; after that we never nag again on return visits.
    if (hasAskedForLocation()) return;
    markLocationAsked();
    detectFromAccountPhoneOrIp('replace');
    // Runs once per mount (guarded by initializedRef); `t` is included because the
    // unresolvable-deep-link branch above renders a message.
  }, [applyLocation, detectFromAccountPhoneOrIp, localeForQueries, searchParams, startTransition, t]);

  useEffect(() => {
    if (!showLocationPicker) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showLocationPicker]);

  // Deliberately outside the shared `startTransition`: this query used to raise the
  // global `isPending`, which disabled and spun both detection buttons while the
  // destination list loaded. The ref makes it race-safe (reopening the picker mid-flight
  // no longer fires a second query), and the catch lets a failed load retry on the next
  // open instead of pinning an empty list forever.
  const loadLocations = useCallback(() => {
    if (locationsRequestedRef.current) return;
    locationsRequestedRef.current = true;
    setIsLoadingLocations(true);

    void (async () => {
      try {
        const rows = await getPickedLocations();
        if (!isMountedRef.current) return;
        setLocations(rows);
        setHasLoadedLocations(true);
      } catch {
        locationsRequestedRef.current = false;
      } finally {
        if (isMountedRef.current) setIsLoadingLocations(false);
      }
    })();
  }, []);

  // Driven by the open state rather than the click handler, because the picker also
  // opens on its own (auto-detect failed, or the browser has no geolocation) — those
  // paths never loaded the list, so the grid stayed empty for the whole session.
  useEffect(() => {
    if (!showLocationPicker) return;
    loadLocations();
  }, [showLocationPicker, loadLocations]);

  const openLocationPicker = () => {
    // A message about a detection that already finished (often while the modal was
    // closed) otherwise greets the visitor as a stale amber warning on the next open.
    setLocationMessage(null);
    // Tapping the pill when a destination is already set means "change it", so skip
    // the permission pitch and go straight to the choices.
    setPickerStep(selectedLocation.id === INITIAL_LOCATION.id ? 'permission' : 'choose');
    setShowLocationPicker(true);
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
          if (!isMountedRef.current) return;
          setShowLocationPicker(false);
          return;
        }

        if (!isMountedRef.current) return;
        setLocationMessage(t('messages.resolveFailed'));
      } catch {
        if (!isMountedRef.current) return;
        setLocationMessage(t('messages.resolveFailed'));
      } finally {
        if (isMountedRef.current) setIsDetecting(false);
      }
    });
  };

  const availableLocations = useMemo(() => locations.filter((item) => item.city && item.country), [locations]);
  const canApplyManualSelection = Boolean(watchedCountryId || watchedProvinceId || watchedCityId);
  const isBusy = isPending || isDetecting;

  // The permission step mirrors the native prompt-before-the-prompt pattern: explain
  // why the app wants the location, then hand off to the browser. It is the sheet's
  // first screen only while nothing is on file — once a destination is known, opening
  // the picker means "change it", so the sheet goes straight to the choices.
  const permissionStep = (
    <div className="px-5 pb-6">
      <div className="mx-auto mb-5 flex h-36 w-full max-w-xs items-center justify-center">
        <LocationPermissionArt />
      </div>

      <p className="whitespace-pre-line text-center text-sm leading-6 text-gray-500">
        {t('currentLocation.description')}
      </p>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => setPickerStep('choose')}
          disabled={isBusy}
          className="h-12 flex-1 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {t('permission.dismiss')}
        </button>
        <button
          type="button"
          onClick={requestBrowserLocation}
          disabled={isBusy}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-xl bg-[#083f30] text-sm font-bold text-white transition hover:bg-[#0a513f] disabled:opacity-50"
        >
          {isBusy ? <Loader2 className="animate-spin" size={18} /> : null}
          {t('permission.enable')}
        </button>
      </div>
    </div>
  );

  const chooseStep = (
    <div className="space-y-4 px-5 pb-6">
      <button
        type="button"
        onClick={requestBrowserLocation}
        disabled={isBusy}
        className="flex w-full items-center gap-3 rounded-2xl border border-emerald-100 bg-emerald-50/70 p-4 text-start transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-[#083f30] shadow-sm">
          {isBusy ? <Loader2 className="animate-spin" size={20} /> : <LocateFixed size={20} />}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-bold text-emerald-950">{t('currentLocation.title')}</div>
          <p className="mt-0.5 text-xs leading-5 text-emerald-800/70">{t('currentLocation.description')}</p>
        </div>
      </button>

      {locationMessage ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {locationMessage}
        </div>
      ) : null}

                  <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">
                    <div className="mb-3">
                      <h4 className="text-sm font-semibold text-slate-900">{t('manual.title')}</h4>
                      <p className="mt-1 text-xs text-slate-500">{t('manual.description')}</p>
                    </div>

                    <RHFCountryCitySelect
                      control={form.control}
                      countryName="countryId"
                      provinceName="provinceId"
                      cityName="cityId"
                      showProvince
                      locale={localeForQueries}
                      fallbackLocale="en-US"
                      countryLabel={t('manual.country')}
                      provinceLabel={t('manual.province')}
                      cityLabel={t('manual.city')}
                    />

                    <button
                      type="button"
                      onClick={handleApplyManualSelection}
                      disabled={!canApplyManualSelection || isBusy}
                      className="mt-4 h-12 w-full rounded-xl bg-[#083f30] text-sm font-bold text-white transition hover:bg-[#0a513f] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isBusy ? t('manual.applying') : t('manual.apply')}
                    </button>
                  </div>

                  {isLoadingLocations && !hasLoadedLocations ? (
                    <div className="grid grid-cols-2 gap-3">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="overflow-hidden rounded-2xl border border-gray-100 bg-white p-3">
                          <div className="mb-3 aspect-[4/3] animate-pulse rounded-xl bg-gray-200" />
                          <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-100" />
                        </div>
                      ))}
                    </div>
                  ) : availableLocations.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {availableLocations.map((location) => {
                        // Card ids come from category.picked_locations, while a detected
                        // location's id comes from category.locations — the two uuid spaces
                        // never intersect, so comparing ids alone never highlighted a
                        // detected destination. Match on the underlying city instead.
                        const isSelected = isSameDestination(selectedLocation, location);
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
                  ) : null}
    </div>
  );

  const showPermissionStep = pickerStep === 'permission';

  const sheet =
    mounted && showLocationPicker
      ? createPortal(
          <div className="fixed inset-0 z-[9999]">
            <button
              type="button"
              aria-label={t('modal.closeAria')}
              onClick={() => setShowLocationPicker(false)}
              className="sheet-scrim absolute inset-0 h-full w-full cursor-default bg-slate-950/40 backdrop-blur-[2px]"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="location-sheet-title"
              className="sheet-panel absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col overflow-hidden rounded-t-[20px] bg-white shadow-[0_-4px_12px_rgba(0,0,0,0.06)]"
            >
              {/* Grab handle — the affordance that says "this came up from the bottom
                  and goes back down", even though dismissal is by tap. */}
              <div className="flex justify-center pt-2.5">
                <span className="h-1 w-9 rounded-full bg-gray-200" />
              </div>

              <div className="flex items-start justify-between gap-3 px-5 pb-3 pt-3">
                <h2 id="location-sheet-title" className="text-base font-bold text-gray-900">
                  {showPermissionStep ? t('permission.title') : t('modal.title')}
                </h2>

                <button
                  type="button"
                  onClick={() => setShowLocationPicker(false)}
                  className="-me-1 -mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  aria-label={t('modal.closeAria')}
                >
                  <X size={20} />
                </button>
              </div>

              <div className="hide-scrollbar min-h-0 flex-1 overflow-y-auto">
                {showPermissionStep ? permissionStep : chooseStep}
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      {/* Frosted pill on the pine canopy. One line, tap to change — the destination
          is context for everything below it, not a form field. */}
      <button
        type="button"
        onClick={openLocationPicker}
        className="flex w-full items-center gap-3 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-start backdrop-blur-sm transition hover:bg-white/15"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#eacb7f]/20 text-[#eacb7f]">
          <MapPin size={18} />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-medium text-white/60">{t('currentDestination')}</span>
          <span className="block truncate text-sm font-bold text-white">
            {getLocationTitle(selectedLocation, locationTitleFallback)}
          </span>
        </span>

        {isBusy ? (
          <Loader2 size={18} className="shrink-0 animate-spin text-white/60" />
        ) : (
          // styles/rtl.css already flips every chevron with scaleX(-1); adding a
          // rotate here flipped it a second time and pointed it back into the row.
          <ChevronRight size={18} className="shrink-0 text-white/50" />
        )}
      </button>

      {sheet}
    </>
  );
}

/**
 * Inline illustration for the permission step. Drawn rather than fetched so the
 * sheet has nothing to wait on and nothing to 404 — it appears the instant the
 * sheet does.
 */
function LocationPermissionArt() {
  return (
    <svg viewBox="0 0 200 140" fill="none" className="h-full w-auto" aria-hidden="true">
      <ellipse cx="100" cy="120" rx="58" ry="9" fill="#083f30" opacity="0.08" />
      <circle cx="100" cy="62" r="52" fill="#083f30" opacity="0.06" />
      <circle cx="100" cy="62" r="36" fill="#083f30" opacity="0.08" />
      <path
        d="M100 22c-15.5 0-28 12.5-28 28 0 20 22.6 38.3 26.6 41.4a2.2 2.2 0 0 0 2.8 0C105.4 88.3 128 70 128 50c0-15.5-12.5-28-28-28Z"
        fill="#083f30"
      />
      <circle cx="100" cy="49" r="11" fill="#eacb7f" />
      <path d="M100 4v9M100 111v9M42 62h9M149 62h9" stroke="#083f30" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
    </svg>
  );
}

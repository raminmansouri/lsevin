'use server';

import { z } from 'zod';

import {
  getActiveLocation,
  resolveActiveLocationFromCodes,
  resolveActiveLocationFromCoordinates,
  resolveActiveLocationFromIds,
  resolveActiveLocationFromText,
  type ActiveLocation,
  type ActiveLocationSource,
} from '@/features/locations/server';

export type HomeResolvedLocation = ActiveLocation;

const localeSchema = z.string().trim().min(1).optional().nullable();

const initialLocationSchema = z.object({
  locale: localeSchema,
});

const codesSchema = z.object({
  countryCode: z.string().trim().min(1).nullable().optional(),
  cityCode: z.string().trim().min(1).nullable().optional(),
  locale: localeSchema,
});

const idsSchema = z.object({
  countryId: z.string().uuid().nullable().optional(),
  cityId: z.string().uuid().nullable().optional(),
  locale: localeSchema,
});

const coordinatesSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  locale: localeSchema,
  source: z.enum(['gps', 'profile', 'manual', 'picked', 'phone', 'ip', 'saved', 'url']).optional(),
});

const detectedIpSchema = z.object({
  countryCode: z.string().trim().min(1).max(10).nullable().optional(),
  country: z.string().trim().min(1).max(120).nullable().optional(),
  city: z.string().trim().min(1).max(120).nullable().optional(),
  latitude: z.coerce.number().min(-90).max(90).nullable().optional(),
  longitude: z.coerce.number().min(-180).max(180).nullable().optional(),
  locale: localeSchema,
});

function toHomeResolvedLocation(location: ActiveLocation | null): HomeResolvedLocation | null {
  if (!location) return null;

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
    source: location.source,
    accuracyKm: location.accuracyKm ?? null,
  };
}

export async function getInitialHomeLocationAction(rawInput: z.input<typeof initialLocationSchema> = {}) {
  const input = initialLocationSchema.parse(rawInput);

  const location = await getActiveLocation({
    locale: input.locale,
    includeProfile: true,
    includeIp: true,
  });

  return toHomeResolvedLocation(location);
}

export async function resolveHomeLocationFromCodesAction(rawInput: z.input<typeof codesSchema>) {
  const input = codesSchema.parse(rawInput);

  const location = await resolveActiveLocationFromCodes({
    countryCode: input.countryCode,
    cityCode: input.cityCode,
    locale: input.locale,
  });

  return toHomeResolvedLocation(location);
}

export async function resolveHomeLocationFromIdsAction(rawInput: z.input<typeof idsSchema>) {
  const input = idsSchema.parse(rawInput);

  const location = await resolveActiveLocationFromIds({
    countryId: input.countryId,
    cityId: input.cityId,
    locale: input.locale,
  });

  return toHomeResolvedLocation(location);
}

export async function resolveHomeLocationFromCoordinatesAction(rawInput: z.input<typeof coordinatesSchema>) {
  const input = coordinatesSchema.parse(rawInput);

  const location = await resolveActiveLocationFromCoordinates({
    latitude: input.latitude,
    longitude: input.longitude,
    locale: input.locale,
    source: (input.source ?? 'gps') as ActiveLocationSource,
  });

  return toHomeResolvedLocation(location);
}


export async function resolveHomeLocationFromDetectedIpAction(rawInput: z.input<typeof detectedIpSchema>) {
  const input = detectedIpSchema.parse(rawInput);

  if (input.latitude != null && input.longitude != null) {
    const byCoordinates = await resolveActiveLocationFromCoordinates({
      latitude: input.latitude,
      longitude: input.longitude,
      locale: input.locale,
      source: 'ip',
    }).catch(() => null);

    if (byCoordinates?.countryCode || byCoordinates?.cityCode) {
      return toHomeResolvedLocation(byCoordinates);
    }
  }

  const byText = await resolveActiveLocationFromText({
    country: input.countryCode ?? input.country,
    city: input.city,
    locale: input.locale,
    source: 'ip',
  }).catch(() => null);

  if (byText?.countryCode || byText?.cityCode) {
    return toHomeResolvedLocation(byText);
  }

  if (input.countryCode) {
    const byCountry = await resolveActiveLocationFromCodes({
      countryCode: input.countryCode,
      locale: input.locale,
    }).catch(() => null);

    return toHomeResolvedLocation(byCountry);
  }

  return null;
}

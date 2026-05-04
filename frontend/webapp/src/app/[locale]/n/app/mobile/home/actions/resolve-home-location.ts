'use server';

import {
  getActiveLocation,
  resolveActiveLocationFromCodes,
  resolveActiveLocationFromCoordinates,
  resolveActiveLocationFromIds,
  type ActiveLocation,
  type ActiveLocationSource,
} from '@/features/locations/server/active-location';

export type HomeLocationSource = ActiveLocationSource;
export type HomeResolvedLocation = ActiveLocation;

export async function resolveHomeLocationFromCodesAction(input: {
  countryCode?: string | null;
  cityCode?: string | null;
  locale?: string | null;
}): Promise<HomeResolvedLocation | null> {
  return resolveActiveLocationFromCodes(input);
}

export async function resolveHomeLocationFromIdsAction(input: {
  countryId?: string | null;
  cityId?: string | null;
  locale?: string | null;
}): Promise<HomeResolvedLocation | null> {
  return resolveActiveLocationFromIds(input);
}

export async function resolveHomeLocationFromCoordinatesAction(input: {
  latitude: number;
  longitude: number;
  locale?: string | null;
  source?: HomeLocationSource;
}): Promise<HomeResolvedLocation | null> {
  return resolveActiveLocationFromCoordinates(input);
}

export async function getInitialHomeLocationAction(input?: {
  locale?: string | null;
}): Promise<HomeResolvedLocation | null> {
  return getActiveLocation({
    locale: input?.locale,
    includeProfile: true,
    includeIp: true,
  });
}

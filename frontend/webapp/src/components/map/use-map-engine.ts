"use client";

// Loads whichever map SDK the chosen provider needs and returns a single,
// mapbox-gl-compatible namespace. Both hooks are always called (React rules of
// hooks) but only the active one is enabled, so the inactive SDK is never fetched.

import type { MapProvider } from "./map-provider";
import { useMapboxSdk } from "./use-mapbox-sdk";
import { useNeshanSdk } from "./use-neshan-sdk";

export interface MapEngine {
  sdk: any;
  isLoaded: boolean;
  error: string | null;
}

export function useMapEngine(provider: MapProvider): MapEngine {
  const neshan = useNeshanSdk(provider === "neshan");
  const mapbox = useMapboxSdk(provider === "mapbox");

  if (provider === "mapbox") {
    return { sdk: mapbox.mapbox, isLoaded: mapbox.isLoaded, error: mapbox.error };
  }
  return { sdk: neshan.neshan, isLoaded: neshan.isLoaded, error: neshan.error };
}

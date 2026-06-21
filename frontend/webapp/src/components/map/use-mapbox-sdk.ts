"use client";

import { useEffect, useState } from "react";

import { MAPBOX_TOKEN } from "./map-provider";

// mapbox-gl touches `window` at evaluation time, so it is imported dynamically
// (client-only) and cached as a single shared promise across all map instances.
let mapboxPromise: Promise<any> | null = null;

function loadMapboxSdk() {
  if (mapboxPromise) return mapboxPromise;

  mapboxPromise = import("mapbox-gl").then((mod) => {
    const mapboxgl = (mod as any).default ?? mod;
    if (MAPBOX_TOKEN) {
      mapboxgl.accessToken = MAPBOX_TOKEN;
    }

    // Mapbox GL can't shape/join Arabic & Persian script on its own — without
    // this plugin RTL labels render as disconnected, reversed glyphs (the
    // "piecemeal Persian text" bug). Registered once, globally, before any map
    // is created. lazy:true fetches the plugin only when RTL text is first seen.
    try {
      const status =
        typeof mapboxgl.getRTLTextPluginStatus === "function"
          ? mapboxgl.getRTLTextPluginStatus()
          : "unavailable";
      if (status === "unavailable" && typeof mapboxgl.setRTLTextPlugin === "function") {
        mapboxgl.setRTLTextPlugin(
          "https://api.mapbox.com/mapbox-gl-js/plugins/mapbox-gl-rtl-text/v0.3.0/mapbox-gl-rtl-text.js",
          null,
          true,
        );
      }
    } catch {
      // already registered or unsupported build — safe to ignore
    }

    return mapboxgl;
  });

  return mapboxPromise;
}

export function useMapboxSdk(enabled = true) {
  const [mapbox, setMapbox] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    loadMapboxSdk()
      .then((sdk) => {
        if (!cancelled) {
          setMapbox(sdk);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Mapbox SDK failed to load");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    mapbox,
    isLoaded: Boolean(mapbox),
    error,
  };
}

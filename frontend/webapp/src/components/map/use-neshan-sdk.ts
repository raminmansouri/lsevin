"use client";

import { useEffect, useState } from "react";

import {
  NESHAN_SDK_SCRIPT_SRC,
  NESHAN_SDK_STYLE_HREF,
  NESHAN_SDK_STYLE_ID,
} from "./map-provider";

declare global {
  interface Window {
    nmp_mapboxgl?: any;
    __lsevinNeshanSdkPromise?: Promise<any>;
  }
}

function ensureNeshanStyle() {
  if (document.getElementById(NESHAN_SDK_STYLE_ID)) return;

  const link = document.createElement("link");
  link.id = NESHAN_SDK_STYLE_ID;
  link.rel = "stylesheet";
  link.href = NESHAN_SDK_STYLE_HREF;
  document.head.appendChild(link);
}

function loadNeshanSdk() {
  if (window.nmp_mapboxgl) return Promise.resolve(window.nmp_mapboxgl);
  if (window.__lsevinNeshanSdkPromise) return window.__lsevinNeshanSdkPromise;

  ensureNeshanStyle();

  window.__lsevinNeshanSdkPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${NESHAN_SDK_SCRIPT_SRC}"]`,
    );

    if (existing) {
      existing.addEventListener("load", () => resolve(window.nmp_mapboxgl));
      existing.addEventListener("error", () => reject(new Error("Neshan SDK failed to load")));
      return;
    }

    const script = document.createElement("script");
    script.src = NESHAN_SDK_SCRIPT_SRC;
    script.async = true;
    script.onload = () => {
      if (window.nmp_mapboxgl) {
        resolve(window.nmp_mapboxgl);
      } else {
        reject(new Error("Neshan SDK loaded, but nmp_mapboxgl is unavailable"));
      }
    };
    script.onerror = () => reject(new Error("Neshan SDK failed to load"));
    document.head.appendChild(script);
  });

  return window.__lsevinNeshanSdkPromise;
}

export function useNeshanSdk(enabled = true) {
  const [neshan, setNeshan] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    loadNeshanSdk()
      .then((sdk) => {
        if (!cancelled) {
          setNeshan(sdk);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Neshan SDK failed to load");
        }
      });

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return {
    neshan,
    isLoaded: Boolean(neshan),
    error,
  };
}

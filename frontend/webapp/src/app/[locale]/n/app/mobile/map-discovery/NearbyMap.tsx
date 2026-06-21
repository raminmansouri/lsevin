"use client";

import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import type { NearbyProvider } from "./nearby.data";
import {
  createMapInstance,
  isProviderConfigured,
  resolveMapProvider,
  type MapProvider,
} from "@/components/map/map-provider";
import { useMapEngine } from "@/components/map/use-map-engine";
import { resolveHomeMediaUrl } from "@/features/home/components/home-media";

const BARE_UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function firstMediaValue(value?: string | null): string {
  return (
    String(value || "")
      .split(/[،,|]/)
      .map((part) => part.trim().replace(/^[\[\]'"]+|[\]'"]+$/g, "").replace(/\\/g, "/"))
      .find(Boolean) ?? ""
  );
}

// Resolves a provider image reference to a usable URL, or "" when there is no
// real image (so the marker falls back to the plain pin).
function resolveMarkerImage(value?: string | null): string {
  const raw = firstMediaValue(value);
  if (!raw || BARE_UUID_RE.test(raw)) return "";
  return resolveHomeMediaUrl(raw) || "";
}

type NearbyMapProps = {
  providers: NearbyProvider[];
  selectedProvider: NearbyProvider | null;
  onSelectProvider: (id: string | null) => void;
  center: { lat: number; lng: number; zoom: number };
  /** The visitor's own position. When set, a distinct pulsing pin marks them on
   *  the map so they can see where they are relative to nearby providers. */
  userLocation?: { lat: number; lng: number } | null;
  /** Optional region hint (e.g. selected filter country or the user's detected
   *  country). When set, it decides Neshan (IR) vs Mapbox over the bbox. */
  countryCode?: string | null;
};

function MissingMap({ title, body }: { title: string; body: string }) {
  return (
    <div className="relative flex h-[calc(100vh-240px)] items-center justify-center overflow-hidden bg-gray-100">
      <div className="px-6 text-center">
        <p className="mb-1 font-semibold text-gray-900">{title}</p>
        <p className="text-sm text-gray-600">{body}</p>
      </div>
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function createProviderMarkerElement(
  isSelected: boolean,
  imageUrl: string,
  name: string,
  labels: { selectedProvider: string; selectProvider: string },
  provider: MapProvider,
) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "map-discovery-neshan-marker";
  element.setAttribute("aria-label", isSelected ? labels.selectedProvider : labels.selectProvider);

  // MapboxGL/Neshan positions markers by applying its own absolute positioning
  // and transform to the marker root. For Neshan we pin the root absolutely so
  // app CSS can't override the SDK placement. Mapbox GL wraps the element in its
  // own positioned container, so the root must stay in normal flow there.
  if (provider === "neshan") {
    element.style.position = "absolute";
    element.style.top = "0";
    element.style.left = "0";
  }
  element.style.border = "0";
  element.style.padding = "0";
  element.style.margin = "0";
  element.style.background = "transparent";
  element.style.cursor = "pointer";
  element.style.zIndex = isSelected ? "20" : "10";

  const pulse = isSelected
    ? '<span class="absolute inset-0 block h-12 w-12 animate-ping rounded-full bg-[#083f30] opacity-20"></span>'
    : "";
  const selectedScale = isSelected ? "scale-110" : "";

  if (imageUrl) {
    // Image avatar marker: the provider photo fills the circle, with the first
    // letter of the name shown behind it as a fallback if the image fails to load.
    const ringColor = isSelected ? "#083f30" : "#ffffff";
    const initial = escapeHtml((name || "L").trim().charAt(0).toUpperCase() || "L");

    element.innerHTML = `
      <span class="relative block h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-110 ${selectedScale}">
        ${pulse}
        <span class="relative block h-12 w-12 overflow-hidden rounded-full bg-[#083f30]" style="border:3px solid ${ringColor}">
          <span class="absolute inset-0 flex items-center justify-center text-sm font-bold text-white">${initial}</span>
          <img src="${escapeHtml(imageUrl)}" alt="" class="absolute inset-0 h-full w-full object-cover" />
        </span>
      </span>
    `;

    // Drop the <img> on load error so the initial-letter fallback shows (no inline handler, CSP-safe).
    const img = element.querySelector("img");
    img?.addEventListener("error", () => img.remove());

    return element;
  }

  const markerBackground = isSelected ? "bg-[#083f30]" : "bg-white";
  const markerColor = isSelected ? "#eacb7f" : "#083f30";
  const markerSize = isSelected ? 24 : 20;

  element.innerHTML = `
    <span class="relative block h-12 w-12 rounded-full shadow-lg transition-transform hover:scale-110 ${selectedScale}">
      ${pulse}
      <span class="relative flex h-12 w-12 items-center justify-center rounded-full ${markerBackground}">
        <svg width="${markerSize}" height="${markerSize}" viewBox="0 0 24 24" fill="${isSelected ? markerColor : "none"}" stroke="${markerColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </span>
    </span>
  `;

  return element;
}

// A distinct, non-interactive pin marking the visitor's own location (blue dot
// with a pulse) so it reads differently from the green provider markers.
function createUserMarkerElement(provider: MapProvider) {
  const element = document.createElement("div");
  element.className = "map-discovery-user-marker";

  if (provider === "neshan") {
    element.style.position = "absolute";
    element.style.top = "0";
    element.style.left = "0";
  }
  element.style.pointerEvents = "none";
  element.style.zIndex = "5";

  element.innerHTML = `
    <span class="relative flex h-5 w-5 items-center justify-center">
      <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-500 opacity-40"></span>
      <span class="relative inline-flex h-4 w-4 rounded-full border-2 border-white bg-blue-600 shadow-md"></span>
    </span>
  `;

  return element;
}

export default function NearbyMap({
  providers,
  selectedProvider,
  onSelectProvider,
  center,
  userLocation,
  countryCode,
}: NearbyMapProps) {
  const t = useTranslations("NearbyMap");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const popupRef = useRef<any>(null);

  // Neshan for Iran, Mapbox when international. A known country code (selected
  // filter or the user's detected location) wins; otherwise the map center bbox.
  const provider = resolveMapProvider({
    countryCode,
    coordinates: { latitude: center.lat, longitude: center.lng },
  });
  const { sdk, isLoaded, error } = useMapEngine(provider);
  const configured = isProviderConfigured(provider);

  useEffect(() => {
    if (!isLoaded || !sdk || !containerRef.current || mapRef.current || !configured) return;

    // Create the map ONCE (per sdk/provider). Center/zoom changes are handled by
    // the easeTo effect below — recreating the map on every center change caused
    // flicker and dropped markers. `center` here is only the initial view.
    mapRef.current = createMapInstance(sdk, provider, {
      container: containerRef.current,
      center: [center.lng, center.lat],
      zoom: center.zoom,
    });

    const resizeMap = () => mapRef.current?.resize?.();
    mapRef.current.once?.("load", resizeMap);
    requestAnimationFrame(resizeMap);
    window.setTimeout(resizeMap, 250);

    return () => {
      popupRef.current?.remove?.();
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      mapRef.current?.remove?.();
      mapRef.current = null;
      popupRef.current = null;
    };
    // center is intentionally excluded — initial view only; updates go through easeTo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, sdk, provider, configured]);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.easeTo?.({
      center: [center.lng, center.lat],
      zoom: center.zoom,
      duration: 350,
    });
  }, [center.lat, center.lng, center.zoom]);

  useEffect(() => {
    if (!mapRef.current || !sdk) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    providers
      .filter((providerItem) => providerItem.coordinates)
      .forEach((providerItem) => {
        const isSelected = selectedProvider?.id === providerItem.id;
        const element = createProviderMarkerElement(
          isSelected,
          resolveMarkerImage(providerItem.image),
          providerItem.name,
          {
            selectedProvider: t("selectedProvider"),
            selectProvider: t("selectProvider"),
          },
          provider,
        );
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectProvider(providerItem.id);
        });

        const marker = new sdk.Marker({ element, anchor: "bottom" })
          .setLngLat([providerItem.coordinates!.lng, providerItem.coordinates!.lat])
          .addTo(mapRef.current);

        if (provider === "neshan") {
          marker.getElement?.().style?.setProperty("position", "absolute", "important");
        }

        markersRef.current.push(marker);
      });
  }, [sdk, provider, onSelectProvider, providers, selectedProvider?.id, t]);

  // Render the visitor's own location pin (separate from provider markers).
  useEffect(() => {
    if (!mapRef.current || !sdk || !userLocation) return;

    const element = createUserMarkerElement(provider);
    const marker = new sdk.Marker({ element, anchor: "center" })
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(mapRef.current);

    if (provider === "neshan") {
      marker.getElement?.().style?.setProperty("position", "absolute", "important");
    }

    return () => marker.remove();
  }, [sdk, provider, userLocation?.lat, userLocation?.lng]);

  useEffect(() => {
    if (!mapRef.current || !sdk) return;

    popupRef.current?.remove?.();
    popupRef.current = null;

    if (!selectedProvider?.coordinates) return;

    popupRef.current = new sdk.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 20,
    })
      .setLngLat([selectedProvider.coordinates.lng, selectedProvider.coordinates.lat])
      .setHTML(`<div class="text-sm font-medium">${escapeHtml(selectedProvider.name)}</div>`)
      .addTo(mapRef.current);
  }, [sdk, selectedProvider]);

  if (!configured) {
    return (
      <MissingMap
        title={t(provider === "mapbox" ? "mapboxNotConfiguredTitle" : "neshanNotConfiguredTitle")}
        body={t(provider === "mapbox" ? "mapboxNotConfiguredBody" : "neshanNotConfiguredBody")}
      />
    );
  }

  if (error) {
    return (
      <MissingMap
        title={t(provider === "mapbox" ? "mapboxCouldNotLoad" : "neshanCouldNotLoad")}
        body={t(provider === "mapbox" ? "mapboxCouldNotLoadBody" : "neshanCouldNotLoadBody")}
      />
    );
  }

  return (
    <div className="relative h-[calc(100vh-240px)] overflow-hidden bg-gray-100">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";

import type { NearbyProvider } from "./nearby.data";
import {
  getConfiguredNeshanMapType,
  NESHAN_MAP_KEY,
} from "@/components/map/map-provider";
import { useNeshanSdk } from "@/components/map/use-neshan-sdk";
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

function createNeshanMarkerElement(
  isSelected: boolean,
  imageUrl: string,
  name: string,
  labels: { selectedProvider: string; selectProvider: string },
) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "map-discovery-neshan-marker";
  element.setAttribute("aria-label", isSelected ? labels.selectedProvider : labels.selectProvider);

  // MapboxGL/Neshan positions markers by applying its own absolute positioning
  // and transform to the marker root. Do not put Tailwind `relative`, `absolute`,
  // or `transform` utilities on this root, otherwise app CSS can override the SDK
  // marker positioning and all pins appear in the wrong visual place.
  element.style.position = "absolute";
  element.style.top = "0";
  element.style.left = "0";
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

export default function NearbyMap({
  providers,
  selectedProvider,
  onSelectProvider,
  center,
}: NearbyMapProps) {
  const t = useTranslations("NearbyMap");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const popupRef = useRef<any>(null);
  const { neshan, isLoaded, error } = useNeshanSdk(true);

  useEffect(() => {
    if (!isLoaded || !neshan || !containerRef.current || mapRef.current || !NESHAN_MAP_KEY) return;

    const mapTypeName = getConfiguredNeshanMapType();
    const mapType = neshan.Map.mapTypes?.[mapTypeName] ?? neshan.Map.mapTypes?.neshanVector;

    mapRef.current = new neshan.Map({
      mapType,
      container: containerRef.current,
      zoom: center.zoom,
      pitch: 0,
      center: [center.lng, center.lat],
      minZoom: 2,
      maxZoom: 21,
      trackResize: true,
      mapKey: NESHAN_MAP_KEY,
      poi: false,
      traffic: false,
      isTouchPlatform: true,
      mapTypeControllerOptions: {
        show: true,
        position: "bottom-left",
      },
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
  }, [center.lat, center.lng, center.zoom, isLoaded, neshan]);

  useEffect(() => {
    if (!mapRef.current) return;

    mapRef.current.easeTo?.({
      center: [center.lng, center.lat],
      zoom: center.zoom,
      duration: 350,
    });
  }, [center.lat, center.lng, center.zoom]);

  useEffect(() => {
    if (!mapRef.current || !neshan) return;

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    providers
      .filter((providerItem) => providerItem.coordinates)
      .forEach((providerItem) => {
        const isSelected = selectedProvider?.id === providerItem.id;
        const element = createNeshanMarkerElement(
          isSelected,
          resolveMarkerImage(providerItem.image),
          providerItem.name,
          {
            selectedProvider: t("selectedProvider"),
            selectProvider: t("selectProvider"),
          },
        );
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectProvider(providerItem.id);
        });

        const marker = new neshan.Marker({ element, anchor: "bottom" })
          .setLngLat([providerItem.coordinates!.lng, providerItem.coordinates!.lat])
          .addTo(mapRef.current);

        marker.getElement?.().style?.setProperty("position", "absolute", "important");

        markersRef.current.push(marker);
      });
  }, [neshan, onSelectProvider, providers, selectedProvider?.id, t]);

  useEffect(() => {
    if (!mapRef.current || !neshan) return;

    popupRef.current?.remove?.();
    popupRef.current = null;

    if (!selectedProvider?.coordinates) return;

    popupRef.current = new neshan.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 20,
    })
      .setLngLat([selectedProvider.coordinates.lng, selectedProvider.coordinates.lat])
      .setHTML(`<div class="text-sm font-medium">${escapeHtml(selectedProvider.name)}</div>`)
      .addTo(mapRef.current);
  }, [neshan, selectedProvider]);

  if (!NESHAN_MAP_KEY) {
    return (
      <MissingMap
        title={t("neshanNotConfiguredTitle")}
        body={t("neshanNotConfiguredBody")}
      />
    );
  }

  if (error) {
    return <MissingMap title={t("neshanCouldNotLoad")} body={t("neshanCouldNotLoadBody")} />;
  }

  return (
    <div className="relative h-[calc(100vh-240px)] overflow-hidden bg-gray-100">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

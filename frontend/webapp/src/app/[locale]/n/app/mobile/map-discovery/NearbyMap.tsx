"use client";

import { useEffect, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapPin } from "lucide-react";
import Map, { Marker, NavigationControl, Popup } from "react-map-gl/mapbox";

import type { NearbyProvider } from "./nearby.data";
import {
  getConfiguredMapProvider,
  getConfiguredNeshanMapType,
  MAPBOX_TOKEN,
  NESHAN_MAP_KEY,
  type SupportedMapProvider,
} from "@/components/map/map-provider";
import { useNeshanSdk } from "@/components/map/use-neshan-sdk";

type NearbyMapProps = {
  providers: NearbyProvider[];
  selectedProvider: NearbyProvider | null;
  onSelectProvider: (id: string | null) => void;
  center: { lat: number; lng: number; zoom: number };
  provider?: SupportedMapProvider;
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

function MapboxNearbyMap({
  providers,
  selectedProvider,
  onSelectProvider,
  center,
}: NearbyMapProps) {
  if (!MAPBOX_TOKEN) {
    return (
      <MissingMap
        title="Mapbox is not configured"
        body="Set NEXT_PUBLIC_MAPBOX_TOKEN or switch the map provider to Neshan."
      />
    );
  }

  return (
    <div className="relative h-[calc(100vh-240px)] overflow-hidden bg-gray-100">
      <Map
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={{ latitude: center.lat, longitude: center.lng, zoom: center.zoom }}
        style={{ width: "100%", height: "100%" }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        reuseMaps
      >
        <NavigationControl position="bottom-right" />

        {providers
          .filter((providerItem) => providerItem.coordinates)
          .map((providerItem) => {
            const isSelected = selectedProvider?.id === providerItem.id;
            return (
              <Marker
                key={providerItem.id}
                longitude={providerItem.coordinates!.lng}
                latitude={providerItem.coordinates!.lat}
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation();
                  onSelectProvider(providerItem.id);
                }}
              >
                <button
                  type="button"
                  className={`relative shadow-lg transition-all hover:scale-110 ${
                    isSelected ? "z-20 scale-125" : "z-10"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute inset-0 h-12 w-12 animate-ping rounded-full bg-[#083f30] opacity-20" />
                  )}
                  <div
                    className={`relative flex h-12 w-12 items-center justify-center rounded-full ${
                      isSelected ? "bg-[#083f30]" : "bg-white"
                    }`}
                  >
                    {isSelected ? (
                      <MapPin size={24} className="text-[#eacb7f]" fill="#eacb7f" />
                    ) : (
                      <MapPin size={20} className="text-[#083f30]" />
                    )}
                  </div>
                </button>
              </Marker>
            );
          })}

        {selectedProvider?.coordinates && (
          <Popup
            longitude={selectedProvider.coordinates.lng}
            latitude={selectedProvider.coordinates.lat}
            anchor="top"
            closeButton={false}
            closeOnClick={false}
            offset={20}
            onClose={() => onSelectProvider(null)}
          >
            <div className="text-sm font-medium">{selectedProvider.name}</div>
          </Popup>
        )}
      </Map>
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

function createNeshanMarkerElement(isSelected: boolean) {
  const element = document.createElement("button");
  element.type = "button";
  element.className = `relative rounded-full shadow-lg transition-all ${isSelected ? "z-20 scale-125" : "z-10"}`;
  element.setAttribute("aria-label", isSelected ? "Selected provider" : "Select provider");

  const pulse = isSelected
    ? '<span class="absolute inset-0 block h-12 w-12 animate-ping rounded-full bg-[#083f30] opacity-20"></span>'
    : "";
  const markerBackground = isSelected ? "bg-[#083f30]" : "bg-white";
  const markerColor = isSelected ? "#eacb7f" : "#083f30";
  const markerSize = isSelected ? 24 : 20;

  element.innerHTML = `
    ${pulse}
    <span class="relative flex h-12 w-12 items-center justify-center rounded-full ${markerBackground}">
      <svg width="${markerSize}" height="${markerSize}" viewBox="0 0 24 24" fill="${isSelected ? markerColor : "none"}" stroke="${markerColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </span>
  `;

  return element;
}

function NeshanNearbyMap({
  providers,
  selectedProvider,
  onSelectProvider,
  center,
}: NearbyMapProps) {
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
      poi: true,
      traffic: false,
      isTouchPlatform: true,
      mapTypeControllerOptions: {
        show: true,
        position: "bottom-left",
      },
    });

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
        const element = createNeshanMarkerElement(isSelected);
        element.addEventListener("click", (event) => {
          event.stopPropagation();
          onSelectProvider(providerItem.id);
        });

        const marker = new neshan.Marker({ element, anchor: "bottom" })
          .setLngLat([providerItem.coordinates!.lng, providerItem.coordinates!.lat])
          .addTo(mapRef.current);

        markersRef.current.push(marker);
      });
  }, [neshan, onSelectProvider, providers, selectedProvider?.id]);

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
        title="Neshan is not configured"
        body="Set NEXT_PUBLIC_NESHAN_MAP_KEY in your environment."
      />
    );
  }

  if (error) {
    return <MissingMap title="Neshan map could not load" body={error} />;
  }

  return (
    <div className="relative h-[calc(100vh-240px)] overflow-hidden bg-gray-100">
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

export default function NearbyMap(props: NearbyMapProps) {
  const provider = props.provider ?? getConfiguredMapProvider();

  if (provider === "neshan") {
    return <NeshanNearbyMap {...props} provider="neshan" />;
  }

  return <MapboxNearbyMap {...props} provider="mapbox" />;
}

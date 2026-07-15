"use client";

// mapbox-gl needs its stylesheet for the canvas, controls and markers. Importing
// it here is a no-op for the Neshan path (which injects its own CSS).
import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";

import {
  Coordinates,
  DEFAULT_COORDINATES,
} from "@/features/shared/types/coordinates";

import {
  createMapInstance,
  isProviderConfigured,
  resolveMapProvider,
} from "./map-provider";
import { useMapEngine } from "./use-map-engine";

export interface MapComponentProps {
  coordinates?: Coordinates | null;
  onCoordinatesChange?: (coordinates: Coordinates) => void;
  interactive?: boolean;
  className?: string;
  zoom?: number;
  height?: string;
  /**
   * Optional country code (e.g. "IR"). When provided it takes precedence over
   * the coordinate bounding box for choosing Neshan (Iran) vs Mapbox (intl).
   */
  countryCode?: string | null;
}

function MissingMapConfiguration({
  className,
  height,
  message,
}: {
  className: string;
  height: string;
  message: string;
}) {
  return (
    <div
      className={`bg-muted flex items-center justify-center rounded-lg ${className}`}
      style={{ height }}
    >
      <p className="text-muted-foreground px-4 text-center text-sm">{message}</p>
    </div>
  );
}

function createNeshanPinElement() {
  const element = document.createElement("div");
  element.className = "lsevin-neshan-picker-marker";

  // Keep the SDK-controlled marker root clean. Tailwind transform/position
  // utilities on this element can override Neshan/MapboxGL marker placement.
  element.style.position = "absolute";
  element.style.top = "0";
  element.style.left = "0";
  element.style.width = "32px";
  element.style.height = "32px";

  element.innerHTML = `
    <div class="-translate-x-1/2 -translate-y-full transform">
      <svg width="32" height="32" viewBox="0 0 24 24" fill="rgba(8, 63, 48, 0.2)" stroke="#083f30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"></path>
        <circle cx="12" cy="10" r="3"></circle>
      </svg>
    </div>
  `;
  return element;
}

export function MapComponent({
  coordinates,
  onCoordinatesChange,
  interactive = true,
  className = "",
  zoom = 13,
  height = "400px",
  countryCode,
}: MapComponentProps) {
  const t = useTranslations("MapShared");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const initialCoords = coordinates || DEFAULT_COORDINATES;
  const [markerCoords, setMarkerCoords] = useState<Coordinates>(initialCoords);

  // Neshan for Iran, Mapbox for international. Provider only changes value when
  // the point crosses the Iran border, so the init effect re-runs rarely.
  const provider = resolveMapProvider({ countryCode, coordinates: coordinates ?? initialCoords });
  const { sdk, isLoaded, error } = useMapEngine(provider);
  const configured = isProviderConfigured(provider);

  useEffect(() => {
    if (coordinates) {
      setMarkerCoords(coordinates);
    }
  }, [coordinates]);

  useEffect(() => {
    if (!isLoaded || !sdk || !containerRef.current || mapRef.current || !configured) {
      return;
    }

    const map = createMapInstance(sdk, provider, {
      container: containerRef.current,
      center: [initialCoords.longitude, initialCoords.latitude],
      zoom,
    });

    const resizeMap = () => map.resize?.();
    map.once?.("load", resizeMap);
    requestAnimationFrame(resizeMap);
    window.setTimeout(resizeMap, 250);

    let marker: any;
    if (provider === "mapbox") {
      marker = new sdk.Marker({ color: "#083f30", draggable: interactive, anchor: "bottom" })
        .setLngLat([markerCoords.longitude, markerCoords.latitude])
        .addTo(map);
    } else {
      marker = new sdk.Marker({
        element: createNeshanPinElement(),
        draggable: interactive,
        anchor: "bottom",
      })
        .setLngLat([markerCoords.longitude, markerCoords.latitude])
        .addTo(map);
      marker.getElement?.().style?.setProperty("position", "absolute", "important");
    }

    if (interactive && onCoordinatesChange) {
      map.on("click", (event: any) => {
        const newCoords: Coordinates = {
          longitude: Number(event.lngLat.lng),
          latitude: Number(event.lngLat.lat),
        };
        setMarkerCoords(newCoords);
        marker.setLngLat([newCoords.longitude, newCoords.latitude]);
        onCoordinatesChange(newCoords);
      });

      marker.on("dragend", () => {
        const lngLat = marker.getLngLat();
        const newCoords: Coordinates = {
          longitude: Number(lngLat.lng),
          latitude: Number(lngLat.lat),
        };
        setMarkerCoords(newCoords);
        onCoordinatesChange(newCoords);
      });
    }

    mapRef.current = map;
    markerRef.current = marker;

    return () => {
      marker.remove();
      map.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
    // Initialize once per (provider, sdk, interactivity). Coordinate updates are
    // handled by the effect below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, sdk, provider, configured, interactive, onCoordinatesChange]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !coordinates) return;

    markerRef.current.setLngLat([coordinates.longitude, coordinates.latitude]);
    mapRef.current.easeTo?.({
      center: [coordinates.longitude, coordinates.latitude],
      zoom,
      duration: 400,
    });
  }, [coordinates, zoom]);

  if (!configured) {
    return (
      <MissingMapConfiguration
        className={className}
        height={height}
        message={t(
          provider === "mapbox"
            ? "mapboxConfigurationMissing"
            : "neshanConfigurationMissing",
        )}
      />
    );
  }

  if (error) {
    return (
      <MissingMapConfiguration
        className={className}
        height={height}
        message={t(provider === "mapbox" ? "mapboxMapLoadError" : "neshanMapLoadError")}
      />
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg ${className}`} style={{ height }}>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

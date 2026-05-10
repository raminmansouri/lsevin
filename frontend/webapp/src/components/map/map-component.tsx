"use client";

import { useEffect, useRef, useState } from "react";
import Map, {
  MapMouseEvent,
  MapRef,
  Marker,
  MarkerDragEvent,
  ViewState,
  ViewStateChangeEvent,
} from "react-map-gl/mapbox";

import "mapbox-gl/dist/mapbox-gl.css";

import { MapPin } from "lucide-react";

import {
  Coordinates,
  DEFAULT_COORDINATES,
} from "@/features/shared/types/coordinates";

import {
  getConfiguredMapProvider,
  getConfiguredNeshanMapType,
  MAPBOX_TOKEN,
  NESHAN_MAP_KEY,
  type SupportedMapProvider,
} from "./map-provider";
import { useNeshanSdk } from "./use-neshan-sdk";

export interface MapComponentProps {
  coordinates?: Coordinates | null;
  onCoordinatesChange?: (coordinates: Coordinates) => void;
  interactive?: boolean;
  className?: string;
  zoom?: number;
  height?: string;
  provider?: SupportedMapProvider;
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

function MapboxMapComponent({
  coordinates,
  onCoordinatesChange,
  interactive = true,
  className = "",
  zoom = 13,
  height = "400px",
}: Omit<MapComponentProps, "provider">) {
  const mapRef = useRef<MapRef>(null);
  const initialCoords = coordinates || DEFAULT_COORDINATES;

  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: initialCoords.longitude,
    latitude: initialCoords.latitude,
    zoom,
  });

  const [markerCoords, setMarkerCoords] = useState<Coordinates>(initialCoords);

  useEffect(() => {
    if (coordinates) {
      setMarkerCoords(coordinates);
      setViewState({
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        zoom,
      });
    }
  }, [coordinates, zoom]);

  const handleMapClick = (event: MapMouseEvent) => {
    if (!interactive || !onCoordinatesChange) return;

    const { lng, lat } = event.lngLat;
    const newCoords: Coordinates = { longitude: lng, latitude: lat };

    setMarkerCoords(newCoords);
    onCoordinatesChange(newCoords);
  };

  const handleMarkerDragEnd = (event: MarkerDragEvent) => {
    if (!interactive || !onCoordinatesChange) return;

    const { lng, lat } = event.lngLat;
    const newCoords: Coordinates = { longitude: lng, latitude: lat };

    setMarkerCoords(newCoords);
    onCoordinatesChange(newCoords);
  };

  if (!MAPBOX_TOKEN) {
    return (
      <MissingMapConfiguration
        className={className}
        height={height}
        message="Mapbox configuration missing. Set NEXT_PUBLIC_MAPBOX_TOKEN or switch NEXT_PUBLIC_MAP_PROVIDER to neshan."
      />
    );
  }

  return (
    <div
      className={`overflow-hidden rounded-lg ${className}`}
      style={{ height }}
    >
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt: ViewStateChangeEvent) => setViewState(evt.viewState)}
        onClick={handleMapClick}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle="mapbox://styles/mapbox/streets-v12"
        interactive={interactive}
        attributionControl={false}
      >
        <Marker
          longitude={markerCoords.longitude}
          latitude={markerCoords.latitude}
          draggable={interactive}
          onDragEnd={handleMarkerDragEnd}
        >
          <div className="-translate-x-1/2 -translate-y-full transform">
            <MapPin className="text-primary fill-primary/20 h-8 w-8" />
          </div>
        </Marker>
      </Map>
    </div>
  );
}

function createNeshanPinElement() {
  const element = document.createElement("div");
  element.className = "-translate-x-1/2 -translate-y-full transform";
  element.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 24 24" fill="rgba(8, 63, 48, 0.2)" stroke="#083f30" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  `;
  return element;
}

function NeshanMapComponent({
  coordinates,
  onCoordinatesChange,
  interactive = true,
  className = "",
  zoom = 13,
  height = "400px",
}: Omit<MapComponentProps, "provider">) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const initialCoords = coordinates || DEFAULT_COORDINATES;
  const [markerCoords, setMarkerCoords] = useState<Coordinates>(initialCoords);
  const { neshan, isLoaded, error } = useNeshanSdk(true);

  useEffect(() => {
    if (coordinates) {
      setMarkerCoords(coordinates);
    }
  }, [coordinates]);

  useEffect(() => {
    if (!isLoaded || !neshan || !containerRef.current || mapRef.current || !NESHAN_MAP_KEY) {
      return;
    }

    const mapTypeName = getConfiguredNeshanMapType();
    const mapType = neshan.Map.mapTypes?.[mapTypeName] ?? neshan.Map.mapTypes?.neshanVector;

    const map = new neshan.Map({
      mapType,
      container: containerRef.current,
      zoom,
      pitch: 0,
      center: [initialCoords.longitude, initialCoords.latitude],
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

    const marker = new neshan.Marker({
      element: createNeshanPinElement(),
      draggable: interactive,
      anchor: "bottom",
    })
      .setLngLat([markerCoords.longitude, markerCoords.latitude])
      .addTo(map);

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
    // We intentionally initialize the Neshan map once per mount. Coordinate updates are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoaded, neshan, interactive, onCoordinatesChange]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || !coordinates) return;

    markerRef.current.setLngLat([coordinates.longitude, coordinates.latitude]);
    mapRef.current.easeTo?.({
      center: [coordinates.longitude, coordinates.latitude],
      zoom,
      duration: 400,
    });
  }, [coordinates, zoom]);

  if (!NESHAN_MAP_KEY) {
    return (
      <MissingMapConfiguration
        className={className}
        height={height}
        message="Neshan configuration missing. Set NEXT_PUBLIC_NESHAN_MAP_KEY."
      />
    );
  }

  if (error) {
    return (
      <MissingMapConfiguration
        className={className}
        height={height}
        message={error}
      />
    );
  }

  return (
    <div className={`overflow-hidden rounded-lg ${className}`} style={{ height }}>
      <div ref={containerRef} className="h-full w-full" />
    </div>
  );
}

export function MapComponent(props: MapComponentProps) {
  const provider = props.provider ?? getConfiguredMapProvider();

  if (provider === "neshan") {
    return <NeshanMapComponent {...props} />;
  }

  return <MapboxMapComponent {...props} />;
}

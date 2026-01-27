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

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

export interface MapComponentProps {
  coordinates?: Coordinates | null;
  onCoordinatesChange?: (coordinates: Coordinates) => void;
  interactive?: boolean;
  className?: string;
  zoom?: number;
  height?: string;
}

export function MapComponent({
  coordinates,
  onCoordinatesChange,
  interactive = true,
  className = "",
  zoom = 13,
  height = "400px",
}: MapComponentProps) {
  const mapRef = useRef<MapRef>(null);
  const initialCoords = coordinates || DEFAULT_COORDINATES;

  const [viewState, setViewState] = useState<Partial<ViewState>>({
    longitude: initialCoords.longitude,
    latitude: initialCoords.latitude,
    zoom: zoom,
  });

  const [markerCoords, setMarkerCoords] = useState<Coordinates>(initialCoords);

  // Update marker when coordinates prop changes
  useEffect(() => {
    if (coordinates) {
      setMarkerCoords(coordinates);
      setViewState({
        longitude: coordinates.longitude,
        latitude: coordinates.latitude,
        zoom: zoom,
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
      <div
        className={`bg-muted flex items-center justify-center rounded-lg ${className}`}
        style={{ height }}
      >
        <p className="text-muted-foreground text-sm">
          Map configuration missing
        </p>
      </div>
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

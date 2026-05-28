"use client";

import { Coordinates } from "@/features/shared/types/coordinates";

import { MapComponent } from "./map-component";
import type { SupportedMapProvider } from "./map-provider";

export interface MapViewerProps {
  coordinates: Coordinates;
  address?: string;
  className?: string;
  height?: string;
  showAddress?: boolean;
  mapProvider?: SupportedMapProvider;
}

export function MapViewer({
  coordinates,
  address,
  className = "",
  height = "300px",
  showAddress = false,
  mapProvider,
}: MapViewerProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <MapComponent
        coordinates={coordinates}
        interactive={false}
        height={height}
        zoom={14}
        provider={mapProvider}
      />

      {showAddress && address && (
        <p className="text-muted-foreground mt-2 text-sm">{address}</p>
      )}
    </div>
  );
}

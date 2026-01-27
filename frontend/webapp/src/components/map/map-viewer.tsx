"use client";

import { Coordinates } from "@/features/shared/types/coordinates";

import { MapComponent } from "./map-component";

export interface MapViewerProps {
  coordinates: Coordinates;
  address?: string;
  className?: string;
  height?: string;
  showAddress?: boolean;
}

export function MapViewer({
  coordinates,
  address,
  className = "",
  height = "300px",
  showAddress = false,
}: MapViewerProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      <MapComponent
        coordinates={coordinates}
        interactive={false}
        height={height}
        zoom={14}
      />

      {showAddress && address && (
        <p className="text-muted-foreground mt-2 text-sm">{address}</p>
      )}
    </div>
  );
}

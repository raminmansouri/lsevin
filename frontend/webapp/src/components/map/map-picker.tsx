"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { useFormContext } from "react-hook-form";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Coordinates,
  isValidCoordinates,
} from "@/features/shared/types/coordinates";

import { MapComponent } from "./map-component";

export interface MapPickerProps {
  namePrefix: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  description?: string;
}

export function MapPicker({
  namePrefix,
  disabled = false,
  className = "",
  label = "Location",
  description = "Click on the map, drag the marker, or enter coordinates manually",
}: MapPickerProps) {
  const { control, watch, setValue } = useFormContext();

  // Watch the coordinates field from the form
  const coordinates = watch(namePrefix) as Coordinates | null;

  const [localCoordinates, setLocalCoordinates] = useState<Coordinates | null>(
    coordinates || null
  );

  // Update local state when form value changes
  useEffect(() => {
    if (coordinates && isValidCoordinates(coordinates)) {
      setLocalCoordinates(coordinates);
    } else {
      setLocalCoordinates(null);
    }
  }, [coordinates]);

  const handleMapCoordinatesChange = (newCoords: Coordinates) => {
    setLocalCoordinates(newCoords);
    setValue(namePrefix, newCoords, { shouldValidate: true });
  };

  const handleLatitudeChange = (value: string) => {
    const latitude = parseFloat(value);
    if (!isNaN(latitude)) {
      const newCoords: Coordinates = {
        latitude,
        longitude: localCoordinates?.longitude || 0,
      };
      if (isValidCoordinates(newCoords)) {
        setLocalCoordinates(newCoords);
        setValue(namePrefix, newCoords, { shouldValidate: true });
      }
    }
  };

  const handleLongitudeChange = (value: string) => {
    const longitude = parseFloat(value);
    if (!isNaN(longitude)) {
      const newCoords: Coordinates = {
        latitude: localCoordinates?.latitude || 0,
        longitude,
      };
      if (isValidCoordinates(newCoords)) {
        setLocalCoordinates(newCoords);
        setValue(namePrefix, newCoords, { shouldValidate: true });
      }
    }
  };

  const handleReset = () => {
    setLocalCoordinates(null);
    setValue(namePrefix, null, { shouldValidate: true });
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <label className="text-sm font-medium">{label}</label>
          <p className="text-muted-foreground text-sm">{description}</p>
        </div>
        {localCoordinates && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="gap-2"
            disabled={disabled}
          >
            <RotateCcw className="h-4 w-4" />
            Reset
          </Button>
        )}
      </div>

      <MapComponent
        coordinates={localCoordinates}
        onCoordinatesChange={handleMapCoordinatesChange}
        interactive={!disabled}
        height="400px"
      />

      {/* Manual coordinate input */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <FormField
          control={control}
          name={`${namePrefix}.latitude`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Latitude</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="any"
                  min="-90"
                  max="90"
                  placeholder="e.g., 35.7219"
                  value={localCoordinates?.latitude ?? ""}
                  onChange={(e) => {
                    field.onChange(e);
                    handleLatitudeChange(e.target.value);
                  }}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`${namePrefix}.longitude`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Longitude</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  step="any"
                  min="-180"
                  max="180"
                  placeholder="e.g., 51.4231"
                  value={localCoordinates?.longitude ?? ""}
                  onChange={(e) => {
                    field.onChange(e);
                    handleLongitudeChange(e.target.value);
                  }}
                  disabled={disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}

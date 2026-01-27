/**
 * Geographic coordinates (longitude, latitude)
 */
export interface Coordinates {
  longitude: number;
  latitude: number;
}

/**
 * Default coordinates (Tehran, Iran)
 * Used when no coordinates are provided
 */
export const DEFAULT_COORDINATES: Coordinates = {
  longitude: 51.4231,
  latitude: 35.7219,
};

/**
 * Validates if coordinates are within valid ranges
 */
export function isValidCoordinates(
  coords: Coordinates | null | undefined
): boolean {
  if (!coords) return false;
  return (
    coords.longitude >= -180 &&
    coords.longitude <= 180 &&
    coords.latitude >= -90 &&
    coords.latitude <= 90
  );
}

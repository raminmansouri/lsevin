/**
 * Geographic coordinates (longitude, latitude)
 */
export interface Coordinates {
  longitude: number;
  latitude: number;
}

const TEHRAN: Coordinates = { longitude: 51.4231, latitude: 35.7219 };

const TIMEZONE_CITIES: Record<string, Coordinates> = {
  "Asia/Tehran": TEHRAN,
  "Europe/Istanbul": { longitude: 28.9784, latitude: 41.0082 },
  "Asia/Dubai": { longitude: 55.2708, latitude: 25.2048 },
  "Asia/Baghdad": { longitude: 44.3661, latitude: 33.3152 },
  "Asia/Baku": { longitude: 49.8671, latitude: 40.4093 },
  "Asia/Kabul": { longitude: 69.2075, latitude: 34.5553 },
  "Asia/Yerevan": { longitude: 44.4991, latitude: 40.1792 },
  "Asia/Tbilisi": { longitude: 44.8271, latitude: 41.7151 },
  "Asia/Riyadh": { longitude: 46.6753, latitude: 24.7136 },
  "Asia/Qatar": { longitude: 51.531, latitude: 25.2854 },
  "Asia/Kuwait": { longitude: 47.9774, latitude: 29.3759 },
  "Asia/Bahrain": { longitude: 50.586, latitude: 26.2285 },
  "Asia/Muscat": { longitude: 58.3829, latitude: 23.588 },
  "Europe/London": { longitude: -0.1276, latitude: 51.5072 },
  "Europe/Berlin": { longitude: 13.405, latitude: 52.52 },
  "Europe/Paris": { longitude: 2.3522, latitude: 48.8566 },
  "Europe/Amsterdam": { longitude: 4.9041, latitude: 52.3676 },
  "Europe/Stockholm": { longitude: 18.0686, latitude: 59.3293 },
  "Europe/Moscow": { longitude: 37.6173, latitude: 55.7558 },
  "America/New_York": { longitude: -74.006, latitude: 40.7128 },
  "America/Toronto": { longitude: -79.3832, latitude: 43.6532 },
  "America/Los_Angeles": { longitude: -118.2437, latitude: 34.0522 },
  "Australia/Sydney": { longitude: 151.2093, latitude: -33.8688 },
};

let browserPosition: Coordinates | null = null;

function timezoneCity(): Coordinates {
  try {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return TIMEZONE_CITIES[zone] ?? TEHRAN;
  } catch {
    return TEHRAN;
  }
}

function approximateUserCoordinates(): Coordinates {
  if (typeof window === "undefined") return TEHRAN;
  return browserPosition ?? timezoneCity();
}

if (typeof window !== "undefined" && "geolocation" in navigator && navigator.permissions) {
  navigator.permissions
    .query({ name: "geolocation" as PermissionName })
    .then((status) => {
      if (status.state !== "granted") return;
      navigator.geolocation.getCurrentPosition(
        (position) => {
          browserPosition = { longitude: position.coords.longitude, latitude: position.coords.latitude };
        },
        () => undefined,
        { maximumAge: 10 * 60 * 1000, timeout: 8000 }
      );
    })
    .catch(() => undefined);
}

export function rememberUserLocation(coordinates: Coordinates): void {
  browserPosition = coordinates;
}

export const DEFAULT_COORDINATES: Coordinates = {
  get longitude() {
    return approximateUserCoordinates().longitude;
  },
  get latitude() {
    return approximateUserCoordinates().latitude;
  },
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

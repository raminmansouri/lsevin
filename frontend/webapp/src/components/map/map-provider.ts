export const NESHAN_MAP_KEY =
  process.env.NEXT_PUBLIC_NESHAN_MAP_KEY ||
  process.env.NEXT_PUBLIC_NESHAN_API_KEY ||
  "";

export const NESHAN_SDK_STYLE_ID = "neshan-mapboxgl-sdk-css";
export const NESHAN_SDK_STYLE_HREF =
  "https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.5/index.css";
export const NESHAN_SDK_SCRIPT_SRC =
  "https://static.neshan.org/sdk/mapboxgl/v1.13.2/neshan-sdk/v1.1.5/index.js";

export type NeshanMapType =
  | "neshanVector"
  | "neshanVectorNight"
  | "neshanRaster"
  | "neshanRasterNight";

const NESHAN_MAP_TYPE_VALUES = new Set<NeshanMapType>([
  "neshanVector",
  "neshanVectorNight",
  "neshanRaster",
  "neshanRasterNight",
]);

export function getConfiguredNeshanMapType(): NeshanMapType {
  const configured = process.env.NEXT_PUBLIC_NESHAN_MAP_TYPE?.trim() as NeshanMapType | undefined;
  return configured && NESHAN_MAP_TYPE_VALUES.has(configured) ? configured : "neshanVector";
}

// ---------------------------------------------------------------------------
// Mapbox (international) — used for locations outside Iran. Neshan only serves
// Iranian tiles, so non-Iran points render on Mapbox GL instead.
// ---------------------------------------------------------------------------
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
export const MAPBOX_STYLE =
  process.env.NEXT_PUBLIC_MAPBOX_STYLE?.trim() || "mapbox://styles/mapbox/streets-v12";

export type MapProvider = "neshan" | "mapbox";

// Approximate bounding box of Iran (lat 24..40, lng 44..64).
export function isIranCoordinates(
  coords?: { latitude: number; longitude: number } | null,
): boolean {
  if (!coords) return false;
  const { latitude: lat, longitude: lng } = coords;
  return lat >= 24 && lat <= 40 && lng >= 44 && lng <= 64;
}

export function isIranCountryCode(code?: string | null): boolean {
  if (!code) return false;
  const c = code.trim().toLowerCase();
  return c === "ir" || c === "irn" || c === "iran" || c === "ایران";
}

// Neshan is temporarily deactivated — the whole app renders on Mapbox. To restore
// the Iran→Neshan / international→Mapbox split, set NEXT_PUBLIC_ENABLE_NESHAN=true
// (it's a build-time public env, so it requires a rebuild to take effect).
const NESHAN_ENABLED = process.env.NEXT_PUBLIC_ENABLE_NESHAN === "true";

// Decide which map engine to use for a given place. While Neshan is disabled this
// always returns "mapbox". With Neshan enabled: a known country code wins
// (IR -> Neshan); otherwise fall back to the Iran bounding box on the point; with
// neither, default to Neshan (the app's primary/Tehran default).
export function resolveMapProvider(input?: {
  countryCode?: string | null;
  coordinates?: { latitude: number; longitude: number } | null;
}): MapProvider {
  if (!NESHAN_ENABLED) return "mapbox";
  const code = input?.countryCode?.trim();
  if (code) return isIranCountryCode(code) ? "neshan" : "mapbox";
  if (input?.coordinates) return isIranCoordinates(input.coordinates) ? "neshan" : "mapbox";
  return "neshan";
}

// Builds a mapbox-gl-compatible Map for the chosen provider. Both Neshan
// (window.nmp_mapboxgl) and Mapbox GL share the same Map/Marker/Popup/easeTo
// API, so callers only differ in how the Map itself is constructed.
export function createMapInstance(
  sdk: any,
  provider: MapProvider,
  opts: { container: HTMLElement; center: [number, number]; zoom: number },
): any {
  if (provider === "mapbox") {
    if (MAPBOX_TOKEN) sdk.accessToken = MAPBOX_TOKEN;
    return new sdk.Map({
      container: opts.container,
      style: MAPBOX_STYLE,
      center: opts.center,
      zoom: opts.zoom,
      minZoom: 1,
      maxZoom: 21,
      accessToken: MAPBOX_TOKEN,
      attributionControl: true,
    });
  }

  const mapTypeName = getConfiguredNeshanMapType();
  const mapType = sdk.Map.mapTypes?.[mapTypeName] ?? sdk.Map.mapTypes?.neshanVector;
  return new sdk.Map({
    mapType,
    container: opts.container,
    zoom: opts.zoom,
    pitch: 0,
    center: opts.center,
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
}

// True when the chosen provider has the config it needs to render.
export function isProviderConfigured(provider: MapProvider): boolean {
  return provider === "mapbox" ? Boolean(MAPBOX_TOKEN) : Boolean(NESHAN_MAP_KEY);
}

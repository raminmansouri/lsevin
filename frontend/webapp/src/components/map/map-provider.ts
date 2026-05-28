export type SupportedMapProvider = "mapbox" | "neshan";

const MAP_PROVIDER_VALUES = new Set<SupportedMapProvider>(["mapbox", "neshan"]);

export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";
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

export function normalizeMapProvider(value?: string | null): SupportedMapProvider {
  const normalized = value?.trim().toLowerCase() as SupportedMapProvider | undefined;
  return normalized && MAP_PROVIDER_VALUES.has(normalized) ? normalized : "mapbox";
}

export function getConfiguredMapProvider(): SupportedMapProvider {
  return normalizeMapProvider(process.env.NEXT_PUBLIC_MAP_PROVIDER);
}

export function getConfiguredNeshanMapType(): NeshanMapType {
  const configured = process.env.NEXT_PUBLIC_NESHAN_MAP_TYPE?.trim() as NeshanMapType | undefined;
  return configured && NESHAN_MAP_TYPE_VALUES.has(configured) ? configured : "neshanVector";
}

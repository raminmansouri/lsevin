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

import { z } from "zod/v4";

function normalizeMediaPickerValue(value: unknown): string {
  if (typeof value === "string") return value.trim();

  if (Array.isArray(value)) {
    for (const item of value) {
      const normalized = normalizeMediaPickerValue(item);
      if (normalized) return normalized;
    }
    return "";
  }

  if (!value || typeof value !== "object") return "";

  const item = value as Record<string, unknown>;
  const directKeys = [
    "id",
    "mediaId",
    "media_id",
    "fileId",
    "file_id",
    "assetId",
    "asset_id",
    "storedName",
    "stored_name",
    "storageKey",
    "storage_key",
    "fileUrl",
    "file_url",
    "publicUrl",
    "public_url",
    "downloadUrl",
    "download_url",
    "previewUrl",
    "preview_url",
    "thumbnailUrl",
    "thumbnail_url",
    "url",
    "src",
    "href",
    "path",
    "value",
    "key",
  ];

  for (const key of directKeys) {
    const candidate = item[key];
    if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
  }

  const nestedKeys = [
    "media",
    "file",
    "asset",
    "selected",
    "item",
    "data",
    "record",
    "attachment",
  ];

  for (const key of nestedKeys) {
    const normalized = normalizeMediaPickerValue(item[key]);
    if (normalized) return normalized;
  }

  return "";
}

const nullableCoordinateSchema = z.preprocess((value) => {
  if (value === "" || value === undefined || value === null) return null;
  const normalized = typeof value === "string" ? value.replace("،", ".").replace(",", ".") : value;
  const numberValue = Number(normalized);
  return Number.isFinite(numberValue) ? numberValue : value;
}, z.number().nullable().optional());

export const PickedLocationMutationSchema = z.object({
  pickedLocationId: z.guid().optional().nullable(),
  locationId: z.guid(),
  image: z.preprocess(
    normalizeMediaPickerValue,
    z.string().trim().min(1, "Please pick an image.").max(500),
  ),
  latitude: nullableCoordinateSchema.refine(
    (value) => value === null || value === undefined || (value >= -90 && value <= 90),
    "Latitude must be between -90 and 90.",
  ),
  longitude: nullableCoordinateSchema.refine(
    (value) => value === null || value === undefined || (value >= -180 && value <= 180),
    "Longitude must be between -180 and 180.",
  ),
});

export const PickedLocationFormSchema = PickedLocationMutationSchema.extend({
  countryId: z.guid().nullable().optional(),
});

export const DeletePickedLocationSchema = z.object({
  pickedLocationId: z.guid(),
});

export type PickedLocationMutationInput = z.infer<typeof PickedLocationMutationSchema>;
export type PickedLocationFormInput = z.infer<typeof PickedLocationFormSchema>;
export type DeletePickedLocationInput = z.infer<typeof DeletePickedLocationSchema>;

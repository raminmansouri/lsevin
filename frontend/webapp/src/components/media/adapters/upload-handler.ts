"use client";

import { compressImageToWebp } from "@/lib/image/compress-image";

import { createMediaRecord } from "../client/api";
import {
  extractClientMediaMetadata,
  getExtensionFromName,
  getMediaTypeFromMime,
} from "../client/file-metadata";
import {
  CreateMediaInput,
  UploadHandlerInput,
  UploadHandlerResult,
  UploadMediaHandler,
} from "../types";

/**
 * Default upload implementation.
 *
 * It uses the included local storage route:
 *   POST /api/admin/media/storage
 *
 * Then the caller can persist the DB record by calling `persistUploadedMedia`.
 *
 * To use your existing server action instead:
 * - replace `defaultUploadHandler`
 * - or pass a custom `uploadHandler` prop to MediaManager / picker fields
 */
export const defaultUploadHandler: UploadMediaHandler = async ({
  file,
  onProgress,
}: UploadHandlerInput): Promise<UploadHandlerResult> => {
  // Convert raster images to WebP under the size budget before upload (bandwidth
  // layer). Non-images / already-optimized files pass through untouched.
  const uploadFile = await compressImageToWebp(file);

  const formData = new FormData();
  formData.append("file", uploadFile);

  return new Promise<UploadHandlerResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media/storage");

    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) {
        onProgress?.(null);
        return;
      }

      const percent = Math.min(
        100,
        Math.round((event.loaded / event.total) * 100)
      );
      onProgress?.(percent);
    };

    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.onload = () => {
      try {
        const payload = JSON.parse(xhr.responseText || "{}");
        if (xhr.status >= 400) {
          reject(new Error(payload.error || "Upload failed."));
          return;
        }
        resolve(payload as UploadHandlerResult);
      } catch {
        reject(new Error("Upload completed but the response was invalid."));
      }
    };

    xhr.send(formData);
  });
};

export async function persistUploadedMedia(
  file: File,
  uploadResult: UploadHandlerResult,
  options?: {
    titleTranslations?: Record<string, string>;
    descriptionTranslations?: Record<string, string>;
    altTranslations?: Record<string, string>;
    createdBy?: string | null;
    isPublic?: boolean;
  }
) {
  const extracted = await extractClientMediaMetadata(file);

  const payload: CreateMediaInput = {
    titleTranslations: options?.titleTranslations,
    descriptionTranslations: options?.descriptionTranslations,
    altTranslations: options?.altTranslations,
    originalName: file.name,
    storedName: uploadResult.storedName || file.name,
    fileUrl: uploadResult.fileUrl,
    storagePath: uploadResult.storagePath ?? null,
    storageKey: uploadResult.storageKey ?? null,
    mimeType: file.type || "application/octet-stream",
    extension: getExtensionFromName(file.name),
    mediaType: getMediaTypeFromMime(file.type || ""),
    fileSize: file.size,
    width: extracted.width,
    height: extracted.height,
    durationSeconds: extracted.durationSeconds,
    createdBy: options?.createdBy ?? null,
    isPublic: options?.isPublic ?? true,
  };

  return createMediaRecord(payload);
}

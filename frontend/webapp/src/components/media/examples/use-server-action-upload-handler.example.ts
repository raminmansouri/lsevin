"use client";

import { defaultUploadHandler } from "../adapters/upload-handler";
import { UploadMediaHandler } from "../types";

/**
 * Replace this with your real safe-action wrapper.
 *
 * Why this file exists:
 * - your upload backend is project-specific
 * - the rest of the media manager should stay generic
 * - you only need to update one adapter to switch transport
 *
 * Example shape:
 *
 * export const uploadMediaUsingServerActionExample: UploadMediaHandler = async ({
 *   file,
 *   titleTranslations,
 *   descriptionTranslations,
 *   altTranslations,
 *   onProgress,
 * }) => {
 *   onProgress?.(15);
 *
 *   const result = await yourSafeAction({
 *     file,
 *     title: titleTranslations,
 *     description: descriptionTranslations,
 *     alt: altTranslations,
 *   });
 *
 *   if (result?.error) {
 *     throw new Error(result.error.title || "Upload failed.");
 *   }
 *
 *   onProgress?.(100);
 *
 *   return {
 *     fileUrl: result.data.url,
 *     storedName: file.name,
 *     storagePath: result.data.url,
 *     storageKey: result.data.url,
 *   };
 * };
 *
 * For now this example falls back to the included local route uploader
 * so the module remains usable immediately.
 */
export const uploadMediaUsingServerActionExample: UploadMediaHandler =
  defaultUploadHandler;

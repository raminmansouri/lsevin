import type { UploadWithProgress } from "../types";

/**
 * Replace the internals of this function with your existing safe action call.
 *
 * Yes: calling a server action from a client component event handler works
 * without a full page refresh, so it behaves like AJAX from the user perspective.
 *
 * Caveat:
 * byte-accurate browser upload progress is usually not available through server actions.
 * If you need exact progress, use /api/admin/media/storage instead.
 */
export const uploadWithServerAction: UploadWithProgress = async ({
  file,
  onProgress,
}) => {
  onProgress?.(15);

  /**
   * Example pseudo shape only:
   *
   * const result = await updateProviderGalleryItem({
   *   title: {},
   *   description: {},
   *   file,
   * });
   *
   * if (result?.error) {
   *   throw new Error(result.error.title ?? "Upload failed");
   * }
   *
   * onProgress?.(100);
   *
   * return {
   *   id: result.data?.id,
   *   fileUrl: result.data?.url ?? "",
   *   originalName: file.name,
   *   mimeType: file.type,
   *   mediaType: file.type.startsWith("image/")
   *     ? "image"
   *     : file.type.startsWith("video/")
   *     ? "video"
   *     : "file",
   *   fileSize: file.size,
   * };
   */

  throw new Error("Replace upload-with-server-action.example.ts with your real action adapter.");
};

/**
 * Which video containers may enter the media library.
 *
 * Browsers do not play QuickTime. Chrome on Android returns "" from
 * `canPlayType("video/quicktime")`, and what it does with a `.mov` in a
 * `<video>` is worse than refusing it: the file downloads in full and then
 * renders nothing. A 2.2 MB `.mov` on a sponsored home-page slide was 66% of
 * that page's total weight and could never have been watched.
 *
 * The upload path has no transcoder — images go through ImageSharp on the .NET
 * side and are compressed to WebP in the browser first, but video is stored
 * exactly as uploaded. So the only place to keep an unplayable file out of the
 * system is the door. Uploaders are told to convert to MP4 (H.264) rather than
 * having it silently accepted and silently fail for every visitor.
 *
 * Shared by the client upload handler (immediate feedback) and the storage route
 * (enforcement) — the client is the convenience layer, never the trusted one.
 */

/** Containers every current browser can decode. */
export const WEB_PLAYABLE_VIDEO_EXTENSIONS = ["mp4", "m4v", "webm", "ogv", "ogg"] as const;

/**
 * Containers that reliably fail in a browser. Listed explicitly rather than
 * inferred, so an unrecognized extension is allowed through instead of being
 * rejected on a guess.
 */
export const WEB_UNPLAYABLE_VIDEO_EXTENSIONS = [
  "mov",
  "qt",
  "avi",
  "wmv",
  "mkv",
  "flv",
  "mpg",
  "mpeg",
  "3gp",
  "m2ts",
  "ts",
] as const;

const UNPLAYABLE_EXTENSIONS = new Set<string>(WEB_UNPLAYABLE_VIDEO_EXTENSIONS);
const UNPLAYABLE_MIME_TYPES = new Set([
  "video/quicktime",
  "video/x-msvideo",
  "video/x-ms-wmv",
  "video/x-matroska",
  "video/x-flv",
  "video/mpeg",
  "video/3gpp",
  "video/mp2t",
]);

export function getFileExtension(fileName: string): string | null {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return null;
  return fileName.slice(lastDot + 1).toLowerCase();
}

export type VideoUploadRejection = {
  /** Safe to surface directly to the person uploading. */
  message: string;
  extension: string | null;
  mimeType: string | null;
};

/**
 * Returns a rejection when this file is a video a browser cannot play, or null
 * when it is fine (including for every non-video file, which this ignores).
 */
export function rejectUnplayableVideo(file: {
  name: string;
  type?: string | null;
}): VideoUploadRejection | null {
  const mimeType = (file.type || "").toLowerCase();
  const extension = getFileExtension(file.name);

  const looksLikeVideo = mimeType.startsWith("video/") || UNPLAYABLE_EXTENSIONS.has(extension ?? "");
  if (!looksLikeVideo) return null;

  const unplayable =
    UNPLAYABLE_MIME_TYPES.has(mimeType) || UNPLAYABLE_EXTENSIONS.has(extension ?? "");
  if (!unplayable) return null;

  const label = extension ? `.${extension}` : mimeType;

  return {
    message:
      `${label} video cannot be played in a browser and would download in full without ever ` +
      `showing. Convert it to MP4 (H.264) or WebM and upload again.`,
    extension,
    mimeType: mimeType || null,
  };
}

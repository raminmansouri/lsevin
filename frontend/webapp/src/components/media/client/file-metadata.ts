import { MediaType } from "../types";

export function getMediaTypeFromMime(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  return "file";
}

export function getExtensionFromName(fileName: string): string | null {
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot === -1) return null;
  return fileName.slice(lastDot + 1).toLowerCase();
}

export async function extractClientMediaMetadata(file: File): Promise<{
  width: number | null;
  height: number | null;
  durationSeconds: number | null;
}> {
  const mediaType = getMediaTypeFromMime(file.type);

  if (mediaType === "image") {
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        resolve({
          width: image.naturalWidth || null,
          height: image.naturalHeight || null,
          durationSeconds: null,
        });
        URL.revokeObjectURL(objectUrl);
      };

      image.onerror = () => {
        resolve({ width: null, height: null, durationSeconds: null });
        URL.revokeObjectURL(objectUrl);
      };

      image.src = objectUrl;
    });
  }

  if (mediaType === "video") {
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const video = document.createElement("video");
      video.preload = "metadata";

      const done = (payload: {
        width: number | null;
        height: number | null;
        durationSeconds: number | null;
      }) => {
        URL.revokeObjectURL(objectUrl);
        resolve(payload);
      };

      video.onloadedmetadata = () => {
        done({
          width: video.videoWidth || null,
          height: video.videoHeight || null,
          durationSeconds: Number.isFinite(video.duration)
            ? Math.round(video.duration)
            : null,
        });
      };

      video.onerror = () => {
        done({ width: null, height: null, durationSeconds: null });
      };

      video.src = objectUrl;
    });
  }

  return {
    width: null,
    height: null,
    durationSeconds: null,
  };
}

export function formatBytes(size: number) {
  if (!Number.isFinite(size) || size <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const power = Math.min(Math.floor(Math.log(size) / Math.log(1024)), units.length - 1);
  const value = size / 1024 ** power;
  return `${value.toFixed(value >= 10 || power === 0 ? 0 : 1)} ${units[power]}`;
}

export function formatDuration(seconds: number | null | undefined) {
  if (!seconds || seconds <= 0) return "";
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${String(remaining).padStart(2, "0")}`;
}

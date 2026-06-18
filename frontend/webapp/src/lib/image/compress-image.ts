"use client";

/**
 * Client-side image compression — converts raster images to WebP under a size
 * budget *before* upload, to save bandwidth on slow/mobile connections.
 *
 * This is the bandwidth layer only. The server is still the enforced layer:
 * never trust the client. The server pipeline re-checks and (re)encodes if the
 * received file isn't already WebP ≤ budget within the max dimension — see
 * IMAGE_OPTIMIZATION.md.
 *
 * Dependency-free (Canvas + createImageBitmap), so it adds nothing to the
 * bundle and works without a network install. Canvas re-encoding also strips
 * EXIF/metadata as a side effect.
 *
 * Idempotency (Phase 2 "optimize exactly once", client side): if the input is
 * already WebP, already ≤ maxBytes, and within maxDimension, it is returned
 * untouched — a WebP that's already small is never re-encoded.
 */
export interface CompressImageOptions {
  /** Longest-edge cap in px. Larger images are scaled down. */
  maxDimension?: number;
  /** Hard size budget in bytes. */
  maxBytes?: number;
  /** Starting WebP quality (0–1). */
  startQuality?: number;
  /** Lowest WebP quality before falling back to shrinking dimensions. */
  minQuality?: number;
}

const DEFAULTS: Required<CompressImageOptions> = {
  maxDimension: 1920,
  maxBytes: 200 * 1024,
  startQuality: 0.82,
  minQuality: 0.4,
};

// Vector / animated formats we must not flatten to a single WebP frame.
const SKIP_TYPES = new Set(["image/svg+xml", "image/gif"]);

/**
 * Returns a WebP `File` ≤ the size budget, or the original `file` unchanged if
 * it's not a raster image, is already optimized, or compression isn't possible
 * (an upload must never be blocked by a compression failure).
 */
export async function compressImageToWebp(
  file: File,
  options: CompressImageOptions = {}
): Promise<File> {
  const opts = { ...DEFAULTS, ...options };

  // Only touch raster images; leave PDFs, zips, SVG, animated GIFs, etc. alone.
  if (!file.type.startsWith("image/") || SKIP_TYPES.has(file.type)) return file;

  // Guard non-browser / unsupported environments.
  if (
    typeof document === "undefined" ||
    typeof createImageBitmap === "undefined"
  ) {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file);

    // --- Defensive optimize-once guard (client mirror of the server guard) ---
    if (
      file.type === "image/webp" &&
      file.size <= opts.maxBytes &&
      Math.max(bitmap.width, bitmap.height) <= opts.maxDimension
    ) {
      bitmap.close?.();
      return file;
    }

    const scale = Math.min(
      1,
      opts.maxDimension / Math.max(bitmap.width, bitmap.height)
    );
    let targetW = Math.max(1, Math.round(bitmap.width * scale));
    let targetH = Math.max(1, Math.round(bitmap.height * scale));

    // 1) Lower quality until under budget.
    let quality = opts.startQuality;
    let blob = await drawToWebp(bitmap, targetW, targetH, quality);
    while (blob && blob.size > opts.maxBytes && quality > opts.minQuality) {
      quality = Math.max(opts.minQuality, Math.round((quality - 0.1) * 100) / 100);
      blob = await drawToWebp(bitmap, targetW, targetH, quality);
    }

    // 2) Still over budget at min quality → shrink dimensions and retry.
    let guard = 0;
    while (
      blob &&
      blob.size > opts.maxBytes &&
      Math.max(targetW, targetH) > 320 &&
      guard < 6
    ) {
      targetW = Math.max(1, Math.round(targetW * 0.8));
      targetH = Math.max(1, Math.round(targetH * 0.8));
      blob = await drawToWebp(bitmap, targetW, targetH, opts.minQuality);
      guard += 1;
    }

    bitmap.close?.();

    if (!blob) return file;

    // If re-encoding didn't actually help (e.g. tiny already-WebP source), keep
    // whichever is smaller — never make a file bigger.
    if (blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^./\\]+$/, "");
    return new File([blob], `${baseName}.webp`, {
      type: "image/webp",
      lastModified: Date.now(),
    });
  } catch {
    // Decode/encode failed (corrupt or unsupported codec) → upload as-is and let
    // the server-side enforced layer handle it.
    return file;
  }
}

function drawToWebp(
  bitmap: ImageBitmap,
  width: number,
  height: number,
  quality: number
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return Promise.resolve(null);
  ctx.drawImage(bitmap, 0, 0, width, height);
  return new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/webp", quality)
  );
}

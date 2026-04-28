import type {
  MediaItem,
  MediaListResponse,
  MediaType,
  UploadMediaResult,
  UploadWithProgress,
} from "./types";
import { isLikelyUuid } from "./utils";

function buildListUrl(params: {
  search?: string;
  page?: number;
  pageSize?: number;
  mediaType?: MediaType | "all";
}) {
  const url = new URL("/api/admin/media", window.location.origin);

  if (params.search) url.searchParams.set("search", params.search);
  if (params.page) url.searchParams.set("page", String(params.page));
  if (params.pageSize) url.searchParams.set("pageSize", String(params.pageSize));
  if (params.mediaType && params.mediaType !== "all") {
    url.searchParams.set("mediaType", params.mediaType);
  }

  return url.toString();
}

async function readError(response: Response, fallback: string) {
  try {
    const payload = await response.json();
    return payload?.error || payload?.message || fallback;
  } catch {
    return fallback;
  }
}

function resolveMediaType(mimeType?: string | null): MediaType {
  if (mimeType?.startsWith("image/")) return "image";
  if (mimeType?.startsWith("video/")) return "video";
  return "file";
}

function normalizeUploadResponse(file: File, payload: any): UploadMediaResult {
  const fileUrl = payload?.fileUrl ?? payload?.url ?? payload?.data ?? payload?.path;

  if (!fileUrl || typeof fileUrl !== "string") {
    throw new Error("Upload completed, but the server did not return a fileUrl.");
  }

  return {
    id: payload?.id,
    fileUrl,
    originalName: payload?.originalName ?? file.name,
    storedName: payload?.storedName ?? payload?.storageKey ?? file.name,
    mimeType: payload?.mimeType ?? file.type ?? "application/octet-stream",
    mediaType: payload?.mediaType ?? resolveMediaType(file.type),
    fileSize: payload?.fileSize ?? file.size,
    width: payload?.width ?? null,
    height: payload?.height ?? null,
    durationSeconds: payload?.durationSeconds ?? null,
  };
}

export async function listMedia(params: {
  search?: string;
  page?: number;
  pageSize?: number;
  mediaType?: MediaType | "all";
}): Promise<MediaListResponse> {
  const response = await fetch(buildListUrl(params), {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Failed to load media."));
  }

  return response.json();
}

export async function getMediaById(id: string): Promise<MediaItem> {
  const response = await fetch(`/api/admin/media/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readError(response, `Failed to load media ${id}.`));
  }

  return response.json();
}

export async function getMediaByUrls(fileUrls: string[]): Promise<MediaItem[]> {
  const uniqueUrls = Array.from(new Set(fileUrls.map((item) => item.trim()).filter(Boolean)));
  if (!uniqueUrls.length) return [];

  const response = await fetch("/api/admin/media/by-urls", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fileUrls: uniqueUrls }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Failed to fetch media by URLs."));
  }

  return response.json();
}

export async function getMediaByIds(ids: string[]): Promise<MediaItem[]> {
  const uniqueIds = Array.from(new Set(ids.map((id) => id.trim()).filter(Boolean)));
  if (!uniqueIds.length) return [];

  const results = await Promise.allSettled(uniqueIds.map((id) => getMediaById(id)));

  return results
    .filter((result): result is PromiseFulfilledResult<MediaItem> => result.status === "fulfilled")
    .map((result) => result.value);
}

// Supports new fields that store media ids and older fields that may still contain file URLs.
export async function getMediaByReferences(references: string[]): Promise<MediaItem[]> {
  const uniqueReferences = Array.from(
    new Set(references.map((reference) => reference.trim()).filter(Boolean))
  );

  const ids = uniqueReferences.filter(isLikelyUuid);
  const urls = uniqueReferences.filter((reference) => !isLikelyUuid(reference));

  const [byId, byUrl] = await Promise.all([getMediaByIds(ids), getMediaByUrls(urls)]);
  const byReference = new Map<string, MediaItem>();

  for (const item of [...byId, ...byUrl]) {
    byReference.set(item.id, item);
    byReference.set(item.fileUrl, item);
  }

  return uniqueReferences
    .map((reference) => byReference.get(reference))
    .filter((item): item is MediaItem => Boolean(item));
}

export async function deleteMediaById(id: string): Promise<boolean> {
  const response = await fetch(`/api/admin/media/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await readError(response, "Failed to delete media."));
  }

  const payload = await response.json();
  return Boolean(payload?.success ?? true);
}

export const uploadViaStorageRoute: UploadWithProgress = async ({
  file,
  onProgress,
}): Promise<UploadMediaResult> => {
  const formData = new FormData();
  formData.append("file", file);

  return new Promise<UploadMediaResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/admin/media/storage");

    xhr.upload.addEventListener("progress", (event) => {
      if (!event.lengthComputable || !onProgress) return;
      const progress = Math.round((event.loaded / event.total) * 100);
      onProgress(progress);
    });

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        try {
          const payload = JSON.parse(xhr.responseText);
          reject(new Error(payload?.error || payload?.message || "Upload failed."));
        } catch {
          reject(new Error("Upload failed."));
        }
        return;
      }

      try {
        const payload = JSON.parse(xhr.responseText);
        resolve(normalizeUploadResponse(file, payload));
      } catch (error) {
        reject(error instanceof Error ? error : new Error("Invalid upload response."));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.send(formData);
  });
};

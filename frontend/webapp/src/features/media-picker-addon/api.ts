import type { MediaItem, MediaListResponse, MediaType, UploadMediaResult, UploadWithProgress } from "./types";

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
    throw new Error("Failed to load media.");
  }

  return response.json();
}

export async function getMediaById(id: string): Promise<MediaItem> {
  const response = await fetch(`/api/admin/media/${id}`, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Failed to load media ${id}.`);
  }

  return response.json();
}

export async function getMediaByIds(ids: string[]): Promise<MediaItem[]> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (!uniqueIds.length) return [];

  const results = await Promise.allSettled(uniqueIds.map((id) => getMediaById(id)));

  return results
    .filter((result): result is PromiseFulfilledResult<MediaItem> => result.status === "fulfilled")
    .map((result) => result.value);
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
        reject(new Error("Upload failed."));
        return;
      }

      try {
        const payload = JSON.parse(xhr.responseText);
        resolve(payload);
      } catch {
        reject(new Error("Invalid upload response."));
      }
    };

    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.send(formData);
  });
};

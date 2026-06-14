import {
  CreateMediaInput,
  MediaItem,
  MediaListParams,
  MediaListResponse,
  UpdateMediaInput,
} from "../types";

function buildQuery(params: MediaListParams) {
  const query = new URLSearchParams();

  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  if (params.search?.trim()) query.set("search", params.search.trim());
  if (params.mediaType) query.set("mediaType", params.mediaType);
  if (params.mimeType?.trim()) query.set("mimeType", params.mimeType.trim());
  if (params.sort) query.set("sort", params.sort);
  if (params.locale) query.set("locale", params.locale);

  return query.toString();
}

async function parseJson<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      data && typeof data === "object" && "error" in data
        ? String((data as { error: unknown }).error)
        : `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data as T;
}

export async function fetchMediaList(
  params: MediaListParams
): Promise<MediaListResponse> {
  const query = buildQuery(params);
  const response = await fetch(`/api/admin/media?${query}`, {
    method: "GET",
    cache: "no-store",
  });

  return parseJson<MediaListResponse>(response);
}

export async function createMediaRecord(
  input: CreateMediaInput
): Promise<MediaItem> {
  const response = await fetch("/api/admin/media", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseJson<MediaItem>(response);
}

export async function bulkDeleteMediaRecords(ids: string[]): Promise<{ deleted: number }> {
  const response = await fetch("/api/admin/media", {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ids }),
  });

  return parseJson<{ deleted: number }>(response);
}

export async function updateMediaRecord(
  id: string,
  input: UpdateMediaInput
): Promise<MediaItem> {
  const response = await fetch(`/api/admin/media/${id}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });

  return parseJson<MediaItem>(response);
}

export async function deleteMediaRecord(
  id: string
): Promise<{ success: boolean }> {
  const response = await fetch(`/api/admin/media/${id}`, {
    method: "DELETE",
  });

  return parseJson<{ success: boolean }>(response);
}

import { NextRequest, NextResponse } from "next/server";

import sql from "@/config/database/db";
import type { MediaItem } from "@/features/media-picker-addon";
import { requireApiUser } from "@/lib/auth/api-guard";

type MediaRow = {
  id: string;
  title_translations: Record<string, string> | null;
  description_translations: Record<string, string> | null;
  alt_translations: Record<string, string> | null;
  original_name: string;
  stored_name: string | null;
  file_url: string;
  storage_path: string | null;
  mime_type: string;
  extension: string | null;
  media_type: "image" | "video" | "file";
  file_size: number | string | null;
  width: number | null;
  height: number | null;
  duration_seconds: number | null;
  create_date: string | Date | null;
  last_modified_date: string | Date | null;
  is_public: boolean | null;
};

function dateToString(value: string | Date | null) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function expandReference(reference: string) {
  const trimmed = reference.trim();
  const values = new Set<string>();

  if (!trimmed) return [];

  values.add(trimmed);

  try {
    values.add(decodeURIComponent(trimmed));
  } catch {
    // keep original only
  }

  if (trimmed.startsWith("/")) {
    values.add(trimmed.replace(/^\/+/, ""));
  }

  const filesBaseUrl = process.env.NEXT_PUBLIC_FILES_URL?.replace(/\/+$/, "");
  if (filesBaseUrl && trimmed.startsWith(filesBaseUrl)) {
    values.add(trimmed.slice(filesBaseUrl.length).replace(/^\/+/, ""));
    values.add(trimmed.slice(filesBaseUrl.length));
  }

  return Array.from(values).filter(Boolean);
}

function toMediaItem(row: MediaRow): MediaItem {
  return {
    id: row.id,
    titleTranslations: row.title_translations ?? {},
    descriptionTranslations: row.description_translations ?? {},
    altTranslations: row.alt_translations ?? {},
    originalName: row.original_name,
    storedName: row.stored_name,
    fileUrl: row.file_url,
    storagePath: row.storage_path,
    mimeType: row.mime_type,
    extension: row.extension,
    mediaType: row.media_type,
    fileSize: Number(row.file_size ?? 0),
    width: row.width,
    height: row.height,
    durationSeconds: row.duration_seconds,
    createDate: dateToString(row.create_date),
    lastModifiedDate: dateToString(row.last_modified_date),
    isPublic: row.is_public,
  };
}

export async function POST(request: NextRequest) {
  try {
    const auth = await requireApiUser();
    if (auth instanceof NextResponse) return auth;

    const body = (await request.json()) as { fileUrls?: string[] };
    const references = Array.isArray(body.fileUrls) ? body.fileUrls : [];
    const candidates = Array.from(new Set(references.flatMap(expandReference)));

    if (!candidates.length) {
      return NextResponse.json([]);
    }

    const rows = await sql<MediaRow[]>`
      select
        id::text,
        title_translations,
        description_translations,
        alt_translations,
        original_name,
        stored_name,
        file_url,
        storage_path,
        mime_type,
        extension,
        media_type,
        file_size,
        width,
        height,
        duration_seconds,
        create_date,
        last_modified_date,
        is_public
      from media.media_library
      where id::text in ${sql(candidates)}
         or file_url in ${sql(candidates)}
      order by create_date desc
    `;

    const items = rows.map(toMediaItem);
    const byReference = new Map<string, MediaItem>();

    for (const item of items) {
      byReference.set(item.id, item);
      for (const variant of expandReference(item.fileUrl)) {
        byReference.set(variant, item);
      }
    }

    const ordered = references
      .map((reference) => expandReference(reference).map((variant) => byReference.get(variant)).find(Boolean))
      .filter((item): item is MediaItem => Boolean(item));

    return NextResponse.json(ordered);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch media by URLs.",
      },
      { status: 500 }
    );
  }
}

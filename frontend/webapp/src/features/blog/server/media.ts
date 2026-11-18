import "server-only";

import sql from "@/config/database/db";

import type { ResolvedMedia } from "../types";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/iu;

/**
 * Same rule as the rest of the site (absolute URLs pass through, stored keys resolve against the
 * files host), read at call time so importing this module never requires every NEXT_PUBLIC_* var.
 */
export function mediaUrl(value: string | null | undefined): string | null {
  const normalized = (value ?? "").trim();
  if (!normalized) return null;
  if (/^https?:\/\//iu.test(normalized)) return normalized;
  const base = (process.env.NEXT_PUBLIC_FILES_URL ?? "").replace(/\/+$/u, "");
  const path = normalized.replace(/^\/+/u, "");
  return base ? `${base}/${path}` : `/${path}`;
}

type MediaRow = {
  id: string;
  fileUrl: string | null;
  mimeType: string | null;
  width: number | null;
  height: number | null;
  durationSeconds: number | string | null;
  altTranslations: unknown;
};

const asTranslations = (value: unknown): Record<string, string> =>
  value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, string>) : {};

/**
 * Resolves media references (library ids, or file URLs/keys stored directly) to URLs.
 * Unknown ids are simply absent from the result: a deleted file must not break the page.
 */
export async function resolveMedia(refs: readonly string[]): Promise<Record<string, ResolvedMedia>> {
  const unique = [...new Set(refs.filter(Boolean))];
  const result: Record<string, ResolvedMedia> = {};
  const ids = unique.filter((ref) => GUID.test(ref));

  for (const ref of unique) {
    if (GUID.test(ref)) continue;
    const url = mediaUrl(ref);
    if (url) result[ref] = { id: ref, url, mimeType: "", width: null, height: null, durationSeconds: null, alt: {} };
  }
  if (!ids.length) return result;

  const rows = await sql<MediaRow[]>`
    select
      m.id::text as id,
      m.file_url as "fileUrl",
      m.mime_type as "mimeType",
      m.width,
      m.height,
      m.duration_seconds as "durationSeconds",
      m.alt_translations as "altTranslations"
    from media.media_library m
    where m.id::text in ${sql(ids)}
  `;
  for (const row of rows) {
    const url = mediaUrl(row.fileUrl);
    if (!url) continue;
    result[row.id] = {
      id: row.id,
      url,
      mimeType: row.mimeType ?? "",
      width: row.width ?? null,
      height: row.height ?? null,
      durationSeconds: row.durationSeconds === null || row.durationSeconds === undefined ? null : Number(row.durationSeconds),
      alt: asTranslations(row.altTranslations),
    };
  }
  return result;
}

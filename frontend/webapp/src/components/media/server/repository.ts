import path from "node:path";
import { promises as fs } from "node:fs";

import { createEmptyLocalizedContent, normalizeLocalizedFields } from "../localized";
import {
  CreateMediaInput,
  MediaItem,
  MediaListParams,
  MediaListResponse,
  MediaSort,
  UpdateMediaInput,
} from "../types";
import { MediaSqlClient, mediaSql } from "./db";

function mapRow(row: Record<string, any>): MediaItem {
  return {
    id: row.id,
    titleTranslations: normalizeLocalizedFields(row.titleTranslations),
    descriptionTranslations: normalizeLocalizedFields(row.descriptionTranslations),
    altTranslations: normalizeLocalizedFields(row.altTranslations),
    originalName: row.originalName,
    storedName: row.storedName,
    fileUrl: row.fileUrl,
    storagePath: row.storagePath,
    storageKey: row.storageKey,
    mimeType: row.mimeType,
    extension: row.extension,
    mediaType: row.mediaType,
    fileSize: Number(row.fileSize ?? 0),
    width: row.width === null ? null : Number(row.width),
    height: row.height === null ? null : Number(row.height),
    durationSeconds:
      row.durationSeconds === null ? null : Number(row.durationSeconds),
    createdBy: row.createdBy,
    isPublic: Boolean(row.isPublic),
    createDate: row.createDate instanceof Date ? row.createDate.toISOString() : String(row.createDate),
    lastModifiedDate:
      row.lastModifiedDate instanceof Date
        ? row.lastModifiedDate.toISOString()
        : String(row.lastModifiedDate),
  };
}

function normalizeCreateInput(input: CreateMediaInput): CreateMediaInput {
  return {
    ...input,
    titleTranslations: normalizeLocalizedFields(
      input.titleTranslations ?? createEmptyLocalizedContent()
    ),
    descriptionTranslations: normalizeLocalizedFields(
      input.descriptionTranslations ?? createEmptyLocalizedContent()
    ),
    altTranslations: normalizeLocalizedFields(
      input.altTranslations ?? createEmptyLocalizedContent()
    ),
    storagePath: input.storagePath ?? null,
    storageKey: input.storageKey ?? null,
    extension: input.extension ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    durationSeconds: input.durationSeconds ?? null,
    createdBy: input.createdBy ?? null,
    isPublic: input.isPublic ?? true,
  };
}

function normalizeUpdateInput(input: UpdateMediaInput): UpdateMediaInput {
  const out: UpdateMediaInput = { ...input };

  if ("titleTranslations" in out) {
    out.titleTranslations = normalizeLocalizedFields(
      out.titleTranslations ?? createEmptyLocalizedContent()
    );
  }

  if ("descriptionTranslations" in out) {
    out.descriptionTranslations = normalizeLocalizedFields(
      out.descriptionTranslations ?? createEmptyLocalizedContent()
    );
  }

  if ("altTranslations" in out) {
    out.altTranslations = normalizeLocalizedFields(
      out.altTranslations ?? createEmptyLocalizedContent()
    );
  }

  return out;
}

function getSortFragment(sql: MediaSqlClient, sort: MediaSort, locale: string) {
  switch (sort) {
    case "oldest":
      return sql`m.create_date asc, m.original_name asc`;
    case "title":
      return sql`coalesce(nullif(m.title_translations ->> ${locale}, ''), m.original_name) asc, m.create_date desc`;
    case "filename":
      return sql`m.original_name asc, m.create_date desc`;
    case "newest":
    default:
      return sql`m.create_date desc, m.original_name asc`;
  }
}

function buildFilters(
  sql: MediaSqlClient,
  params: MediaListParams
) {
  const clauses: any[] = [sql`1 = 1`];

  if (params.search?.trim()) {
    const pattern = `%${params.search.trim()}%`;
    clauses.push(sql`
      (
        m.original_name ilike ${pattern}
        or m.stored_name ilike ${pattern}
        or m.file_url ilike ${pattern}
        or exists (
          select 1
          from jsonb_each_text(coalesce(m.title_translations, '{}'::jsonb)) as title_entry
          where title_entry.value ilike ${pattern}
        )
        or exists (
          select 1
          from jsonb_each_text(coalesce(m.description_translations, '{}'::jsonb)) as description_entry
          where description_entry.value ilike ${pattern}
        )
      )
    `);
  }

  if (params.mediaType && params.mediaType !== "all") {
    clauses.push(sql`m.media_type = ${params.mediaType}`);
  }

  if (params.mimeType?.trim()) {
    clauses.push(sql`m.mime_type ilike ${params.mimeType.trim()}`);
  }

  return clauses;
}

function joinClauses(sql: MediaSqlClient, clauses: any[]) {
  return clauses.reduce((acc, clause, index) => {
    if (index === 0) return sql`${clause}`;
    return sql`${acc} and ${clause}`;
  }, sql``);
}

export async function listMedia(
  params: MediaListParams,
  sql: MediaSqlClient = mediaSql
): Promise<MediaListResponse> {
  const page = Math.max(1, Number(params.page ?? 1));
  const pageSize = Math.min(60, Math.max(1, Number(params.pageSize ?? 24)));
  const offset = (page - 1) * pageSize;
  const locale = params.locale || "en";
  const sort = params.sort || "newest";

  const filters = buildFilters(sql, params);
  const whereFragment = joinClauses(sql, filters);
  const orderFragment = getSortFragment(sql, sort, locale);

  const [items, countRows] = await Promise.all([
    sql`
      select
        m.id as "id",
        m.title_translations as "titleTranslations",
        m.description_translations as "descriptionTranslations",
        m.alt_translations as "altTranslations",
        m.original_name as "originalName",
        m.stored_name as "storedName",
        m.file_url as "fileUrl",
        m.storage_path as "storagePath",
        m.storage_key as "storageKey",
        m.mime_type as "mimeType",
        m.extension as "extension",
        m.media_type as "mediaType",
        m.file_size as "fileSize",
        m.width as "width",
        m.height as "height",
        m.duration_seconds as "durationSeconds",
        m.created_by as "createdBy",
        m.is_public as "isPublic",
        m.create_date as "createDate",
        m.last_modified_date as "lastModifiedDate"
      from media.media_library m
      where ${whereFragment}
      order by ${orderFragment}
      limit ${pageSize}
      offset ${offset}
    `,
    sql`
      select count(*)::int as "count"
      from media.media_library m
      where ${whereFragment}
    `,
  ]);

  const total = Number(countRows[0]?.count ?? 0);

  return {
    items: items.map(mapRow),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getMediaById(
  id: string,
  sql: MediaSqlClient = mediaSql
): Promise<MediaItem | null> {
  const rows = await sql`
    select
      id,
      title_translations as "titleTranslations",
      description_translations as "descriptionTranslations",
      alt_translations as "altTranslations",
      original_name as "originalName",
      stored_name as "storedName",
      file_url as "fileUrl",
      storage_path as "storagePath",
      storage_key as "storageKey",
      mime_type as "mimeType",
      extension,
      media_type as "mediaType",
      file_size as "fileSize",
      width,
      height,
      duration_seconds as "durationSeconds",
      created_by as "createdBy",
      is_public as "isPublic",
      create_date as "createDate",
      last_modified_date as "lastModifiedDate"
    from media.media_library
    where id = ${id} or file_url=${id}
    limit 1
  `;

  return rows[0] ? mapRow(rows[0]) : null;
}

export async function createMedia(
  input: CreateMediaInput,
  sql: MediaSqlClient = mediaSql
): Promise<MediaItem> {
  const normalized = normalizeCreateInput(input);

  const rows = await sql`
    insert into media.media_library (
      title_translations,
      description_translations,
      alt_translations,
      original_name,
      stored_name,
      file_url,
      storage_path,
      storage_key,
      mime_type,
      extension,
      media_type,
      file_size,
      width,
      height,
      duration_seconds,
      created_by,
      is_public
    )
    values (
      ${sql.json(normalized.titleTranslations)},
      ${sql.json(normalized.descriptionTranslations)},
      ${sql.json(normalized.altTranslations)},
      ${normalized.originalName},
      ${normalized.storedName},
      ${normalized.fileUrl},
      ${normalized.storagePath},
      ${normalized.storageKey},
      ${normalized.mimeType},
      ${normalized.extension},
      ${normalized.mediaType},
      ${normalized.fileSize},
      ${normalized.width},
      ${normalized.height},
      ${normalized.durationSeconds},
      ${normalized.createdBy},
      ${normalized.isPublic}
    )
    returning
      id,
      title_translations as "titleTranslations",
      description_translations as "descriptionTranslations",
      alt_translations as "altTranslations",
      original_name as "originalName",
      stored_name as "storedName",
      file_url as "fileUrl",
      storage_path as "storagePath",
      storage_key as "storageKey",
      mime_type as "mimeType",
      extension,
      media_type as "mediaType",
      file_size as "fileSize",
      width,
      height,
      duration_seconds as "durationSeconds",
      created_by as "createdBy",
      is_public as "isPublic",
      create_date as "createDate",
      last_modified_date as "lastModifiedDate"
  `;

  return mapRow(rows[0]);
}

export async function updateMedia(
  id: string,
  input: UpdateMediaInput,
  sql: MediaSqlClient = mediaSql
): Promise<MediaItem | null> {
  const normalized = normalizeUpdateInput(input);
  const fields = Object.entries(normalized).filter(([, value]) => value !== undefined);

  if (fields.length === 0) {
    return getMediaById(id, sql);
  }

  const assignments = fields.map(([key, value]) => {
    switch (key) {
      case "titleTranslations":
        return sql`title_translations = ${sql.json(value as Record<string, string>)}`;
      case "descriptionTranslations":
        return sql`description_translations = ${sql.json(value as Record<string, string>)}`;
      case "altTranslations":
        return sql`alt_translations = ${sql.json(value as Record<string, string>)}`;
      case "originalName":
        return sql`original_name = ${value as string}`;
      case "storedName":
        return sql`stored_name = ${value as string}`;
      case "fileUrl":
        return sql`file_url = ${value as string}`;
      case "storagePath":
        return sql`storage_path = ${value as string | null}`;
      case "storageKey":
        return sql`storage_key = ${value as string | null}`;
      case "mimeType":
        return sql`mime_type = ${value as string}`;
      case "extension":
        return sql`extension = ${value as string | null}`;
      case "mediaType":
        return sql`media_type = ${value as string}`;
      case "fileSize":
        return sql`file_size = ${Number(value)}`;
      case "width":
        return sql`width = ${value as number | null}`;
      case "height":
        return sql`height = ${value as number | null}`;
      case "durationSeconds":
        return sql`duration_seconds = ${value as number | null}`;
      case "createdBy":
        return sql`created_by = ${value as string | null}`;
      case "isPublic":
        return sql`is_public = ${Boolean(value)}`;
      default:
        return null;
    }
  }).filter(Boolean);

  if (assignments.length === 0) {
    return getMediaById(id, sql);
  }

  const setFragment = assignments.reduce((acc, fragment, index) => {
    if (index === 0) return sql`${fragment}`;
    return sql`${acc}, ${fragment}`;
  }, sql``);

  const rows = await sql`
    update media.media_library
    set ${setFragment}
    where id = ${id}
    returning
      id,
      title_translations as "titleTranslations",
      description_translations as "descriptionTranslations",
      alt_translations as "altTranslations",
      original_name as "originalName",
      stored_name as "storedName",
      file_url as "fileUrl",
      storage_path as "storagePath",
      storage_key as "storageKey",
      mime_type as "mimeType",
      extension,
      media_type as "mediaType",
      file_size as "fileSize",
      width,
      height,
      duration_seconds as "durationSeconds",
      created_by as "createdBy",
      is_public as "isPublic",
      create_date as "createDate",
      last_modified_date as "lastModifiedDate"
  `;

  return rows[0] ? mapRow(rows[0]) : null;
}

async function deleteLocalStorageFile(storagePath: string | null | undefined) {
  if (!storagePath) return;
  if (!storagePath.startsWith("/uploads/media/")) return;

  const diskPath = path.join(process.cwd(), "public", storagePath.replace(/^\/+/, ""));
  try {
    await fs.unlink(diskPath);
  } catch {
    // Intentionally ignore missing files.
  }
}

export async function deleteMedia(
  id: string,
  options?: { deleteLocalFile?: boolean },
  sql: MediaSqlClient = mediaSql
): Promise<boolean> {
  const existing = await getMediaById(id, sql);

  const rows = await sql`
    delete from media.media_library
    where id = ${id}
    returning id
  `;

  if (rows.length > 0 && options?.deleteLocalFile) {
    await deleteLocalStorageFile(existing?.storagePath);
  }

  return rows.length > 0;
}

export async function bulkDeleteMedia(
  ids: string[],
  options?: { deleteLocalFile?: boolean },
  sql: MediaSqlClient = mediaSql
): Promise<number> {
  if (ids.length === 0) return 0;

  const existing = options?.deleteLocalFile
    ? await sql`
        select storage_path as "storagePath"
        from media.media_library
        where id in ${sql(ids)}
      `
    : [];

  const rows = await sql`
    delete from media.media_library
    where id in ${sql(ids)}
    returning id
  `;

  if (options?.deleteLocalFile) {
    await Promise.all(
      existing.map((item: any) => deleteLocalStorageFile(item.storagePath))
    );
  }

  return rows.length;
}

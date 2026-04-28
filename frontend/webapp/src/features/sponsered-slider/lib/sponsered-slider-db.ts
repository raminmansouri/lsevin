import "server-only";

import sql from "@/config/database/db";
import type { BaseRequest } from "@/types/common";
import type { FilterParams } from "@/types/filter";
import type { ApiReturnType, PaginatedResult } from "@/types/network";

import { DEFAULT_SLIDER_BUTTON_LABEL } from "../constants";
import type {
  ActiveSponseredSlide,
  MediaTypeOption,
  SponseredSliderDetails,
  SponseredSliderFormOptions,
  SponseredSliderItem,
  SponseredSliderMutationInput,
} from "../types";

type AnyRecord = Record<string, unknown>;
type QueryLike = typeof sql;

function success<T>(data: T): ApiReturnType<T> {
  return { data, error: undefined } as ApiReturnType<T>;
}

function failure<T>(error: unknown): ApiReturnType<T> {
  debugError("database failure", error);
  const detail = error instanceof Error ? error.message : "Unexpected database error.";
  return {
    data: undefined,
    error: {
      title: "Database error",
      detail,
      status: 500,
    },
  } as ApiReturnType<T>;
}

function debugLog(message: string, payload?: unknown) {
  if (payload === undefined) {
    console.log("[sponsered-slider/db] " + message);
    return;
  }
  console.log("[sponsered-slider/db] " + message, payload);
}

function debugError(message: string, error: unknown) {
  console.error("[sponsered-slider/db] " + message, error);
}

function isUuid(value?: string | null): value is string {
  return typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function asNumber(value: unknown, fallback: number): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function readFilter(params: FilterParams | undefined, keys: string[], fallback?: unknown) {
  const source = (params || {}) as AnyRecord;
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null && source[key] !== "") return source[key];
  }
  const nestedCandidates = [source.filter, source.filters, source.query] as AnyRecord[];
  for (const nested of nestedCandidates) {
    if (!nested || typeof nested !== "object") continue;
    for (const key of keys) {
      if (nested[key] !== undefined && nested[key] !== null && nested[key] !== "") return nested[key];
    }
  }
  return fallback;
}

function normalizeSearch(params?: FilterParams): string {
  return String(readFilter(params, ["search", "searchTerm", "q", "keyword", "term"], "") || "").trim();
}

function normalizePage(params?: FilterParams) {
  const rawPage = readFilter(params, ["page", "pageNumber", "pageIndex"], 1);
  const rawPageSize = readFilter(params, ["pageSize", "size", "take", "limit"], 20);
  const pageSize = Math.max(1, Math.min(100, asNumber(rawPageSize, 20)));
  const pageNumber = Math.max(1, asNumber(rawPage, 1));
  return { pageNumber, pageSize, offset: (pageNumber - 1) * pageSize };
}

function normalizeMediaKind(value?: string | null, mimeType?: string | null): SponseredSliderItem["mediaKind"] {
  const byMime = String(mimeType || "").toLowerCase();
  if (byMime.includes("gif")) return "gif";
  if (byMime.startsWith("video/")) return "video";
  if (byMime.startsWith("image/")) return "image";

  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.includes("gif")) return "gif";
  if (normalized.includes("video")) return "video";
  if (normalized.includes("image")) return "image";
  if (normalized.includes("file") || normalized.includes("document")) return "file";
  return "unknown";
}

function inferMediaTypeLookup(kind?: string | null, mimeType?: string | null) {
  const mediaKind = normalizeMediaKind(kind, mimeType);
  if (mediaKind === "gif") return ["gif", "image"];
  if (mediaKind === "video") return ["video"];
  if (mediaKind === "image") return ["image"];
  if (mediaKind === "file") return ["file"];
  return [];
}

function normalizeMaybeUrl(value?: string | null) {
  const trimmed = String(value || "").trim();
  return trimmed || undefined;
}

async function resolveMediaTypeId(db: QueryLike, mediaTypeId?: string, mediaKind?: string | null, mimeType?: string | null) {
  if (mediaTypeId) {
    if (isUuid(mediaTypeId)) return mediaTypeId;
    debugLog("ignored invalid mediaTypeId", mediaTypeId);
  }

  const lookups = inferMediaTypeLookup(mediaKind, mimeType);
  for (const lookup of lookups) {
    const rows = await db<{ id: string }[]>`
      select id::text as id
      from media.media_type
      where lower(coalesce(name, '')) = ${lookup.toLowerCase()}
      limit 1
    `;
    if (rows[0]?.id) return rows[0].id;
  }

  return undefined;
}

async function resolveSliderMedia(db: QueryLike, input: SponseredSliderMutationInput) {
  const directUrl = normalizeMaybeUrl(input.url);
  const mediaId = normalizeMaybeUrl(input.mediaId);

  if (!mediaId) {
    debugLog("no mediaId supplied; using direct url only", { directUrl, mediaTypeId: input.mediaTypeId });
    return {
      url: directUrl,
      mediaTypeId: await resolveMediaTypeId(db, input.mediaTypeId),
    };
  }

  if (!isUuid(mediaId)) {
    debugLog("mediaId is not a UUID; keeping direct url and ignoring media lookup", { mediaId, directUrl });
    return {
      url: directUrl || mediaId,
      mediaTypeId: await resolveMediaTypeId(db, input.mediaTypeId),
    };
  }

  debugLog("resolving selected media item", { mediaId, directUrl });

  const mediaRows = await db<{
    id: string;
    fileUrl: string;
    mediaType: string;
    mimeType: string;
  }[]>`
    select
      id::text as id,
      file_url as "fileUrl",
      media_type as "mediaType",
      mime_type as "mimeType"
    from media.media_library
    where id = ${mediaId}
    limit 1
  `;

  const media = mediaRows[0];
  if (!media) {
    debugLog("selected media item was not found; falling back to url/mediaId", { mediaId, directUrl });
    return {
      url: directUrl || mediaId,
      mediaTypeId: await resolveMediaTypeId(db, input.mediaTypeId),
    };
  }

  const resolved = {
    url: media.fileUrl,
    mediaTypeId: await resolveMediaTypeId(db, input.mediaTypeId, media.mediaType, media.mimeType),
  };
  debugLog("resolved media item", { mediaId: media.id, mediaType: media.mediaType, mimeType: media.mimeType, resolved });
  return resolved;
}

const MEDIA_KIND_SQL = sql.unsafe(`case
  when lower(coalesce(mt.name, '')) like '%gif%' then 'gif'
  when lower(coalesce(mt.name, '')) like '%video%' then 'video'
  when lower(coalesce(mt.name, '')) like '%image%' then 'image'
  when lower(coalesce(mt.name, '')) like '%file%' then 'file'
  when lower(coalesce(ss.url, '')) like '%.gif%' then 'gif'
  when lower(coalesce(ss.url, '')) ~ '\\.(mp4|webm|mov|m4v)(\\?|$)' then 'video'
  when lower(coalesce(ss.url, '')) ~ '\\.(jpg|jpeg|png|webp|avif|svg)(\\?|$)' then 'image'
  else 'unknown'
end`);

export async function getSponseredSliderFormOptions(): Promise<SponseredSliderFormOptions> {
  const mediaTypes = await sql<MediaTypeOption[]>`
    select id::text as id, coalesce(name, '') as name
    from media.media_type
    order by lower(coalesce(name, '')) asc
  `;

  return { mediaTypes };
}

export async function getSponseredSliderRows(
  _request: Partial<BaseRequest>,
  params?: FilterParams
): Promise<ApiReturnType<PaginatedResult<SponseredSliderItem>>> {
  try {
    const search = normalizeSearch(params);
    const like = `%${search}%`;
    const { pageNumber, pageSize, offset } = normalizePage(params);

    const rows = await sql<SponseredSliderItem[]>`
      select
        ss.id::text as id,
        ss.title,
        ss.subtitle,
        coalesce(ss.button_label, ${DEFAULT_SLIDER_BUTTON_LABEL}) as "buttonLabel",
        ss.link,
        ss.url,
        ss.media_type_id::text as "mediaTypeId",
        mt.name as "mediaTypeName",
        ${MEDIA_KIND_SQL} as "mediaKind",
        coalesce(ss.display_order, 0)::int as "displayOrder",
        ss.is_active as "isActive"
      from media.sponsered_slider ss
      left join media.media_type mt on mt.id = ss.media_type_id
      where
        ${search} = ''
        or coalesce(ss.title, '') ilike ${like}
        or coalesce(ss.subtitle, '') ilike ${like}
        or coalesce(ss.link, '') ilike ${like}
        or coalesce(ss.url, '') ilike ${like}
        or coalesce(mt.name, '') ilike ${like}
      order by ss.display_order asc, ss.title asc nulls last, ss.id asc
      limit ${pageSize}
      offset ${offset}
    `;

    const countRows = await sql<{ count: number }[]>`
      select count(*)::int as count
      from media.sponsered_slider ss
      left join media.media_type mt on mt.id = ss.media_type_id
      where
        ${search} = ''
        or coalesce(ss.title, '') ilike ${like}
        or coalesce(ss.subtitle, '') ilike ${like}
        or coalesce(ss.link, '') ilike ${like}
        or coalesce(ss.url, '') ilike ${like}
        or coalesce(mt.name, '') ilike ${like}
    `;

    const totalCount = Number(countRows[0]?.count || 0);
    const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

    const result = {
      items: rows,
      totalCount,
      totalItems: totalCount,
      pageNumber,
      pageIndex: pageNumber,
      pageSize,
      totalPages,
      hasNextPage: pageNumber < totalPages,
      hasPreviousPage: pageNumber > 1,
    } as unknown as PaginatedResult<SponseredSliderItem>;

    return success(result);
  } catch (error) {
    return failure(error);
  }
}

export async function getSponseredSliderById(sliderId: string): Promise<ApiReturnType<SponseredSliderDetails>> {
  try {
    const rows = await sql<SponseredSliderDetails[]>`
      select
        ss.id::text as id,
        ss.title,
        ss.subtitle,
        coalesce(ss.button_label, ${DEFAULT_SLIDER_BUTTON_LABEL}) as "buttonLabel",
        ss.link,
        ss.url,
        ss.media_type_id::text as "mediaTypeId",
        mt.name as "mediaTypeName",
        ${MEDIA_KIND_SQL} as "mediaKind",
        coalesce(ss.display_order, 0)::int as "displayOrder",
        ss.is_active as "isActive"
      from media.sponsered_slider ss
      left join media.media_type mt on mt.id = ss.media_type_id
      where ss.id = ${sliderId}
      limit 1
    `;

    const item = rows[0];
    if (!item) {
      return {
        data: undefined,
        error: { title: "Not found", detail: "Sponsored slider item was not found.", status: 404 },
      } as ApiReturnType<SponseredSliderDetails>;
    }

    return success(item);
  } catch (error) {
    return failure(error);
  }
}

export async function getActiveSponseredSlides(): Promise<ApiReturnType<ActiveSponseredSlide[]>> {
  try {
    const rows = await sql<ActiveSponseredSlide[]>`
      select
        ss.id::text as id,
        ss.title,
        ss.subtitle,
        coalesce(ss.button_label, ${DEFAULT_SLIDER_BUTTON_LABEL}) as "buttonLabel",
        ss.link,
        ss.url,
        mt.name as "mediaTypeName",
        ${MEDIA_KIND_SQL} as "mediaKind",
        coalesce(ss.display_order, 0)::int as "displayOrder"
      from media.sponsered_slider ss
      left join media.media_type mt on mt.id = ss.media_type_id
      where ss.is_active = true and nullif(btrim(coalesce(ss.url, '')), '') is not null
      order by ss.display_order asc, ss.title asc nulls last, ss.id asc
    `;

    return success(rows);
  } catch (error) {
    return failure(error);
  }
}

export async function createSponseredSlider(input: SponseredSliderMutationInput): Promise<string> {
  debugLog("create requested", input);
  return await sql.begin(async (db) => {
    const media = await resolveSliderMedia(db, input);
    debugLog("create resolved media", media);

    const rows = await db<{ id: string }[]>`
      insert into media.sponsered_slider (
        id,
        link,
        url,
        media_type_id,
        title,
        subtitle,
        button_label,
        display_order,
        is_active
      ) values (
        public.uuid_generate_v4(),
        ${normalizeMaybeUrl(input.link) || null},
        ${media.url || null},
        ${media.mediaTypeId || null},
        ${normalizeMaybeUrl(input.title) || null},
        ${normalizeMaybeUrl(input.subtitle) || null},
        ${normalizeMaybeUrl(input.buttonLabel) || DEFAULT_SLIDER_BUTTON_LABEL},
        ${input.displayOrder ?? 0},
        ${input.isActive ?? true}
      )
      returning id::text
    `;

    debugLog("create completed", { id: rows[0]?.id });
    return rows[0].id;
  });
}

export async function updateSponseredSlider(input: SponseredSliderMutationInput & { sliderId: string }): Promise<string> {
  debugLog("update requested", input);
  return await sql.begin(async (db) => {
    const media = await resolveSliderMedia(db, input);
    debugLog("update resolved media", media);

    const rows = await db<{ id: string }[]>`
      update media.sponsered_slider
      set
        link = ${normalizeMaybeUrl(input.link) || null},
        url = ${media.url || null},
        media_type_id = ${media.mediaTypeId || null},
        title = ${normalizeMaybeUrl(input.title) || null},
        subtitle = ${normalizeMaybeUrl(input.subtitle) || null},
        button_label = ${normalizeMaybeUrl(input.buttonLabel) || DEFAULT_SLIDER_BUTTON_LABEL},
        display_order = ${input.displayOrder ?? 0},
        is_active = ${input.isActive ?? true}
      where id = ${input.sliderId}
      returning id::text
    `;

    if (!rows[0]?.id) throw new Error("Sponsored slider item was not found.");
    debugLog("update completed", { id: rows[0].id });
    return rows[0].id;
  });
}

export async function deleteSponseredSlider(sliderId: string): Promise<string> {
  debugLog("delete requested", { sliderId });
  const rows = await sql<{ id: string }[]>`
    delete from media.sponsered_slider
    where id = ${sliderId}
    returning id::text
  `;

  if (!rows[0]?.id) throw new Error("Sponsored slider item was not found.");
  return rows[0].id;
}

export async function changeSponseredSliderActivation(sliderId: string, isActive: boolean): Promise<string> {
  debugLog("activation change requested", { sliderId, isActive });
  const rows = await sql<{ id: string }[]>`
    update media.sponsered_slider
    set is_active = ${isActive}
    where id = ${sliderId}
    returning id::text
  `;

  if (!rows[0]?.id) throw new Error("Sponsored slider item was not found.");
  return rows[0].id;
}

export async function moveSponseredSlider(sliderId: string, direction: "up" | "down"): Promise<string> {
  debugLog("move requested", { sliderId, direction });
  return await sql.begin(async (db) => {
    const currentRows = await db<{ id: string; displayOrder: number }[]>`
      select id::text as id, coalesce(display_order, 0)::int as "displayOrder"
      from media.sponsered_slider
      where id = ${sliderId}
      limit 1
    `;
    const current = currentRows[0];
    if (!current) throw new Error("Sponsored slider item was not found.");

    const siblingRows = direction === "up"
      ? await db<{ id: string; displayOrder: number }[]>`
          select id::text as id, coalesce(display_order, 0)::int as "displayOrder"
          from media.sponsered_slider
          where display_order < ${current.displayOrder}
          order by display_order desc
          limit 1
        `
      : await db<{ id: string; displayOrder: number }[]>`
          select id::text as id, coalesce(display_order, 0)::int as "displayOrder"
          from media.sponsered_slider
          where display_order > ${current.displayOrder}
          order by display_order asc
          limit 1
        `;

    const sibling = siblingRows[0];
    if (!sibling) return current.id;

    await db`update media.sponsered_slider set display_order = ${sibling.displayOrder} where id = ${current.id}`;
    await db`update media.sponsered_slider set display_order = ${current.displayOrder} where id = ${sibling.id}`;
    return current.id;
  });
}

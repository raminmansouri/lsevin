import "server-only";

import {
  unstable_cacheLife as cacheLife,
  unstable_cacheTag as cacheTag,
} from "next/cache";

import sql from "@/config/database/db";
import {
  DEFAULT_PAGE_NUMBER,
  DEFAULT_PAGE_SIZE,
  FilterParams,
} from "@/types/filter";
import { ApiReturnType, PaginatedResult } from "@/types/network";

import { getPickedLocationIdTag, getPickedLocationsTag } from "./cache";
import { PickedLocationDetails, PickedLocationListItem } from "../types";
import { PickedLocationMutationInput } from "../schemas";

type Problem = {
  title: string;
  status: number;
  detail: string;
};

type PickedLocationRow = {
  id: string;
  location_id: string;
  city: string | null;
  country: string | null;
  city_code: string | null;
  country_code: string | null;
  country_id: string | null;
  image: string;
  image_preview_url: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  total_count?: string | number | null;
};

const DEFAULT_LOCALE = "en-US";

function toProblem(error: unknown, fallback = "Database operation failed."): Problem {
  const message = error instanceof Error ? error.message : fallback;
  return {
    title: fallback,
    status: 500,
    detail: message,
  };
}

export function ok<T>(data: T): ApiReturnType<T> {
  return { data } as ApiReturnType<T>;
}

export function fail<T>(error: unknown, fallback?: string): ApiReturnType<T> {
  return { error: toProblem(error, fallback) } as ApiReturnType<T>;
}

export function actionFail(error: unknown, fallback?: string) {
  return { data: undefined, error: toProblem(error, fallback) };
}

function normalizeLocale(locale?: string | null) {
  const value = (locale || DEFAULT_LOCALE).trim();
  if (value.toLowerCase() === "en") return "en-US";
  if (value.toLowerCase() === "fa") return "fa-IR";
  if (value.toLowerCase() === "ar") return "ar-SA";
  if (value.toLowerCase() === "tr") return "tr-TR";
  return value;
}

function asNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function numberOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function toIlikePattern(value: string) {
  return `%${value.replace(/[\\%_]/g, "\\$&")}%`;
}

function firstString(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    const item = value.find((entry) => typeof entry === "string");
    return typeof item === "string" ? item : "";
  }
  return "";
}

function parsePageParams(params?: FilterParams) {
  const raw = (params || {}) as Record<string, unknown>;
  const pageNumber = Math.max(
    1,
    asNumber(raw.PageNumber ?? raw.pageNumber ?? raw.page ?? raw.Page, DEFAULT_PAGE_NUMBER),
  );
  const pageSize = Math.min(
    100,
    Math.max(1, asNumber(raw.PageSize ?? raw.pageSize ?? raw.size ?? raw.limit, DEFAULT_PAGE_SIZE)),
  );
  const search = firstString(
    raw.Search ??
      raw.search ??
      raw.q ??
      raw.Q ??
      raw.Query ??
      raw.query ??
      raw.keyword ??
      raw.Keyword ??
      raw.term ??
      raw.Term ??
      raw.searchTerm ??
      raw.SearchTerm ??
      raw.searchValue ??
      raw.SearchValue ??
      raw.globalFilter ??
      raw.GlobalFilter ??
      raw.filter ??
      raw.Filter ??
      raw.filters ??
      raw.Filters ??
      "",
  ).trim();

  return {
    pageNumber,
    pageSize,
    offset: (pageNumber - 1) * pageSize,
    search,
  };
}

function toPaginatedResult<T>(items: T[], totalCount: number, pageNumber: number, pageSize: number): PaginatedResult<T> {
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  return {
    items,
    pageNumber,
    pageSize,
    totalCount,
    totalPages,
    hasNextPage: pageNumber < totalPages,
    hasPreviousPage: pageNumber > 1,
  } as PaginatedResult<T>;
}

function mapPickedLocationRow(row: PickedLocationRow): PickedLocationListItem {
  return {
    id: String(row.id),
    locationId: String(row.location_id),
    city: String(row.city ?? ""),
    country: row.country ? String(row.country) : null,
    cityCode: row.city_code ? String(row.city_code) : null,
    countryCode: row.country_code ? String(row.country_code) : null,
    countryId: row.country_id ? String(row.country_id) : null,
    image: String(row.image ?? ""),
    imagePreviewUrl: row.image_preview_url ? String(row.image_preview_url) : null,
    latitude: numberOrNull(row.latitude),
    longitude: numberOrNull(row.longitude),
  };
}

function basePickedLocationsQuery(locale: string) {
  return sql`
    select
      pl.id::text as id,
      pl.locationid::text as location_id,
      common.get_translation_t(city.value_translations, ${locale}::text, 'en-US') as city,
      common.get_translation_t(country.value_translations, ${locale}::text, 'en-US') as country,
      city.code::text as city_code,
      country.code::text as country_code,
      country.id::text as country_id,
      pl.image::text as image,
      nullif(coalesce(ml.file_url, ''), '') as image_preview_url,
      pl.latitude,
      pl.longitude,
      coalesce(city.value_translations::text, '') as city_search_text,
      coalesce(country.value_translations::text, '') as country_search_text
    from category.picked_locations pl
    join category.locations city
      on city.id = pl.locationid
    left join category.locations country
      on country.id = city.parent_id
    left join media.media_library ml
      on ml.id::text = pl.image
  `;
}

export async function getPickedLocationsFromDb(
  locale: string,
  params?: FilterParams,
): Promise<ApiReturnType<PaginatedResult<PickedLocationListItem>>> {
  "use cache: remote";

  try {
    const normalizedLocale = normalizeLocale(locale);
    const { pageNumber, pageSize, offset, search } = parsePageParams(params);
    const searchPattern = toIlikePattern(search);

    cacheTag(getPickedLocationsTag());
    cacheLife("default");

    const searchFilterSql = search
      ? sql`
          where (
            base.id ilike ${searchPattern}
            or base.location_id ilike ${searchPattern}
            or base.image ilike ${searchPattern}
            or base.city ilike ${searchPattern}
            or base.country ilike ${searchPattern}
            or base.city_code ilike ${searchPattern}
            or base.country_code ilike ${searchPattern}
            or base.city_search_text ilike ${searchPattern}
            or base.country_search_text ilike ${searchPattern}
            or base.latitude::text ilike ${searchPattern}
            or base.longitude::text ilike ${searchPattern}
          )
        `
      : sql``;

    const rows = await sql<PickedLocationRow[]>`
      with base as (
        ${basePickedLocationsQuery(normalizedLocale)}
      ), filtered as (
        select *
        from base
        ${searchFilterSql}
      ), counted as (
        select *, count(*) over() as total_count
        from filtered
      )
      select *
      from counted
      order by coalesce(city, '') asc, id asc
      limit ${pageSize}
      offset ${offset}
    `;

    const totalCount = rows[0]?.total_count ? asNumber(rows[0].total_count) : 0;
    return ok(toPaginatedResult(rows.map(mapPickedLocationRow), totalCount, pageNumber, pageSize));
  } catch (error) {
    return fail(error, "Failed to fetch picked locations.");
  }
}

export async function getPickedLocationByIdFromDb(
  id: string,
  locale: string,
): Promise<ApiReturnType<PickedLocationDetails>> {
  "use cache: remote";

  try {
    const normalizedLocale = normalizeLocale(locale);

    cacheTag(getPickedLocationsTag());
    cacheTag(getPickedLocationIdTag(id));
    cacheLife("default");

    const rows = await sql<PickedLocationRow[]>`
      with base as (
        ${basePickedLocationsQuery(normalizedLocale)}
      )
      select *
      from base
      where id = ${id}
      limit 1
    `;

    const row = rows[0];
    if (!row) {
      return {
        error: {
          title: "Picked location not found",
          status: 404,
          detail: "The requested picked location does not exist.",
        },
      } as ApiReturnType<PickedLocationDetails>;
    }

    return ok(mapPickedLocationRow(row));
  } catch (error) {
    return fail(error, "Failed to fetch picked location.");
  }
}

export async function savePickedLocationInDb(input: PickedLocationMutationInput) {
  const latitude = input.latitude ?? null;
  const longitude = input.longitude ?? null;

  if (input.pickedLocationId) {
    const rows = await sql<{ id: string }[]>`
      update category.picked_locations
      set
        locationid = ${input.locationId},
        image = ${input.image.trim()},
        latitude = ${latitude},
        longitude = ${longitude}
      where id = ${input.pickedLocationId}
      returning id::text
    `;

    if (!rows[0]) throw new Error("Picked location was not found.");
    return rows[0].id;
  }

  const rows = await sql<{ id: string }[]>`
    insert into category.picked_locations (
      id,
      locationid,
      image,
      latitude,
      longitude
    ) values (
      public.uuid_generate_v4(),
      ${input.locationId},
      ${input.image.trim()},
      ${latitude},
      ${longitude}
    )
    returning id::text
  `;

  return rows[0].id;
}

export async function deletePickedLocationInDb(pickedLocationId: string) {
  const rows = await sql<{ id: string }[]>`
    delete from category.picked_locations
    where id = ${pickedLocationId}
    returning id::text
  `;

  return Boolean(rows[0]);
}

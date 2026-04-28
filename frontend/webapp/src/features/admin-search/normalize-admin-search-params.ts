export type AdminSearchParamsInput =
  | URLSearchParams
  | Record<string, string | string[] | undefined>
  | undefined
  | null;

export type NormalizedAdminTableParams = {
  search: string;
  page: number;
  pageSize: number;
  locale: string;
  categoryId: string | null;
  activeFilter: boolean | null;
};

const DEFAULT_LOCALE = "en-US";
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

function firstParam(
  params: AdminSearchParamsInput,
  names: string[],
  fallback = ""
): string {
  if (!params) return fallback;

  for (const name of names) {
    const raw =
      params instanceof URLSearchParams
        ? params.get(name)
        : params[name as keyof typeof params];

    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      return String(value).trim();
    }
  }

  return fallback;
}

function asInt(value: unknown, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.trunc(parsed) : fallback;
}

function normalizeBoolean(value: unknown): boolean | null {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized || normalized === "all") return null;
  if (["true", "1", "active", "yes"].includes(normalized)) return true;
  if (["false", "0", "inactive", "no"].includes(normalized)) return false;
  return null;
}

function normalizeNullableId(value: unknown): string | null {
  const normalized = String(value ?? "").trim();
  if (!normalized || normalized === "all") return null;
  return normalized;
}

export function normalizeAdminTableParams(
  params: AdminSearchParamsInput,
  localeFromRoute?: string | null
): NormalizedAdminTableParams {
  const search = firstParam(params, [
    "search",
    "q",
    "query",
    "keyword",
    "term",
    "globalFilter",
    "global",
    "name",
  ]);

  const page = Math.max(1, asInt(firstParam(params, ["page", "p"], "1"), 1));
  const pageSize = Math.max(
    1,
    Math.min(
      MAX_PAGE_SIZE,
      asInt(firstParam(params, ["pageSize", "size", "limit", "perPage"], String(DEFAULT_PAGE_SIZE)), DEFAULT_PAGE_SIZE)
    )
  );

  const locale =
    firstParam(params, ["locale", "lang", "language"], String(localeFromRoute ?? DEFAULT_LOCALE)) ||
    DEFAULT_LOCALE;

  return {
    search,
    page,
    pageSize,
    locale,
    categoryId: normalizeNullableId(firstParam(params, ["categoryId", "category", "category_id"])),
    activeFilter: normalizeBoolean(firstParam(params, ["active", "isActive", "activeFilter", "status"])),
  };
}

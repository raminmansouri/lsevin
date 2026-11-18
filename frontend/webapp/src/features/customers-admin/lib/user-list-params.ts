/**
 * Shared URL parameters for the admin customer lists ("همه مشتریان" and "کاربران"):
 * `q` (search), `sort` and `page`. Parsed on the server and handed to the
 * repositories, so sorting, searching and paging all happen in SQL.
 */
export const USER_LIST_SORTS = ["newest", "oldest", "name_asc", "name_desc"] as const;
export type UserListSort = (typeof USER_LIST_SORTS)[number];

export const USER_LIST_PAGE_SIZE = 50;

export type UserListParams = { q: string; sort: UserListSort; page: number };

export type UserListSearchParams = { q?: string; sort?: string; page?: string };

export function parseUserListParams(raw: UserListSearchParams): UserListParams {
  const sort = (USER_LIST_SORTS as readonly string[]).includes(raw.sort ?? "")
    ? (raw.sort as UserListSort)
    : "newest";
  const page = Math.max(1, Math.floor(Number(raw.page)) || 1);
  return { q: (raw.q ?? "").trim(), sort, page };
}

const PERSIAN_ARABIC_DIGITS = /[۰-۹٠-٩]/g;

/** Turns Persian/Arabic digits into ASCII so "۰۹۱۲" finds a phone stored as "912". */
export function normalizeDigits(value: string) {
  return value.replace(PERSIAN_ARABIC_DIGITS, (d) => {
    const code = d.charCodeAt(0);
    return String(code >= 0x06f0 ? code - 0x06f0 : code - 0x0660);
  });
}

/**
 * Builds the ILIKE pattern for a free-text search and, when the term looks like a
 * phone number, a digits-only pattern (leading zeros dropped, so "0912…" matches
 * "+98 912…").
 */
export function buildSearchPatterns(q: string) {
  const term = normalizeDigits(q.trim());
  if (!term) return { text: null, digits: null };
  const text = `%${term.replace(/[\\%_]/g, "\\$&")}%`;
  const looksLikePhone = /^[\d\s+\-()]+$/.test(term);
  const digitsOnly = term.replace(/\D/g, "").replace(/^0+/, "");
  const digits = looksLikePhone && digitsOnly.length >= 3 ? `%${digitsOnly}%` : null;
  return { text, digits };
}

export function buildUserListHref(current: UserListParams, patch: Partial<UserListParams>) {
  const next = { ...current, ...patch };
  const params = new URLSearchParams();
  if (next.q) params.set("q", next.q);
  if (next.sort !== "newest") params.set("sort", next.sort);
  if (next.page > 1) params.set("page", String(next.page));
  const qs = params.toString();
  return qs ? `?${qs}` : "?";
}

const DATE_LOCALES: Record<string, string> = { fa: "fa-IR", ar: "ar", en: "en-GB" };

/** Signup date + time in Tehran time; Persian locale gets the Jalali calendar. */
export function formatSignupDate(value: string | Date | null | undefined, locale: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat(DATE_LOCALES[locale] ?? locale, {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Tehran",
  }).format(date);
}

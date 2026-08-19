import type { ModulePageProps } from "@core/modules/types";
import { dateTimeInZone } from "@core/lib/dateTime";

export type { ModulePageProps };
export type PrimitiveSearchValue = string | string[] | undefined;

export function first(value: PrimitiveSearchValue, fallback = "") {
  if (Array.isArray(value)) return value[0] ?? fallback;
  return value ?? fallback;
}

export function requireParam(params: ModulePageProps["params"], key: string) {
  const value = params[key];
  if (!value) throw new Error(`Missing required module route param: ${key}`);
  return value;
}

export function dateRangeFromSearch(searchParams?: ModulePageProps["searchParams"], timeZone = "Asia/Tehran") {
  const now = new Date();
  const localNow = dateTimeInZone(now, timeZone);
  const localToday = localNow ? `${localNow.year}-${String(localNow.month).padStart(2, "0")}-${String(localNow.day).padStart(2, "0")}` : now.toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const localPast = dateTimeInZone(thirtyDaysAgo, timeZone);
  const localPastDate = localPast ? `${localPast.year}-${String(localPast.month).padStart(2, "0")}-${String(localPast.day).padStart(2, "0")}` : thirtyDaysAgo.toISOString().slice(0, 10);
  const to = first(searchParams?.to, localToday);
  const from = first(searchParams?.from, localPastDate);
  const currencyCode = first(searchParams?.currencyCode, "USD").toUpperCase();
  return { from, to, currencyCode, timeZone };
}

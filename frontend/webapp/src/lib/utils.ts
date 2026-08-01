// Nothing heavy may be imported here. `cn` is used by nearly every component in
// the app, so any dependency this module picks up is effectively a dependency of
// every page's client bundle. A `zod` import that existed only for an unused
// `getSchemaFields` helper was putting 248 KB (57 KB gzipped) of validator into
// bundles that never validated anything.
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}



export function ensureLocalePrefix(path: string, locale: string): string {
  if (
      path.startsWith("http") ||
      path.startsWith("/api") ||
      path.match(/^\/[a-z]{2}(\/|$)/)
  ) {
    return path;
  }

  return `/${locale}${path.startsWith("/") ? path : `/${path}`}`;
}


import { createNavigation } from "next-intl/navigation";
import { getLocale } from "next-intl/server";

import { localeToHeader } from "@/config/locales";
import { LocaleHeaderTypes, LocaleTypes } from "@/types/common";

import { routing } from "./routing";

// Lightweight wrappers around Next.js' navigation
// APIs that consider the routing configuration
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

export const getLocaleHeader = async (): Promise<LocaleHeaderTypes> => {
  const locale = await getLocale();
  return localeToHeader(locale as LocaleTypes);
};

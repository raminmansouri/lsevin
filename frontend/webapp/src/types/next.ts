import { Locale } from "next-intl";
import type { SearchParams } from "nuqs/server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TranslationType = (s: string, params?: any) => string;
export type LocalePageProps = {
  children: React.ReactNode;
  params: Promise<LocaleParams>;
};

export type PageParams = {
  id: string;
  locale: string;
};

export interface PageProps<T = PageParams, S = SearchParams> {
  params: Promise<T>;
  searchParams: Promise<S>;
}

export interface ComponentProps<T = PageParams> {
  params: Promise<T>;
}

export interface SearchComponentProps<T = PageParams, S = SearchParams>
  extends ComponentProps<T> {
  searchParams: Promise<S>;
}

// Type for locale-specific routes
export type LocaleParams = {
  locale: Locale;
};

// Combined type for locale and page params
export type LocalePageParams = LocaleParams & {
  id: string;
};

// Helper function to extract params
export async function extractParams<T>(params: Promise<T>): Promise<T> {
  return await params;
}

// Helper function to extract locale from params
export async function extractLocale<T extends LocaleParams>(
  params: Promise<T>
): Promise<string> {
  const paramsData = await params;
  return paramsData.locale;
}

// Helper function to create search params key
export async function createSearchParamsKey(
  searchParams: Promise<SearchParams>
): Promise<string> {
  const searchParamsData = await searchParams;
  return new URLSearchParams(
    searchParamsData as Record<string, string>
  ).toString();
}

export interface RouteParams<
  T = { [key: string]: string | string[] | undefined },
> {
  params: Promise<T>;
}

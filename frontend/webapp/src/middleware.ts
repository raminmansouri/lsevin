import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import {
  adminPrefix,
  apiAuthPrefix,
  authRoutes,
  DEFAULT_SIGNIN_REDIRECT,
  isProtectedPath,
} from "@/lib/auth/routes";

import { routing } from "./i18n/routing";
import { getSession } from "./lib/auth/session";
import { UserRole } from "./types/common";

type Locale = (typeof routing.locales)[number];

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  const intlResponse = intlMiddleware(request);

  if (intlResponse && !intlResponse.ok) {
    return intlResponse;
  }

  const pathname = intlResponse?.headers.get("x-middleware-rewrite")
    ? new URL(intlResponse.headers.get("x-middleware-rewrite")!, request.url).pathname
    : request.nextUrl.pathname;

  if (pathname.startsWith(apiAuthPrefix)) {
    return intlResponse || NextResponse.next();
  }

  const segments = pathname.split("/").filter(Boolean);
  const potentialLocale = segments[0];
  const isValidLocale = routing.locales.includes(potentialLocale as Locale);
  const locale = isValidLocale ? (potentialLocale as Locale) : routing.defaultLocale;
  const localePrefix = `/${locale}`;
  const pathnameWithoutLocale = isValidLocale
    ? pathname.slice(localePrefix.length) || "/"
    : pathname;

  // Once a visitor has explicitly chosen a language (cookie written by the locale
  // switcher), keep them on it — even when the browser Back button lands on a URL
  // whose locale prefix differs. New visitors (no cookie) keep the fa default.
  const cookieLocale = request.cookies.get("LSEVIN_LOCALE")?.value || request.cookies.get("NEXT_LOCALE")?.value;
  if (
    isValidLocale &&
    !pathname.startsWith(apiAuthPrefix) &&
    cookieLocale &&
    cookieLocale !== locale &&
    routing.locales.includes(cookieLocale as Locale)
  ) {
    const redirectUrl = new URL(
      `/${cookieLocale}${pathnameWithoutLocale === "/" ? "" : pathnameWithoutLocale}`,
      request.url,
    );
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl);
  }

  const isAdminRoute = pathname.includes(adminPrefix);
  const isProtectedRoute = isProtectedPath(pathnameWithoutLocale);

  const isAuthRoute = authRoutes.some((route) => {
    const pattern = route.replace(/:[^/]+/g, "[^/]+").replace(/\//g, "\\/");
    return new RegExp(`^(\/[a-z]{2})?\/${pattern}$`).test(pathname);
  });

  // Guests browse everything freely — only fetch the session when a decision
  // actually depends on it (auth pages, protected/admin areas).
  if (!isAuthRoute && !isProtectedRoute) {
    return intlResponse || NextResponse.next();
  }

  const session = await getSession({ redirectToLogin: false });
  const isLoggedIn = !!session?.user;

  // Auth pages: send already-authenticated users back into the app.
  if (isAuthRoute) {
    if (isLoggedIn) {
      return NextResponse.redirect(
        new URL(`${localePrefix}${DEFAULT_SIGNIN_REDIRECT}`, request.url)
      );
    }
    return intlResponse || NextResponse.next();
  }

  // Protected area + guest → go sign in, remembering where they were headed.
  if (!isLoggedIn) {
    const target = `${pathname}${request.nextUrl.search}`;
    const signInUrl = new URL(`${localePrefix}/sign-in`, request.url);
    signInUrl.searchParams.set("redirectTo", target);
    return NextResponse.redirect(signInUrl);
  }

  // Admin area requires the Admin role (SuperAdmin is a superset and also allowed).
  if (isAdminRoute) {
    const roles = session!.user.roles;
    const canAccessAdmin =
      roles?.includes(UserRole.Admin) || roles?.includes(UserRole.SuperAdmin);
    if (!canAccessAdmin) {
      return NextResponse.redirect(new URL(`${localePrefix}/`, request.url));
    }
  }

  return intlResponse || NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};

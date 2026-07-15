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
import { localeForCountry } from "./i18n/locale-by-country";
import { getSession } from "./lib/auth/session";
import { UserRole } from "./types/common";

type Locale = (typeof routing.locales)[number];

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // The visitor's explicit language choice (cookie written by the locale switcher).
  // next-intl never writes it (localeCookie:false), so it's a pure record of intent.
  const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
  const cookieLocaleIsValid = !!cookieLocale && routing.locales.includes(cookieLocale as Locale);

  // Handle UNPREFIXED requests (raw next/link hrefs, "/"): with localeDetection off,
  // next-intl ignores the cookie and redirects them to the defaultLocale, which would
  // silently reset a visitor who has chosen another language. Intercept first and send
  // them to their chosen locale in a single hop. Must run BEFORE the intl redirect below.
  const rawSegments = request.nextUrl.pathname.split("/").filter(Boolean);
  const rawFirst = rawSegments[0];
  const rawIsPrefixed = routing.locales.includes(rawFirst as Locale);
  if (
    cookieLocaleIsValid &&
    !rawIsPrefixed &&
    cookieLocale !== routing.defaultLocale &&
    !request.nextUrl.pathname.startsWith(apiAuthPrefix)
  ) {
    const redirectUrl = new URL(
      `/${cookieLocale}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`,
      request.url,
    );
    redirectUrl.search = request.nextUrl.search;
    return NextResponse.redirect(redirectUrl);
  }

  // Geo-based first-paint language for NEW visitors (no explicit language cookie):
  // redirect an unprefixed request to the language of their detected country. The
  // country comes from Caddy's `X-Country` header (MaxMind GeoIP at the edge), so
  // the very first render is already localized — no flash of the default language.
  // We never write NEXT_LOCALE here: the cookie stays an exclusive record of an
  // explicit user choice, and this runs only while the visitor hasn't made one.
  // Falls through to the defaultLocale whenever there's no usable geo signal
  // (localhost, VPN, private IP, lookup miss) or the country maps to the default.
  const detectedCountry = request.headers.get("x-country");
  if (
    !cookieLocaleIsValid &&
    !rawIsPrefixed &&
    detectedCountry &&
    !request.nextUrl.pathname.startsWith(apiAuthPrefix)
  ) {
    const geoLocale = localeForCountry(detectedCountry);
    if (
      geoLocale !== routing.defaultLocale &&
      routing.locales.includes(geoLocale as Locale)
    ) {
      const redirectUrl = new URL(
        `/${geoLocale}${request.nextUrl.pathname === "/" ? "" : request.nextUrl.pathname}`,
        request.url,
      );
      redirectUrl.search = request.nextUrl.search;
      return NextResponse.redirect(redirectUrl);
    }
  }

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

  // Prefixed URL whose locale differs from the chosen one (e.g. browser Back lands
  // on a pre-switch /fa/... entry that hits the server) → redirect to the chosen one.
  if (
    isValidLocale &&
    !pathname.startsWith(apiAuthPrefix) &&
    cookieLocaleIsValid &&
    cookieLocale !== locale
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

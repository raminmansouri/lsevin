import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import {
  adminPrefix,
  apiAuthPrefix,
  authRoutes,
  DEFAULT_SIGNIN_REDIRECT,
  publicRoutes,
} from "@/lib/auth/routes";

import { routing } from "./i18n/routing";
import { getSession } from "./lib/auth/session";
import { UserRole } from "./types/common";

type Locale = (typeof routing.locales)[number];

const intlMiddleware = createIntlMiddleware({
    ...routing,
  localeDetection: true
});

export default async function middleware(request: NextRequest) {
  const intlResponse = await intlMiddleware(request);
  const pathname = intlResponse?.headers.get("x-middleware-rewrite")
    ? new URL(
        intlResponse.headers.get("x-middleware-rewrite") || "",
        request.url
      ).pathname
    : request.nextUrl.pathname;

  // Always allow auth API routes to pass through
  const isAuthApiRoute = pathname.startsWith(apiAuthPrefix);
  if (isAuthApiRoute) {
    return intlResponse || NextResponse.next();
  }

  const session = await getSession({ redirectToLogin: false });
  const isLoggedIn = !!session?.user;

  const pathSegments = pathname.split("/").filter(Boolean);
  const potentialLocale = pathSegments[0];
  const isValidLocale = routing.locales.includes(potentialLocale as Locale);
  const locale = isValidLocale
    ? (potentialLocale as Locale)
    : routing.defaultLocale;
  const localePrefix = `/${locale}`;

  const isAdminRoute = pathname.includes(adminPrefix);
  const isPublicRoute = publicRoutes.some((route) => {
    return (
      pathname === route ||
      pathname === `${localePrefix}${route}` ||
      publicRoutes.some((r) =>
        pathname.match(new RegExp(`^(\/[a-z]{2})?${r}$`))
      )
    );
  });

  const isAuthRoute = authRoutes.some((route) => {
    const pattern = route
      .replace(/:[^/]+/g, "[^/]+") // Replace :param with regex pattern
      .replace(/\//g, "\\/"); // Escape forward slashes

    const regex = new RegExp(`^(\/[a-z]{2})?\/${pattern}$`);
    return regex.test(pathname);
  });

  if (isAuthRoute) {
    if (isLoggedIn) {
      // const localizedDefaultRedirect = `${localePrefix}${DEFAULT_SIGNIN_REDIRECT}`;
      return NextResponse.redirect(
        new URL(DEFAULT_SIGNIN_REDIRECT, request.url)
      );
    }
    return intlResponse || NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    // let callbackUrl = pathname;
    // if (request.nextUrl.search) {
    //   callbackUrl += request.nextUrl.search;
    // }

    // const encodedCallbackUrl = `?redirectTo=${encodeURIComponent(callbackUrl)}`;

    const onBoardingPath = `${localePrefix}/on-boarding`;

    return NextResponse.redirect(new URL(`${onBoardingPath}`, request.url));
  }

  if (isAdminRoute && isLoggedIn) {
    const {
      user: { roles },
    } = session!;
    if (!roles?.includes(UserRole.Admin)) {
      return NextResponse.redirect(new URL(`${localePrefix}/`, request.url));
    }
  }

  return intlResponse || NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.png$|manifest).*)",
  ],
};

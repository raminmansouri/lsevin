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

  const session = await getSession({ redirectToLogin: false });
  const isLoggedIn = !!session?.user;

  const segments = pathname.split("/").filter(Boolean);
  const potentialLocale = segments[0];
  const isValidLocale = routing.locales.includes(potentialLocale as Locale);
  const locale = isValidLocale ? (potentialLocale as Locale) : routing.defaultLocale;
  const localePrefix = `/${locale}`;

  const isAdminRoute = pathname.includes(adminPrefix);

  const isPublicRoute = publicRoutes.some((route) => {
    return (
      pathname === route ||
      pathname === `${localePrefix}${route}` ||
      publicRoutes.some((r) => pathname.match(new RegExp(`^(\/[a-z]{2})?${r}$`)))
    );
  });

  const isAuthRoute = authRoutes.some((route) => {
    const pattern = route.replace(/:[^/]+/g, "[^/]+").replace(/\//g, "\\/");
    return new RegExp(`^(\/[a-z]{2})?\/${pattern}$`).test(pathname);
  });

  if (isAuthRoute) {
    if (isLoggedIn) {
      // Optional: keep locale when redirecting after login
      return NextResponse.redirect(new URL(`${localePrefix}${DEFAULT_SIGNIN_REDIRECT}`, request.url));
    }
    return intlResponse || NextResponse.next();
  }

  if (!isLoggedIn && !isPublicRoute) {
    return NextResponse.redirect(new URL(`${localePrefix}/on-boarding`, request.url));
  }

  if (isAdminRoute && isLoggedIn) {
    const roles = session!.user.roles;
    if (!roles?.includes(UserRole.Admin)) {
      return NextResponse.redirect(new URL(`${localePrefix}/`, request.url));
    }
  }

  return intlResponse || NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|.*\\..*).*)"],
};

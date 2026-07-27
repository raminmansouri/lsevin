import createIntlMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";

import {
  adminPrefix,
  apiAuthPrefix,
  authRoutes,
  DEFAULT_SIGNIN_REDIRECT,
  isProtectedPath,
} from "@/lib/auth/routes";

import { routing } from "./src/i18n/routing";
import { getSession } from "./src/lib/auth/session";
import { UserRole } from "./src/types/common";

type Locale = (typeof routing.locales)[number];

const intlMiddleware = createIntlMiddleware(routing);

export default async function middleware(request: NextRequest) {
  // The financial panel is a separate product on its own host with its own credentials.
  // It shares this Next.js process, so the host is what separates them: everything on
  // financial.lsevin.com is served from /financial and nothing else, and no locale
  // prefix, admin gate or customer session logic below applies to it. Its own layout
  // does the auth check, because only a database lookup can see a revoked session.
  const host = request.headers.get("host")?.split(":")[0]?.toLowerCase() ?? "";
  if (host.startsWith("financial.")) {
    const path = request.nextUrl.pathname;
    if (path.startsWith("/financial") || path.startsWith("/_next") || path.startsWith("/api/")) {
      return NextResponse.next();
    }
    const url = request.nextUrl.clone();
    url.pathname = `/financial${path === "/" ? "" : path}`;
    return NextResponse.rewrite(url);
  }

  // The panel must not be reachable from the main host — otherwise "separate" is only
  // a URL, and appmain.lsevin.com/financial would be a second door to the books.
  if (request.nextUrl.pathname.startsWith("/financial")) {
    return new NextResponse(null, { status: 404 });
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

  // Locale-prefixed API routes are machine endpoints and must never be sent to
  // sign-in. Every one of them is a payment gateway callback, and `isProtectedPath`
  // matches by segment — so "wallet" in protectedSegments was gating
  // /{locale}/api/wallet/payments/{gateway}/callback. A customer whose session had
  // expired during checkout, or who paid in a different browser, was redirected to
  // sign-in instead of being verified: the money left their account and the top-up
  // was never credited. These routes authenticate themselves against the gateway
  // (they re-read the invoice before crediting), which is the only trustworthy
  // signal here anyway — the visitor's cookie is not.
  const isApiRoute = pathnameWithoutLocale.startsWith("/api/");
  const isProtectedRoute = !isApiRoute && isProtectedPath(pathnameWithoutLocale);

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

  // Auth pages: if another trusted in-app flow supplied a relative redirectTo
  // (notably the provider-portal SSO bridge), honor it for an already logged-in
  // user instead of dropping the callback and sending them to the home page.
  if (isAuthRoute) {
    if (isLoggedIn) {
      const requestedRedirect = request.nextUrl.searchParams.get("redirectTo")?.trim();
      if (
        requestedRedirect &&
        requestedRedirect.startsWith("/") &&
        !requestedRedirect.startsWith("//")
      ) {
        const target = new URL(requestedRedirect, request.url);
        if (target.origin === request.nextUrl.origin) {
          return NextResponse.redirect(target);
        }
      }
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

import { NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import {
  createProviderPortalSsoToken,
  isProviderPortalSsoConfigured,
  LSEVIN_PROVIDER_SSO_COOKIE,
  LSEVIN_PROVIDER_SSO_MAX_AGE,
  LSEVIN_SHARED_LOCALE_COOKIE,
  lsevinSharedCookieDomain,
} from "@/lib/auth/provider-portal-sso";

function normalizedLocale(request: NextRequest) {
  const candidate =
    request.cookies.get(LSEVIN_SHARED_LOCALE_COOKIE)?.value ||
    request.cookies.get("NEXT_LOCALE")?.value ||
    routing.defaultLocale;
  return routing.locales.includes(candidate as (typeof routing.locales)[number])
    ? candidate
    : routing.defaultLocale;
}

function providerOrigin() {
  const configured = process.env.LSEVIN_PROVIDER_PORTAL_URL?.trim() || "https://providers.lsevin.com";
  try {
    return new URL(configured).origin;
  } catch {
    return "https://providers.lsevin.com";
  }
}

function safeReturnTo(request: NextRequest) {
  const origin = providerOrigin();
  const raw = request.nextUrl.searchParams.get("returnTo");
  if (!raw) return new URL("/dashboard", origin);
  try {
    const target = new URL(raw, origin);
    return target.origin === origin ? target : new URL("/dashboard", origin);
  } catch {
    return new URL("/dashboard", origin);
  }
}

export async function GET(request: NextRequest) {
  if (!isProviderPortalSsoConfigured()) {
    return NextResponse.json(
      { error: "Provider portal SSO is not configured. Set LSEVIN_SSO_SECRET (preferred) or AUTH_SECRET." },
      { status: 503 },
    );
  }

  const locale = normalizedLocale(request);
  const returnTo = safeReturnTo(request);
  const session = await auth();

  if (!session?.user?.id) {
    const bridgePath = `${request.nextUrl.pathname}?returnTo=${encodeURIComponent(returnTo.toString())}`;
    const signInUrl = new URL(`/${locale}/sign-in`, request.url);
    signInUrl.searchParams.set("redirectTo", bridgePath);
    return NextResponse.redirect(signInUrl);
  }

  const response = NextResponse.redirect(returnTo);
  const domain = lsevinSharedCookieDomain(request.nextUrl.hostname);
  response.cookies.set(LSEVIN_PROVIDER_SSO_COOKIE, createProviderPortalSsoToken(session.user.id), {
    httpOnly: true,
    secure: request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    domain,
    maxAge: LSEVIN_PROVIDER_SSO_MAX_AGE,
  });
  response.cookies.set(LSEVIN_SHARED_LOCALE_COOKIE, locale, {
    httpOnly: false,
    secure: request.nextUrl.protocol === "https:" || process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    domain,
    maxAge: 60 * 60 * 24 * 365,
  });
  return response;
}

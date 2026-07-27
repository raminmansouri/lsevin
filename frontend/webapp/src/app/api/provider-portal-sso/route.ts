import { NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import {
  createProviderPortalBridgeToken,
  isProviderPortalSsoConfigured,
  LSEVIN_SHARED_LOCALE_COOKIE,
} from "@/lib/auth/provider-portal-sso";

function normalizedLocale(request: NextRequest) {
  const candidate = request.cookies.get(LSEVIN_SHARED_LOCALE_COOKIE)?.value || request.cookies.get("NEXT_LOCALE")?.value || routing.defaultLocale;
  return routing.locales.includes(candidate as (typeof routing.locales)[number]) ? candidate : routing.defaultLocale;
}

function providerOrigin() {
  const configured = process.env.LSEVIN_PROVIDER_PORTAL_URL?.trim() || "https://providers.lsevin.com";
  try { return new URL(configured).origin; } catch { return "https://providers.lsevin.com"; }
}

function safeReturnTo(request: NextRequest) {
  const origin = providerOrigin();
  const raw = request.nextUrl.searchParams.get("returnTo");
  if (!raw) return new URL("/dashboard", origin);
  try {
    const target = new URL(raw, origin);
    return target.origin === origin ? target : new URL("/dashboard", origin);
  } catch { return new URL("/dashboard", origin); }
}

function providerCallbackUrl(token: string) {
  const callback = new URL("/api/lsevin-sso/callback", providerOrigin());
  callback.searchParams.set("token", token);
  return callback;
}

export async function GET(request: NextRequest) {
  if (!isProviderPortalSsoConfigured()) {
    return NextResponse.json({ error: "Provider portal SSO is not configured on appmain. AUTH_SECRET or LSEVIN_SSO_SECRET is required." }, { status: 503 });
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

  // Appmain signs a very short-lived assertion with its own secret. Providers
  // does not need that secret: it verifies the assertion server-to-server with
  // appmain before creating its own local/shared-domain session cookie.
  const token = createProviderPortalBridgeToken(session.user.id, returnTo.toString(), locale);
  return NextResponse.redirect(providerCallbackUrl(token));
}

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { createProviderPortalExchangeToken } from "@/features/provider-sso/server/token";
import {
  normalizePortalLocale,
  providerPortalSsoSecret,
  validateProviderCallback,
} from "@/features/provider-sso/server/util";

export const dynamic = "force-dynamic";

function sharedCookieDomain() {
  return process.env.NEXT_PUBLIC_LSEVIN_COOKIE_DOMAIN?.trim() || process.env.LSEVIN_SHARED_COOKIE_DOMAIN?.trim() || (process.env.NODE_ENV === "production" ? ".lsevin.com" : undefined);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const callback = validateProviderCallback(url.searchParams.get("returnTo"));
  const state = url.searchParams.get("state")?.trim();
  const locale = normalizePortalLocale(request.cookies.get("NEXT_LOCALE")?.value || url.searchParams.get("locale"));
  const mode = url.searchParams.get("mode") === "signup" ? "sign-up" : "sign-in";
  if (!callback || !state || state.length < 32 || state.length > 256) {
    return NextResponse.json({ error: "Invalid provider SSO request." }, { status: 400 });
  }

  const session = await getSession({ redirectToLogin: false, adminRequired: false });
  if (!session?.user?.id) {
    const signIn = new URL(`/${locale}/${mode}`, url.origin);
    signIn.searchParams.set("redirectTo", `${url.pathname}${url.search}`);
    return NextResponse.redirect(signIn);
  }

  const token = createProviderPortalExchangeToken({
    subject: session.user.id,
    locale,
    secret: providerPortalSsoSecret(),
  });
  callback.searchParams.set("token", token);
  callback.searchParams.set("state", state);
  const response = NextResponse.redirect(callback);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  response.headers.append("Set-Cookie", `NEXT_LOCALE=; Path=/; Max-Age=0; SameSite=Lax${secure}`);
  const domain = sharedCookieDomain();
  response.headers.append(
    "Set-Cookie",
    `NEXT_LOCALE=${encodeURIComponent(locale)}; Path=/; Max-Age=${365 * 24 * 60 * 60}; SameSite=Lax${domain ? `; Domain=${domain}` : ""}${secure}`,
  );
  return response;
}

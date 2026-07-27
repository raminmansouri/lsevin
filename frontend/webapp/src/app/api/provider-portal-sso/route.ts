import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { routing } from "@/i18n/routing";
import { auth } from "@/lib/auth";
import { publicAppOrigin, publicAppUrl } from "@/lib/http/public-origin";
import {
  createProviderPortalBridgeToken,
  isProviderPortalSsoConfigured,
  isProviderPortalSsoDebugEnabled,
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
  if (!raw) return { url: new URL("/dashboard", origin), warning: null as string | null };
  try {
    const target = new URL(raw, origin);
    if (target.origin === origin) return { url: target, warning: null as string | null };
    return { url: new URL("/dashboard", origin), warning: `returnTo origin ${target.origin} does not match provider origin ${origin}` };
  } catch { return { url: new URL("/dashboard", origin), warning: "returnTo is not a valid URL" }; }
}

function providerCallbackUrl(token: string) {
  const callback = new URL("/api/lsevin-sso/callback", providerOrigin());
  callback.searchParams.set("token", token);
  return callback;
}

function escapeHtml(value: unknown) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");
}

function safeDebugText(value: unknown) {
  const text = value instanceof Error ? `${value.name}: ${value.message}` : String(value ?? "");
  return text
    .replace(/(postgres(?:ql)?:\/\/)[^@\s]+@/gi, "$1[redacted]@")
    .replace(/(password|secret|token|authorization)(\s*[=:]\s*)[^\s,;<]+/gi, "$1$2[redacted]")
    .replace(/[A-Za-z0-9_-]{80,}/g, "[long-value-redacted]")
    .slice(0, 2000);
}

function debugFailure(stage: string, code: string, traceId: string, details: Record<string, unknown>, status = 500) {
  console.error(`[provider-sso][${traceId}] ${stage}/${code}`, details);
  if (!isProviderPortalSsoDebugEnabled()) return NextResponse.json({ error: code }, { status });
  const rows = Object.entries(details).map(([key, value]) => `<tr><th>${escapeHtml(key)}</th><td><pre>${escapeHtml(typeof value === "string" ? value : JSON.stringify(value, null, 2))}</pre></td></tr>`).join("");
  return new Response(`<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>LSevin SSO debug</title><style>body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:32px}.box{max-width:900px;margin:auto;background:white;border:1px solid #e2e8f0;border-radius:16px;padding:24px}h1{color:#991b1b}table{width:100%;border-collapse:collapse}th,td{vertical-align:top;text-align:left;border-top:1px solid #e2e8f0;padding:10px}th{width:200px;color:#475569}pre{white-space:pre-wrap;word-break:break-word}</style></head><body><div class="box"><h1>AppMain provider SSO diagnostic</h1><p>Debug mode stopped the normal fallback.</p><table><tr><th>Stage</th><td><code>${escapeHtml(stage)}</code></td></tr><tr><th>Error code</th><td><code>${escapeHtml(code)}</code></td></tr><tr><th>Trace ID</th><td><code>${escapeHtml(traceId)}</code></td></tr>${rows}</table><p>No SSO assertion, session token, password or secret is rendered.</p></div></body></html>`, { status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow" } });
}

export async function GET(request: NextRequest) {
  const traceId = randomUUID();
  if (!isProviderPortalSsoConfigured()) {
    return debugFailure("appmain-configuration", "sso-not-configured", traceId, {
      authSecretPresent: Boolean(process.env.AUTH_SECRET?.trim()),
      lsevinSsoSecretPresent: Boolean(process.env.LSEVIN_SSO_SECRET?.trim()),
      providerPortalUrl: providerOrigin(),
      appmainPublicOrigin: publicAppOrigin(request),
      requestOrigin: request.nextUrl.origin,
    }, 503);
  }

  const locale = normalizedLocale(request);
  const returnToResult = safeReturnTo(request);
  if (returnToResult.warning && isProviderPortalSsoDebugEnabled()) {
    return debugFailure("appmain-return-to", "invalid-return-to", traceId, { warning: returnToResult.warning, rawReturnToPresent: request.nextUrl.searchParams.has("returnTo"), providerOrigin: providerOrigin() }, 400);
  }

  let session;
  try { session = await auth(); }
  catch (error) {
    return debugFailure("appmain-session", "auth-session-read-failed", traceId, { error: safeDebugText(error), locale, providerOrigin: providerOrigin(), appmainPublicOrigin: publicAppOrigin(request), requestOrigin: request.nextUrl.origin }, 500);
  }

  if (!session?.user?.id) {
    const bridgePath = `${request.nextUrl.pathname}?returnTo=${encodeURIComponent(returnToResult.url.toString())}`;
    const signInUrl = publicAppUrl(request, `/${locale}/sign-in`);
    signInUrl.searchParams.set("redirectTo", bridgePath);
    return NextResponse.redirect(signInUrl);
  }

  let token: string;
  try { token = createProviderPortalBridgeToken(session.user.id, returnToResult.url.toString(), locale); }
  catch (error) {
    return debugFailure("appmain-assertion-create", "assertion-create-failed", traceId, { error: safeDebugText(error), sessionUserIdPresent: Boolean(session.user.id), locale, providerOrigin: providerOrigin() }, 500);
  }

  const response = NextResponse.redirect(providerCallbackUrl(token));
  response.headers.set("X-LSevin-SSO-Trace", traceId);
  return response;
}

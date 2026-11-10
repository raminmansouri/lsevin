import { NextRequest, NextResponse } from "next/server";

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function providerPortalOrigin() {
  const configured = process.env.LSEVIN_PROVIDER_PORTAL_URL?.trim() || "https://providers.lsevin.com";
  try { return new URL(configured).origin; } catch { return "https://providers.lsevin.com"; }
}

/**
 * "This page is mine" on a provider or doctor page: opens the claim form for that page in the
 * provider portal. The portal asks the person to sign in first and keeps the page selected.
 */
export function GET(request: NextRequest) {
  const type = request.nextUrl.searchParams.get("type");
  const id = request.nextUrl.searchParams.get("id") ?? "";
  const target = new URL("/claim", providerPortalOrigin());
  if ((type === "provider" || type === "staff") && GUID.test(id)) {
    target.pathname = "/claim/new";
    target.searchParams.set("type", type);
    target.searchParams.set("id", id);
  }
  return NextResponse.redirect(target);
}

import { NextRequest, NextResponse } from "next/server";

import { verifyProviderPortalBridgeToken } from "@/lib/auth/provider-portal-sso";

export async function POST(request: NextRequest) {
  let token = "";
  try {
    const body = await request.json() as { token?: unknown };
    token = typeof body.token === "string" ? body.token : "";
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }

  const payload = verifyProviderPortalBridgeToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired provider SSO assertion." }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  return NextResponse.json({
    userId: payload.sub,
    returnTo: payload.returnTo,
    locale: payload.locale || null,
    expiresAt: payload.exp,
  }, { status: 200, headers: { "Cache-Control": "no-store, max-age=0" } });
}

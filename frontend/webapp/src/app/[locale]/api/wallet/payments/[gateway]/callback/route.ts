import { NextRequest, NextResponse } from "next/server";

import { verifyWalletTopUpPayment } from "@/features/wallet/payment-callback";

/**
 * The single return endpoint for every wallet top-up gateway.
 *
 * There used to be a `zarinpal/callback` sibling next to this one. Because a
 * static segment beats a dynamic one, that sibling — not this handler — served
 * every Zarinpal return, even though the callback URL is built from
 * `${gateway}` and reads as if it lands here (features/wallet/payment-gateway.ts).
 * The two also disagreed on what they put on the redirect: `payment` there,
 * `walletPaymentStatus` here. Anyone reading this file to learn what Zarinpal
 * does was reading dead code. One handler now, one contract.
 *
 * `getAppBaseUrl` is the Zarinpal version's, kept deliberately: behind Caddy the
 * request origin is the internal one, so redirecting to `request.nextUrl.origin`
 * could send a paying customer to an unreachable host.
 */
function getAppBaseUrl(request: NextRequest) {
  const configured =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.APP_URL ||
    process.env.NEXTAUTH_URL;

  if (configured) return configured.replace(/\/$/, "");

  return `${request.nextUrl.protocol}//${request.nextUrl.host}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ locale: string; gateway: string }> }
) {
  const { locale, gateway } = await params;
  const authority =
    request.nextUrl.searchParams.get("Authority") ??
    request.nextUrl.searchParams.get("authority") ??
    "";
  const status =
    request.nextUrl.searchParams.get("Status") ??
    request.nextUrl.searchParams.get("status") ??
    "";

  const result = await verifyWalletTopUpPayment({ gateway, authority, status });

  const url = new URL(
    `/${locale || "fa"}/n/app/mobile/profile/wallet`,
    getAppBaseUrl(request)
  );
  url.searchParams.set("walletPaymentStatus", result.status);
  // `payment` is what the Zarinpal handler set before the merge. No wallet screen
  // reads either name today, so keeping both costs one query param and removes any
  // chance of this consolidation breaking a consumer. Drop it once the wallet page
  // actually renders the top-up result.
  url.searchParams.set("payment", result.status);
  if (result.message) url.searchParams.set("message", result.message);
  if ("referenceId" in result && result.referenceId) {
    url.searchParams.set("referenceId", String(result.referenceId));
  }

  return NextResponse.redirect(url);
}

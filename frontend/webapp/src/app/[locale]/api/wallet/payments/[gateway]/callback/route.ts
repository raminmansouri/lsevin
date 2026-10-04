import { NextRequest, NextResponse } from "next/server";

import { seoOrigin } from "@/lib/seo/origin";
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
 * Delegates to seoOrigin() (NEXT_PUBLIC_URL) rather than keeping its own env-var
 * fallback chain: that old chain (NEXT_PUBLIC_APP_URL/NEXT_PUBLIC_SITE_URL/
 * APP_URL/NEXTAUTH_URL) checked none of the vars actually set in production, so
 * `configured` was always empty and this fell back to request.nextUrl -- behind
 * Caddy that's the internal origin, exactly the unreachable-host redirect this
 * function's own original comment was written to avoid. See zarinpal.ts/
 * payment.service.ts for the matching callback_url fix.
 */
function getAppBaseUrl() {
  return seoOrigin();
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
    getAppBaseUrl()
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

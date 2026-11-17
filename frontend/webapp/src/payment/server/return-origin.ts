import "server-only";

import { currentRequestOrigin } from "@/lib/http/request-host";
import { seoOrigin } from "@/lib/seo/origin";

/**
 * Where to send the customer after a gateway return.
 *
 * Zibal payments start and come back on the domain the customer used (each domain has its own
 * token), so the customer stays on that domain and keeps their session cookie. The redirect
 * only ever targets the host the callback request itself arrived on.
 *
 * Zarinpal and BTCPay keep using the canonical origin, exactly as before.
 */
export async function gatewayReturnOrigin(gateway: string): Promise<string> {
  if (String(gateway).trim().toLowerCase() === "zibal") {
    const origin = await currentRequestOrigin();
    if (origin) return origin;
  }
  return seoOrigin();
}

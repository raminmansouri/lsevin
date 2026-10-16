import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

import { NextRequest, NextResponse } from "next/server";

/**
 * Same-origin image proxy for the shop.
 *
 * Product/category images on third-party hosts (stock photos, or any URL an admin
 * pasted into a product gallery) used to be loaded by the customer's browser
 * directly, which fails wherever the host blocks hotlinking, the URL is plain http
 * (the edge CSP upgrades it to https), or the network restricts third-party image
 * hosts. Routing them through here makes them same-origin.
 *
 * Any public http(s) host is allowed, so the target is checked before every hop:
 * only ports 80/443, never an address on a private, loopback or link-local
 * network, redirects followed by hand, and only image responses are passed on.
 * On an upstream failure it redirects to the original URL so behaviour never
 * gets worse than loading it directly.
 */

export const dynamic = "force-dynamic";

const MAX_REDIRECTS = 3;
const TIMEOUT_MS = 10_000;

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateAddress(ip: string): boolean {
  if (isIP(ip) === 4) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  const mapped = v6.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
  if (mapped) return isPrivateIPv4(mapped[1]);
  return (
    v6 === "::" ||
    v6 === "::1" ||
    v6.startsWith("fc") ||
    v6.startsWith("fd") ||
    v6.startsWith("fe8") ||
    v6.startsWith("fe9") ||
    v6.startsWith("fea") ||
    v6.startsWith("feb") ||
    v6.startsWith("ff")
  );
}

async function isPublicTarget(url: URL): Promise<boolean> {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  if (url.username || url.password) return false;
  if (url.port && url.port !== "80" && url.port !== "443") return false;
  const host = url.hostname.replace(/^\[|\]$/g, "");
  if (!host || host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) {
    return false;
  }
  if (isIP(host)) return !isPrivateAddress(host);
  try {
    const addresses = await lookup(host, { all: true });
    return addresses.length > 0 && addresses.every((a) => !isPrivateAddress(a.address));
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u");
  if (!raw) return new NextResponse("missing u", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("bad url", { status: 400 });
  }
  if (!(await isPublicTarget(target))) {
    return new NextResponse("host not allowed", { status: 400 });
  }
  const original = target.toString();

  try {
    let upstream: Response | null = null;
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      const res = await fetch(target.toString(), {
        headers: { accept: "image/*" },
        redirect: "manual",
        signal: AbortSignal.timeout(TIMEOUT_MS),
        // public image URLs are effectively immutable per URL
        next: { revalidate: 86_400 },
      });
      const location = res.status >= 300 && res.status < 400 ? res.headers.get("location") : null;
      if (!location) {
        upstream = res;
        break;
      }
      const next = new URL(location, target);
      if (!(await isPublicTarget(next))) return NextResponse.redirect(original, 302);
      target = next;
    }
    if (!upstream || !upstream.ok || !upstream.body) {
      return NextResponse.redirect(original, 302);
    }
    const contentType = upstream.headers.get("content-type") || "";
    if (!contentType.startsWith("image/") || contentType.includes("svg")) {
      return NextResponse.redirect(original, 302);
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "x-content-type-options": "nosniff",
        "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.redirect(original, 302);
  }
}

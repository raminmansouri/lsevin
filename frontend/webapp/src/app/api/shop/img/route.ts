import { NextRequest, NextResponse } from "next/server";

/**
 * Same-origin image proxy for the shop.
 *
 * Product/category images seeded from stock-photo hosts are loaded by the
 * customer's browser directly, which fails wherever an edge CSP or network
 * restricts third-party image hosts (the admin panel is unaffected because it
 * uses `next/image`, which fetches server-side). Routing the storefront images
 * through here makes them same-origin. Strictly allow-listed; on any failure it
 * redirects to the original URL so behaviour never gets worse.
 */

const ALLOWED_HOSTS = new Set([
  "images.unsplash.com",
  "plus.unsplash.com",
  "res.cloudinary.com",
]);

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("u");
  if (!raw) return new NextResponse("missing u", { status: 400 });

  let target: URL;
  try {
    target = new URL(raw);
  } catch {
    return new NextResponse("bad url", { status: 400 });
  }
  if (target.protocol !== "https:" || !ALLOWED_HOSTS.has(target.hostname)) {
    return new NextResponse("host not allowed", { status: 400 });
  }

  try {
    const upstream = await fetch(target.toString(), {
      headers: { accept: "image/*" },
      // upstream stock hosts are effectively immutable per URL
      next: { revalidate: 86_400 },
    });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.redirect(target.toString(), 302);
    }
    const contentType = upstream.headers.get("content-type") || "image/jpeg";
    if (!contentType.startsWith("image/")) {
      return NextResponse.redirect(target.toString(), 302);
    }
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "content-type": contentType,
        "cache-control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch {
    return NextResponse.redirect(target.toString(), 302);
  }
}

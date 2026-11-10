import { NextResponse } from "next/server";

import { resolvePublicEntity } from "@/lib/seo/public-slugs";
import { publicEntityPath } from "@/lib/seo/legacy-redirect";

// The old marketing template; this entity lives at /<locale>/providers/<slug>.
// A route handler, not a page: the (main) layout streams before a page-level
// redirect, which would turn the 308 into a 200 with a meta refresh.
export async function GET(_request: Request, { params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const ref = await resolvePublicEntity("provider", id);
  if (!ref) return new NextResponse(null, { status: 404 });
  // Relative, so the visitor stays on the host they came in on.
  return new NextResponse(null, { status: 308, headers: { Location: `/${locale}${publicEntityPath("provider", ref.slug ?? ref.id)}` } });
}

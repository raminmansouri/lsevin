import { NextRequest, NextResponse } from "next/server";

import { publicAppUrl } from "@/lib/http/public-origin";
import { resolvePublicEntity } from "@/lib/seo/public-slugs";
import { publicEntityPath } from "@/lib/seo/legacy-redirect";

// The old marketing template; this entity lives at /<locale>/specialties/<slug>.
// A route handler, not a page: the (main) layout streams before a page-level
// redirect, which would turn the 308 into a 200 with a meta refresh.
export async function GET(request: NextRequest, { params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  const ref = await resolvePublicEntity("specialty", id);
  if (!ref) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(publicAppUrl(request, `/${locale}${publicEntityPath("specialty", ref.slug ?? ref.id)}`), 308);
}

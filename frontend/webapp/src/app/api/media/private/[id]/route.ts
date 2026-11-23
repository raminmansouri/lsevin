import { NextRequest, NextResponse } from "next/server";
import sql from "@/config/database/db";
import { requireApiUser } from "@/lib/auth/api-guard";
import { can } from "@/lib/admin/access/policy";
import { getSession } from "@/lib/auth/session";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;
  const { id } = await context.params;
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return new NextResponse(null, { status: 404 });
  const rows = await sql<Array<{ file_url: string; mime_type: string; created_by: string | null }>>`
    select file_url, mime_type, created_by from media.media_library
    where id = ${id} and is_public = false limit 1
  `;
  const media = rows[0];
  if (!media || (!can(auth.access, "media", "view") && media.created_by !== auth.userId)) {
    return new NextResponse(null, { status: 404 });
  }
  const token = (await getSession())?.user?.accessToken;
  if (!token) return new NextResponse(null, { status: 401 });
  const storedPath = media.file_url.startsWith('http')
    ? new URL(media.file_url).pathname
    : `/files/${media.file_url.replace(/^\/?files\//, '').replace(/^\//, '')}`;
  if (!storedPath.startsWith('/files/CustomerDocument/') || storedPath.includes('..')) {
    return new NextResponse(null, { status: 502 });
  }
  const api = new URL(process.env.INTERNAL_API_URL!);
  const upstream = await fetch(new URL(storedPath, api.origin), {
    headers: { Authorization: `Bearer ${token}` }, cache: 'no-store',
  });
  if (!upstream.ok) return new NextResponse(null, { status: upstream.status });
  return new NextResponse(upstream.body, {
    headers: {
      'Content-Type': media.mime_type,
      'Content-Disposition': /^(image\/(png|jpeg|webp|gif)|application\/pdf)$/i.test(media.mime_type) ? 'inline' : 'attachment',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

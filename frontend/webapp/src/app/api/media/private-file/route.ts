import { NextRequest, NextResponse } from "next/server";

import db from "@/config/database/db";
import { can } from "@/lib/admin/access/policy";
import { isApiAdmin, requireApiUser } from "@/lib/auth/api-guard";
import { PRIVATE_FILE_PREFIX, proxyStoredFile, toStoredRelativePath } from "@/lib/files/private-link";

export const dynamic = "force-dynamic";

/**
 * Opens a private file (Private/...) for the media picker's previews and the patient's own
 * consultation photos. Allowed for: media staff, the account that uploaded it, and an account
 * linked to the patient whose health record holds it. Anything else answers 404, so a probe
 * cannot tell "not yours" from "missing".
 */
export async function GET(request: NextRequest) {
  const auth = await requireApiUser();
  if (auth instanceof NextResponse) return auth;

  const path = toStoredRelativePath(request.nextUrl.searchParams.get("path"));
  if (!path || !path.startsWith(PRIVATE_FILE_PREFIX)) return new NextResponse(null, { status: 404 });

  const [media] = await db<{ created_by: string | null; mime_type: string | null; original_name: string | null }[]>`
    select created_by::text as created_by, mime_type, original_name
    from media.media_library
    where file_url = ${path} or file_url = ${`/${path}`}
    order by create_date desc
    limit 1
  `;

  const isStaff = isApiAdmin(auth) || can(auth.access, "media", "view");
  let allowed = isStaff || (media?.created_by != null && media.created_by === auth.userId);
  if (!allowed) {
    const [linked] = await db<{ ok: number }[]>`
      select 1 as ok
      from patient.clinical_documents d
      join patient.account_patient_links l
        on l.patient_id = d.patient_id and l.account_id = ${auth.userId}::uuid
       and l.valid_until is null and l.access_role <> 'limited'
      where d.file_url = ${path} and d.status = 'active'
      limit 1
    `;
    allowed = Boolean(linked);
  }
  if (!allowed) return new NextResponse(null, { status: 404 });

  return proxyStoredFile(path, { mimeType: media?.mime_type, fileName: media?.original_name });
}

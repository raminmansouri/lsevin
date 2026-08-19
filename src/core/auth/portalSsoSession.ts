import "server-only";

import { createHash, randomBytes } from "node:crypto";
import { sql } from "@core/db/client";

export const LSEVIN_PROVIDER_SESSION_COOKIE = "lsevin_provider_session";
export const LSEVIN_PROVIDER_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function tokenHash(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export async function createPortalSsoSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const hash = tokenHash(token);
  await sql`
    insert into provider_portal.sso_sessions (token_hash, user_id, expires_at)
    values (${hash}, ${userId}::uuid, now() + interval '30 days')
  `;
  // Opportunistic cleanup keeps this tiny without a background job.
  await sql`delete from provider_portal.sso_sessions where expires_at <= now() or revoked_at is not null and revoked_at < now() - interval '7 days'`;
  return token;
}

export async function resolvePortalSsoSession(token?: string | null) {
  const normalized = String(token || "").trim();
  if (!normalized || normalized.length > 256) return null;
  const hash = tokenHash(normalized);
  const rows = await sql<{ userId: string }[]>`
    select user_id::text as "userId"
    from provider_portal.sso_sessions
    where token_hash = ${hash}
      and revoked_at is null
      and expires_at > now()
    limit 1
  `;
  return rows[0]?.userId ?? null;
}

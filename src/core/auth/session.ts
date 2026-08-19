import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "@core/db/client";
import { buildLsevinSsoUrl, PORTAL_SESSION_COOKIE, safeReturnTo, verifyPortalSession } from "./sso";
import { isLocalDevAuthEnabled } from "./localDevAuth";
import { getPortalLocale } from "@core/i18n/server";

const uuidSchema = z.string().uuid();
const NIL_UUID = "00000000-0000-0000-0000-000000000000";

export type CurrentUser = {
  id: string;
  email: string;
  fullName: string;
  phone?: string | null;
};

async function readCandidateUserId() {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const headerName = process.env.LSEVIN_USER_ID_HEADER || "x-lsevin-user-id";

  const signedSession = cookieStore.get(PORTAL_SESSION_COOKIE)?.value;
  if (signedSession) {
    try {
      return verifyPortalSession(signedSession).userId;
    } catch {
      // Treat expired or tampered cookies as unauthenticated. The SSO handoff
      // will issue a fresh portal session without trusting client identity.
    }
  }

  const allowTrustedHeader = process.env.ALLOW_TRUSTED_USER_HEADER === "true" && process.env.TRUSTED_PROXY_ENFORCED === "true";
  const fromHeader = allowTrustedHeader ? headerStore.get(headerName) : null;
  if (fromHeader && fromHeader !== NIL_UUID && uuidSchema.safeParse(fromHeader).success) return fromHeader;

  const devUserId = process.env.NODE_ENV !== "production" ? process.env.PROVIDER_PORTAL_DEV_USER_ID : null;
  if (devUserId && devUserId !== NIL_UUID && uuidSchema.safeParse(devUserId).success) return devUserId;

  return null;
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const userId = await readCandidateUserId();
  if (!userId) return null;

  try {
    const rows = await sql<CurrentUser[]>`
      select
        u.id::text as id,
        u.email,
        trim(concat_ws(' ', u.first_name, u.last_name)) as "fullName",
        concat_ws(' ', u.phone_number_country_code, u.phone_number) as phone
      from identity.asp_net_users u
      where u.id = ${userId}::uuid
        and coalesce(u.user_state, 'Active') = 'Active'
      limit 1
    `;

    return rows[0] ?? null;
  } catch (cause) {
    const error = new Error(
      "The provider portal could not read the authenticated LSevin user. Verify the configured database connection and that the selected LSevin identity exists in identity.asp_net_users.",
      { cause },
    );
    error.name = "PortalAuthenticationDataSourceError";
    throw error;
  }
}

export async function requireCurrentUser(returnTo?: string) {
  const user = await getCurrentUser();
  if (!user) {
    const locale = await getPortalLocale();
    if (isLocalDevAuthEnabled()) {
      redirect(`/login?returnTo=${encodeURIComponent(safeReturnTo(returnTo))}`);
    }
    const ssoUrl = buildLsevinSsoUrl(returnTo, locale.locale);
    const legacyLoginUrl = process.env.LSEVIN_LOGIN_URL?.trim();
    redirect(ssoUrl || legacyLoginUrl || "/?auth=required");
  }
  return user;
}

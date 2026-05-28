import "server-only";

import { getSession } from "@/lib/auth/session";

export async function getCurrentUserId() {
  const session = await getSession();
  return session?.user?.id as string | undefined;
}

// Temporary development mode: do not block provider portal pages when a local
// session/member row is missing. Replace this with a throwing guard before production.
export async function requireCurrentUserId() {
  const userId = await getCurrentUserId();
  return (
    userId ||
    process.env.PROVIDER_PORTAL_DEV_USER_ID ||
    "00000000-0000-0000-0000-000000000000"
  );
}

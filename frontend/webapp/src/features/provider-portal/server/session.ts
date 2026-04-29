import "server-only";

import { getSession } from "@/lib/auth/session";

export async function getCurrentUserId(redirectToLogin = true, adminRequired = false) {
  const session = await getSession({ redirectToLogin, adminRequired });
  return session?.user?.id as string | undefined;
}

export async function requireCurrentUserId(adminRequired = false) {
  const userId = await getCurrentUserId(true, adminRequired);
  if (!userId) throw new Error("You must be signed in.");
  return userId;
}

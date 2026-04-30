import "server-only";

import { getSession } from "@/lib/auth/session";

export async function getCurrentUserId() {
  const session = await getSession();
  return session?.user?.id as string | undefined;
}

export async function requireCurrentUserId() {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("You must be signed in.");
  return userId;
}

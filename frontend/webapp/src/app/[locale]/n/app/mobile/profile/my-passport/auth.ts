import { getSession } from "@/lib/auth/session";

export async function requireAuthenticatedUserId(): Promise<string> {
  const session = await getSession();
  return session?.user?.id;
}

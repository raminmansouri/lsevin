import { getSession } from "@/lib/auth/session";

/**
 * Replace this adapter with your real auth/session lookup.
 * Keep the return value as the authenticated identity.asp_net_users.id.
 */
export async function getCurrentUserIdOrThrow(): Promise<string> {
  const session=await getSession();
   const id =session?.user?.id;
   return id;
  /* throw new Error(
    "Implement getCurrentUserIdOrThrow() in app/share/auth.ts so the share page can resolve the signed-in user."
  ); */
}

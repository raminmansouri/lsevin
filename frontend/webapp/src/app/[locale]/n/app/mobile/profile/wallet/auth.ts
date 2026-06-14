import { getSession } from "@/lib/auth/session";

/**
 * Replace this adapter with your real auth/session lookup.
 * Keep the return value as the authenticated identity.asp_net_users.id.
 */
export async function getCurrentUserIdOrThrow(): Promise<string> {
  const session=await getSession(); // You can remove this line if your session retrieval is synchronous
  if (!session?.user?.id) {
    throw new Error("User is not authenticated");
  }
  return session.user.id;
}
  // throw new Error(
  //   "Implement getCurrentUserIdOrThrow() in app/wallet/auth.ts so the wallet can resolve the signed-in user."
  // );

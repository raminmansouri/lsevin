/**
 * Replace this adapter with your real auth/session lookup.
 * Keep the return value as the authenticated identity.asp_net_users.id.
 */
export async function getCurrentUserIdOrThrow(): Promise<string> {
  throw new Error(
    "Implement getCurrentUserIdOrThrow() in app/wallet/auth.ts so the wallet can resolve the signed-in user."
  );
}

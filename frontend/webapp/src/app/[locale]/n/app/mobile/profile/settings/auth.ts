import { getSession } from "@/lib/auth/session";
import { cookies, headers } from "next/headers";

const CANDIDATE_KEYS = [
  "x-user-id",
  "x-identity-user-id",
  "user-id",
  "identity-user-id",
  "auth_user_id",
  "userId",
  "identityUserId",
];

export async function requireIdentityUserId(): Promise<string> {
    const session=await getSession();
  const identityUserId=session?.user?.id;

  return identityUserId;
}

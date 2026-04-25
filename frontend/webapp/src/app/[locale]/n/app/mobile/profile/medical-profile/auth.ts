import { getSession } from "@/lib/auth/session";
import { cookies, headers } from "next/headers";

export async function requireAuthenticatedUserId(): Promise<string> {
  
  const session=await getSession();
  return session?.user?.id;
}

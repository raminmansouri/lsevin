/**
 * Signs a real NextAuth (v5, JWT strategy) session cookie for a seeded user, so
 * E2E tests sign in as a customer / provider / admin without the external
 * identity API. The app verifies it with its own AUTH_SECRET exactly like a
 * cookie issued by a real sign-in; nothing in the app is bypassed.
 */
import type { BrowserContext } from "@playwright/test";
import { encode } from "next-auth/jwt";

import { E2E_AUTH_SECRET, E2E_BASE_URL } from "./env";

export const SESSION_COOKIE = "authjs.session-token";

export type SessionUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roles?: string[];
};

export async function sessionCookieValue(user: SessionUser): Promise<string> {
  if (!E2E_AUTH_SECRET) throw new Error("No AUTH_SECRET available for the Tours E2E suite (set TOURS_E2E_AUTH_SECRET).");
  const now = Date.now();
  return encode({
    secret: E2E_AUTH_SECRET,
    salt: SESSION_COOKIE,
    maxAge: 60 * 60 * 8,
    token: {
      sub: user.id,
      user: {
        id: user.id,
        userName: user.email,
        email: user.email,
        phoneNumberCountryCode: "+98",
        phoneNumber: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        roles: user.roles ?? ["user"],
        userState: "Active",
        createdAt: new Date(now - 86_400_000).toISOString(),
        accessToken: "e2e-not-used",
        refreshToken: "e2e-not-used",
        accessTokenExpires: now + 60 * 60 * 8 * 1000,
        refreshTokenExpires: now + 60 * 60 * 24 * 1000,
      },
    } as never,
  });
}

export async function signIn(context: BrowserContext, user: SessionUser) {
  const url = new URL(E2E_BASE_URL);
  await context.addCookies([
    { name: SESSION_COOKIE, value: await sessionCookieValue(user), domain: url.hostname, path: "/", httpOnly: true, sameSite: "Lax", secure: url.protocol === "https:" },
  ]);
}

export async function signOut(context: BrowserContext) {
  await context.clearCookies({ name: SESSION_COOKIE });
}

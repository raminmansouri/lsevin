import "server-only";

import { cache } from "react";

import { auth } from "@/lib/auth";
import { RequestAuthParams } from "@/types/common";

// Pure session read. It used to call logout() (which writes cookies) when there
// was no session, but cookies cannot be modified during a server-component
// render — and force-logging-out guests breaks browse-by-default. Gating guests
// out of protected areas is the middleware's responsibility now; here we simply
// return the session (or null) and let callers handle the unauthenticated case.
export const getSession = cache(
  async (_params: RequestAuthParams = { redirectToLogin: true, adminRequired: false }) => {
    return await auth();
  }
);

export const getAccessToken = cache(
  async (
    { redirectToLogin = true, adminRequired = false }: RequestAuthParams = {
      redirectToLogin: true,
      adminRequired: false,
    }
  ) => {
    const session = await getSession({ redirectToLogin, adminRequired });
    return session?.user.accessToken;
  }
);

export const getUserId = cache(
  async (
    { redirectToLogin = true, adminRequired = false }: RequestAuthParams = {
      redirectToLogin: true,
      adminRequired: false,
    }
  ) => {
    const session = await getSession({ redirectToLogin, adminRequired });
    return session?.user.id;
  }
);

export const getUserRoles = cache(
  async (
    { redirectToLogin = true, adminRequired = false }: RequestAuthParams = {
      redirectToLogin: true,
      adminRequired: false,
    }
  ) => {
    const session = await getSession({ redirectToLogin, adminRequired });
    return session?.user.roles;
  }
);

export const getUser = cache(async () => {
  const session = await getSession();
  return session?.user;
});

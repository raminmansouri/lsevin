import "server-only";

import { cache } from "react";

import { logout } from "@/features/auth/actions/logout";
import { auth } from "@/lib/auth";
import { RequestAuthParams, UserRole } from "@/types/common";

export const getSession = cache(
  async (
    { redirectToLogin = true, adminRequired = false }: RequestAuthParams = {
      redirectToLogin: true,
      adminRequired: false,
    }
  ) => {
    const session = await auth();

    if (!session) {
      if (redirectToLogin) {
        logout();
      }
    }

    if (adminRequired && !session?.user.roles?.includes(UserRole.Admin)) {
      logout();
    }

    return session;
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

import { jwtDecode } from "jwt-decode";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { env } from "@/config/env/client";
import { IDENTITY_MODULE_BASE_PATH } from "@/features/shared/types/constants";

import { authConfig } from "./auth.config";
import { refreshAccessTokenWithDeduplication } from "./token-refresh-manager";

const verifyOtp = async (
  credentials: Partial<Record<"code" | "phoneNumber", unknown>>
): Promise<Response | null> => {
  if (!credentials.code || typeof credentials.code !== "string") {
    return null;
  }

  if (!credentials.phoneNumber || typeof credentials.phoneNumber !== "string") {
    return null;
  }

  return fetch(
    `${env.NEXT_PUBLIC_API_URL}/${IDENTITY_MODULE_BASE_PATH}/identity/otp/verify`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        code: credentials.code,
        phoneNumber: credentials.phoneNumber,
      }),
    }
  );
};

// Token refresh logic has been moved to token-refresh-manager.ts for deduplication

const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 days in seconds

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
  unstable_update,
} = NextAuth({
  ...authConfig,
  pages: {
    signIn: "/sign-in",
  },
  session: {
    strategy: "jwt",
    maxAge: REFRESH_TOKEN_EXPIRY,
  },
  providers: [
    Credentials({
      credentials: {
        userNameOrEmail: {},
        password: {},
        remember: {},
        code: {},
        phoneNumber: {},
        isOtpVerification: {},
      },
      async authorize(credentials) {
        try {
          // This authorize callback is ONLY used for OTP verification
          // Initial login (password) is handled directly in sign-in action
          const isOtpFlow = credentials.isOtpVerification === "true";

          if (!isOtpFlow) {
            // This should never happen - initial login bypasses NextAuth
            console.error(
              "Invalid auth flow: password login should use sign-in action directly"
            );
            return null;
          }

          // Verify OTP code
          const response = await verifyOtp(credentials);

          if (!response?.ok) {
            return null;
          }

          const data = await response.json();

          // OTP verification response includes complete user details and tokens
          return {
            id: data.userId,
            userName: data.username,
            email: data.email,
            phoneNumberCountryCode: data.phoneNumberCountryCode,
            phoneNumber: data.phoneNumber,
            firstName: data.firstName,
            lastName: data.lastName,
            lastLoggedInAt: data.lastLoggedInAt
              ? new Date(data.lastLoggedInAt)
              : undefined,
            roles: data.roles,
            userState: data.userState,
            createdAt: new Date(data.createdAt),
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update" && session) {
        return {
          ...token,
          user: { ...token.user, ...session.user },
        };
      }

      if (user) {
        const decodedToken = jwtDecode(user.accessToken);
        return {
          ...token,
          user: {
            ...user,
            accessTokenExpires: (decodedToken.exp || 0) * 1000,
            refreshTokenExpires: Date.now() + REFRESH_TOKEN_EXPIRY * 1000,
          },
        };
      }

      // Return previous token if not expired
      if (token.user && token.user.accessTokenExpires) {
        if (Date.now() < token.user.accessTokenExpires) {
          return token;
        }

        // Don't refresh if refresh token is expired
        if (Date.now() >= token.user.refreshTokenExpires) {
          return { ...token, error: "RefreshTokenError" };
        }
      }

      // Access token has expired, try to refresh it using deduplication manager
      return await refreshAccessTokenWithDeduplication(token);
    },
    async session({ session, token }) {
      if (token.error) {
        throw new Error("RefreshTokenError");
      }

      Object.assign(session.user, token.user ?? {});
      return session;
    },
  },
});

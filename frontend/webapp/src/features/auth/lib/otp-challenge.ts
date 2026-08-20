import "server-only";

import { cookies } from "next/headers";

/**
 * The phone number awaiting OTP verification.
 *
 * It used to be a URL path segment (/{locale}/otp/{mobile}). A path segment is the
 * worst place for it: it lands in the access log of every proxy in front of the app,
 * rides along in the Referer header of anything the OTP page loads, sits in the
 * visitor's history and gets shipped to analytics — all for a value that only the
 * server needs. Here it is an httpOnly cookie the browser cannot read, scoped to a
 * few minutes.
 *
 * Short TTL on purpose: this is a challenge in flight, not a session. If it expires
 * the OTP page sends the visitor back to sign in, which is the same thing that has
 * to happen anyway once the code itself expires.
 */
import {
  OTP_CHALLENGE_TTL_SECONDS,
  OTP_PHONE_COOKIE,
} from "./otp-challenge.constants";

export const setOtpChallengePhone = async (phoneNumber: string) => {
  const store = await cookies();
  store.set(OTP_PHONE_COOKIE, phoneNumber, {
    httpOnly: true,
    sameSite: "lax",
    // The gateway terminates TLS in production; on a plain-http dev origin a
    // `secure` cookie would simply never be stored and every sign-in would bounce.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: OTP_CHALLENGE_TTL_SECONDS,
  });
};

export const readOtpChallengePhone = async (): Promise<string | null> => {
  const store = await cookies();
  return store.get(OTP_PHONE_COOKIE)?.value?.trim() || null;
};

export const clearOtpChallengePhone = async () => {
  const store = await cookies();
  store.delete(OTP_PHONE_COOKIE);
};

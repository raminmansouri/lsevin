/**
 * Split out from otp-challenge.ts so the middleware can import it: that module is
 * marked `server-only`, which the middleware bundle refuses.
 */
export const OTP_PHONE_COOKIE = "LSEVIN_OTP_PHONE";

/** Ten minutes — comfortably longer than an OTP lives, short enough not to linger. */
export const OTP_CHALLENGE_TTL_SECONDS = 10 * 60;

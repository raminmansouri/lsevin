/**
 * Public runtime configuration.
 *
 * This module is reachable from client components (media URLs, the socket
 * client, image helpers), so whatever it imports lands in the browser bundle.
 * It used to build its schema with `zod`, which put a 248 KB validator (57 KB
 * gzipped) into every page in order to check that five strings are non-empty.
 *
 * `NEXT_PUBLIC_*` values are inlined by Next at build time, so each one has to
 * be written out as a complete `process.env.NEXT_PUBLIC_X` expression — never
 * looked up dynamically, or the substitution does not happen and the value
 * arrives undefined in the browser.
 */

const rawEnv = {
  NEXT_PUBLIC_URL: process.env.NEXT_PUBLIC_URL,
  NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  NEXT_PUBLIC_FILES_URL: process.env.NEXT_PUBLIC_FILES_URL,
  NEXT_PUBLIC_SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL,
  NEXT_PUBLIC_LSEVIN_COOKIE_DOMAIN: process.env.NEXT_PUBLIC_LSEVIN_COOKIE_DOMAIN,
};

const REQUIRED = [
  "NEXT_PUBLIC_URL",
  "NEXT_PUBLIC_API_URL",
  "NEXT_PUBLIC_FILES_URL",
  "NEXT_PUBLIC_SOCKET_URL",
] as const;

// Unconditional, matching the `createEnv` call this replaced: unlike ./server.ts
// it never opted into SKIP_ENV_VALIDATION, so a missing public URL has always
// been a hard failure. Keep it that way — these values are inlined at build
// time, and a silent `undefined` here becomes a broken media or socket URL for
// every visitor.
const missing = REQUIRED.filter((key) => !rawEnv[key]?.trim());

if (missing.length) {
  throw new Error(
    `Missing required public environment variable(s): ${missing.join(", ")}`
  );
}

export const env = {
  NEXT_PUBLIC_URL: rawEnv.NEXT_PUBLIC_URL as string,
  NEXT_PUBLIC_API_URL: rawEnv.NEXT_PUBLIC_API_URL as string,
  NEXT_PUBLIC_FILES_URL: rawEnv.NEXT_PUBLIC_FILES_URL as string,
  NEXT_PUBLIC_SOCKET_URL: rawEnv.NEXT_PUBLIC_SOCKET_URL as string,
  NEXT_PUBLIC_LSEVIN_COOKIE_DOMAIN: rawEnv.NEXT_PUBLIC_LSEVIN_COOKIE_DOMAIN,
};

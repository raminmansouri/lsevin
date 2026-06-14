/**
 * Browsing model: the whole app is public to guests by default. Only the
 * personal/account areas below require authentication. A guest who hits one of
 * these is sent to sign-in with a `redirectTo` back to where they were.
 *
 * Matching is by path *segment* so it works across both customer UIs
 * (e.g. `/profile` and `/n/app/mobile/profile`, `/booking`, …).
 * @type {string[]}
 */
export const protectedSegments: string[] = [
  "profile",
  "bookings",
  "booking",
  "checkout",
  "favorites",
  "rewards",
  "wallet",
  "my-wallet",
  "notifications",
];

/**
 * Whole sub-trees that require authentication (matched by prefix).
 * @type {string[]}
 */
export const protectedPrefixes: string[] = [
  "/admin",
  "/provider-panel",
  "/provider-portal",
];

/**
 * Does this locale-stripped path require the visitor to be authenticated?
 * @param pathnameWithoutLocale e.g. "/profile" or "/n/app/mobile/booking"
 */
export const isProtectedPath = (pathnameWithoutLocale: string): boolean => {
  const path = pathnameWithoutLocale || "/";
  if (protectedPrefixes.some((prefix) => path.startsWith(prefix))) return true;
  const segments = path.split("/").filter(Boolean);
  return segments.some((segment) => protectedSegments.includes(segment));
};

/**
 * An array of routes that are accessible to the public
 * These routes do not require authentication
 * @type {string[]}
 */
export const publicRoutes: string[] = [];

/**
 * An array of routes that are used for authentication
 * These routes will redirect logged in users to /settings
 * @type {string[]}
 */
export const authRoutes = [
  "sign-in",
  "sign-up",
  "otp/:mobile",
  "forgot-password",
  "on-boarding",
];

/**
 * The prefix for API authentication routes
 * Routes that start with this prefix are used for API authentication purposes
 * @type {string}
 */
export const apiAuthPrefix = "/api/auth";

/**
 * The prefix for admin routes
 * Routes that start with this prefix are used for admin purposes
 * @type {string}
 */
export const adminPrefix = "/admin";

/**
 * The default redirect path after logging in
 * @type {string}
 */
export const DEFAULT_SIGNIN_REDIRECT = "/";

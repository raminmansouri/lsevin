import { getMessages } from "next-intl/server";

/**
 * Which translation namespaces each route segment hands to the browser.
 *
 * `NextIntlClientProvider` serializes whatever `messages` it is given into the
 * RSC payload of every page under it. Given no `messages` prop it falls back to
 * `getMessages()` — the *entire* merged catalog — so every page was shipping all
 * ~66 namespaces. On the mobile home page that measured 505 KB of an 863 KB HTML
 * document (69% of the page), and it included `AdminGenerated`, `AdminColumn`,
 * `AdminTable`, `AvailabilityAdmin`, `FormBuilder` and `ProviderPortal` — none of
 * which a customer's phone can ever render.
 *
 * The lists below were derived by walking the import graph from every route file
 * (`page`/`layout`/`error`/…), crossing into a module the moment it sits behind a
 * `"use client"` boundary, and collecting the namespace argument of every
 * `useTranslations(...)` call reachable that way. Server components are not
 * included on purpose: `getTranslations` reads the full catalog on the server and
 * never needs it in the browser.
 *
 * Keeping these accurate matters — a namespace missing here renders as a raw
 * `MISSING_MESSAGE` key path in the browser. When you add a `useTranslations`
 * call to a client component in a segment, add its namespace to that segment.
 */

type Messages = Record<string, unknown>;

/**
 * Needed under every segment: the shared chrome, plus the `error` and
 * `not-found` boundaries, which can render beneath any route.
 */
export const CORE_NAMESPACES = [
  "Common",
  "Error",
  "LocaleSwitcher",
  "NotFoundPage",
  "User",
  "components",
  "shared",
] as const;

/**
 * The namespaces each top-level segment needs *on top of* `CORE_NAMESPACES`.
 *
 * `HomePage` covers the `BY_TYPE_TRANSLATION_KEY` constant ("HomePage.ByType"),
 * which reaches `useTranslations` as a template literal rather than a literal
 * string and so cannot be spotted by reading the call site alone.
 */
export const SEGMENT_NAMESPACES = {
  /** The mobile app shell — appmain.lsevin.com's customer-facing product. */
  mobileApp: [
    "AsyncSelect",
    "Booking",
    "BottomTabBar",
    "Explore",
    "FormBuilder",
    "Home",
    "LazySelect",
    "MapDiscovery",
    "MobileOffers",
    "MobileProfile",
    "MobileSearch",
    "NearbyMap",
    "ProviderPage",
    "RecommendationSection",
    "SearchResults",
    "ServicePage",
    "SpecialistPage",
    "SupportPages",
  ],
  admin: [
    "Admin",
    "AdminColumn",
    "AdminGenerated",
    "AdminTable",
    "AsyncSelect",
    "AvailabilityAdmin",
    "Category",
    "List",
    "LocalizedInput",
    "SpecialPackagesAdmin",
    "SupportPages",
    "UserInfo",
  ],
  /** The older `/admin` tree, which is separate from the `(admin)` group. */
  adminLegacy: ["AdminGenerated", "FormBuilder"],
  auth: [],
  marketing: [
    "BottomTabBar",
    "Category",
    "Home",
    "HomePage",
    "List",
    "LocalizedInput",
    "MapShared",
  ],
  providerPanel: ["AdminGenerated"],
  providerPortal: ["ProviderPortal"],
} as const satisfies Record<string, readonly string[]>;

export type MessageSegment = keyof typeof SEGMENT_NAMESPACES;

/**
 * Reads the request's messages and returns only the namespaces `segment` needs.
 * Pass no segment for the root layout, which gets the core set alone.
 */
export async function getClientMessages(segment?: MessageSegment) {
  const messages = (await getMessages()) as Messages;

  const wanted = new Set<string>([
    ...CORE_NAMESPACES,
    ...(segment ? SEGMENT_NAMESPACES[segment] : []),
  ]);

  const picked: Messages = {};

  for (const namespace of wanted) {
    if (namespace in messages) picked[namespace] = messages[namespace];
  }

  return picked;
}

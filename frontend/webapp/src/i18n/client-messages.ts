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
  // Every form built on ZodErrorProvider calls useTranslations("FormErrors")
  // unconditionally (src/components/providers/zod-error-provider.tsx), and that
  // provider is mounted under several different segments. Listing it per-segment
  // is how it came to be listed under none of them, so validation messages
  // rendered as the raw key path "FormErrors.*" wherever a zod error fired.
  "FormErrors",
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
    "Consultation",
    "Explore",
    "FormBuilder",
    "Home",
    "LazySelect",
    "MapDiscovery",
    "MobileNotifications",
    "MobileOffers",
    "MobileProfile",
    "MobileSearch",
    "NearbyMap",
    "ProviderPage",
    "RecommendationSection",
    "SearchResults",
    "ServicePage",
    "Shop",
    "SpecialistPage",
    "SupportPages",
  ],
  admin: [
    "Admin",
    "ShopAdmin",
    "AdminColumn",
    "AdminGenerated",
    "AdminTable",
    "AsyncSelect",
    "AvailabilityAdmin",
    "Category",
    "Consultation",
    // form-builder, shop and old-bookings used to live in a second `/admin` tree
    // outside the (admin) group, with their own provider carrying this namespace.
    // Both trees served the same URL prefix, so /admin/dashboard and /admin/shop
    // rendered with different chrome. The trees are merged now and this is the
    // only admin provider, so it has to carry FormBuilder too.
    "FormBuilder",
    "List",
    "LocalizedInput",
    // Reached through the service-provider and staff detail screens, all behind
    // `"use client"` boundaries and all previously rendering their labels as
    // literal "ProviderType.xxx" / "ServiceDefinition.xxx" key paths because the
    // namespace was never handed to the provider:
    //   ProviderType     -> provider-types/components/provider-type-selector-with-infinite-scroll.tsx
    //   ServiceDefinition-> staff/components/staff-service-manager.tsx,
    //                       service-providers/components/details/managers/service-provider-service-manager.tsx
    //   ServiceProvider  -> service-providers/components/details/managers/staff-selector-with-infinite-scroll.tsx
    // Strings extracted out of hardcoded English in the admin pages themselves.
    // Client components read it (marketing/loyalty list + form + dashboard), so
    // it has to be handed to the provider or those labels render as key paths.
    "AdminPages",
    "ProviderType",
    "ServiceDefinition",
    "ServiceProvider",
    "SpecialPackagesAdmin",
    "SupportPages",
    "UserInfo",
  ],
  // Every screen in the (auth) group — sign-in, sign-up, OTP, forgot-password,
  // reset-password — is a client component calling `useTranslations("Auth.*")`,
  // and each of them wraps its fields in ZodErrorProvider, which reads
  // `FormErrors`. With this list empty the provider handed them nothing, so the
  // sign-in page rendered the literal strings "Auth.SignIn.form.password.label",
  // "Auth.SignIn.form.login" and so on — including for anyone on their way to
  // the admin panel, since that is where the admin gate sends you.
  auth: ["Auth", "FormErrors"],
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

/**
 * Editorial content: the essential site pages and FAQ blocks, edited at
 * /admin/editorial and stored in the `content` schema (migration 0085).
 */

/** Essential pages, in footer order. The slug is the public URL: /{locale}/{slug}. */
export const SITE_PAGE_SLUGS = [
  "about-us",
  "services",
  "contact-us",
  "licenses-certifications",
  "pricing-fees",
  "shipping-delivery",
  "returns-refunds",
  "terms-conditions",
  "privacy-policy",
] as const;
export type SitePageSlug = (typeof SITE_PAGE_SLUGS)[number];

export const isSitePageSlug = (value: string): value is SitePageSlug =>
  (SITE_PAGE_SLUGS as readonly string[]).includes(value);

/**
 * Where an FAQ item is shown. Page scopes apply to one page; entity scopes
 * apply to one provider/specialist/service/category/provider type, or to all of
 * them when no entity is chosen; "app" and "site_page" are named by a key.
 */
export const FAQ_SCOPES = [
  "home",
  "explore",
  "search",
  "map",
  "categories",
  "provider",
  "specialist",
  "service",
  "category",
  "provider_type",
  "app",
  "site_page",
] as const;
export type FaqScope = (typeof FAQ_SCOPES)[number];

/** Scopes whose items can target one catalog entity (lazy-select resource). */
export const FAQ_ENTITY_RESOURCE: Partial<Record<FaqScope, string>> = {
  provider: "service_providers",
  specialist: "staff",
  service: "provider_services",
  category: "categories",
  provider_type: "provider_types",
};

/** Sub-apps without a catalog id, addressed by key (scope "app"). */
export const FAQ_APP_KEYS = ["shop", "tours", "gym", "transfers"] as const;
export type FaqAppKey = (typeof FAQ_APP_KEYS)[number];

export const scopeUsesKey = (scope: FaqScope) => scope === "app" || scope === "site_page";

/** Translations keyed by locale header ("fa-IR", "en-US", ...). */
export type Translations = Partial<Record<string, string>>;

export interface SitePageAdminRow {
  id: string | null;
  slug: SitePageSlug;
  title: Translations;
  summary: Translations;
  body: Translations;
  heroMedia: string | null;
  isPublished: boolean;
  showInFooter: boolean;
  displayOrder: number;
  updatedAt: string | null;
}

export interface PublicSitePage {
  slug: SitePageSlug;
  title: string;
  summary: string;
  body: string;
  heroImageUrl: string | null;
  updatedAt: string;
}

export interface FooterPageLink {
  slug: SitePageSlug;
  title: string;
}

export interface FaqAdminRow {
  id: string;
  scope: FaqScope;
  entityId: string | null;
  entityKey: string | null;
  entityLabel: string | null;
  question: Translations;
  answer: Translations;
  displayOrder: number;
  isActive: boolean;
  updatedAt: string;
}

export interface PublicFaqItem {
  id: string;
  question: string;
  /** Serialized Lexical state (or plain text from older rows). */
  answer: string;
}

export interface FaqTarget {
  scope: FaqScope;
  entityId?: string | null;
  entityKey?: string | null;
  /** Only items written for this entity; no fallback to the scope-wide set. */
  exact?: boolean;
}

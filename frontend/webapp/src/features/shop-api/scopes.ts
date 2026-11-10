/**
 * Permissions an API token can hold. A token only ever acts for its own seller; a scope says
 * which operations it may perform on that seller's data. Kept in a client-safe module so the
 * admin form and the help page list the same scopes the server enforces.
 */
export const SHOP_API_SCOPES = [
  "products:read",
  "products:write",
  "products:delete",
  "offers:read",
  "offers:write",
  "offers:delete",
  "catalog:read",
] as const;

export type ShopApiScope = (typeof SHOP_API_SCOPES)[number];

export function isShopApiScope(value: string): value is ShopApiScope {
  return (SHOP_API_SCOPES as readonly string[]).includes(value);
}

/** Token lifetimes offered in the admin form, in days; null = no expiry. */
export const SHOP_API_TOKEN_LIFETIMES = [30, 90, 180, 365, null] as const;

/** Locales a client may send for translated fields (product name, descriptions). */
export const SHOP_API_LOCALES = ["fa", "en", "ar", "tr", "es", "ku", "de", "fr", "ru", "tg", "zh"] as const;

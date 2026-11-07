import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/database/db", () => ({ default: {} }));

import { createOfferSchema, createProductSchema, updateOfferSchema, updateProductSchema } from "./schemas";
import { isShopApiScope, SHOP_API_SCOPES } from "./scopes";
import { checkRateLimit, resetRateLimits, SHOP_API_RATE_LIMIT_PER_MINUTE } from "./server/auth";
import { ShopApiError } from "./server/errors";
import { generateShopApiToken, hashShopApiToken, looksLikeShopApiToken } from "./server/tokens";

describe("tokens", () => {
  it("are lsv_ + 256 random bits, unique, and stored only as a sha-256 hash", () => {
    const a = generateShopApiToken();
    const b = generateShopApiToken();
    expect(a.token).toMatch(/^lsv_[A-Za-z0-9_-]{43}$/);
    expect(a.token).not.toBe(b.token);
    expect(a.prefix).toBe(a.token.slice(0, 12));
    expect(a.hash).toBe(hashShopApiToken(a.token));
    expect(a.hash).toMatch(/^[0-9a-f]{64}$/);
    expect(a.hash).not.toContain(a.token.slice(4));
  });

  it("rejects anything that is not token-shaped before touching the database", () => {
    expect(looksLikeShopApiToken(generateShopApiToken().token)).toBe(true);
    for (const bad of ["", "lsv_short", "Bearer lsv_x", `xyz_${"a".repeat(43)}`, `lsv_${"a".repeat(42)}!`]) {
      expect(looksLikeShopApiToken(bad)).toBe(false);
    }
  });
});

describe("scopes", () => {
  it("knows exactly the documented scopes", () => {
    expect(SHOP_API_SCOPES).toEqual(["products:read", "products:write", "products:delete", "offers:read", "offers:write", "offers:delete", "catalog:read"]);
    expect(isShopApiScope("products:write")).toBe(true);
    expect(isShopApiScope("admin")).toBe(false);
  });
});

describe("rate limit", () => {
  it(`allows ${SHOP_API_RATE_LIMIT_PER_MINUTE} requests a minute per token, then 429 with Retry-After`, () => {
    resetRateLimits();
    const start = 1_000_000;
    for (let i = 0; i < SHOP_API_RATE_LIMIT_PER_MINUTE; i += 1) checkRateLimit("t1", start + i);
    let error: unknown;
    try { checkRateLimit("t1", start + 30_000); } catch (caught) { error = caught; }
    expect(error).toBeInstanceOf(ShopApiError);
    expect((error as ShopApiError).code).toBe("rate_limited");
    expect((error as ShopApiError).headers?.["Retry-After"]).toBe("30");
    // Another token and the next minute are unaffected.
    expect(() => checkRateLimit("t2", start + 30_000)).not.toThrow();
    expect(() => checkRateLimit("t1", start + 60_000)).not.toThrow();
  });
});

describe("request validation", () => {
  const product = { name: { fa: "ویتامین" } };

  it("accepts a minimal product and fills defaults", () => {
    const parsed = createProductSchema.parse(product);
    expect(parsed.currency).toBe("IRR");
    expect(parsed.name).toEqual({ fa: "ویتامین" });
  });

  it("drops empty translations and requires a name in at least one language", () => {
    expect(createProductSchema.parse({ name: { fa: "ویتامین", en: "  " } }).name).toEqual({ fa: "ویتامین" });
    expect(createProductSchema.safeParse({ name: {} }).success).toBe(false);
    expect(createProductSchema.safeParse({ name: { en: "" } }).success).toBe(false);
    expect(createProductSchema.safeParse({ name: { xx: "nope" } }).success).toBe(false);
  });

  it("rejects unknown fields (a typo must not be silently ignored)", () => {
    expect(createProductSchema.safeParse({ ...product, prise: 1 }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...product, offer: { price: 1, stok: 2 } }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...product, ownerSellerId: "x" }).success).toBe(false);
  });

  it("validates slug, currency, ids, images and prices", () => {
    expect(createProductSchema.safeParse({ ...product, slug: "Vitamin D" }).success).toBe(false);
    expect(createProductSchema.parse({ ...product, slug: "Vitamin-D3" }).slug).toBe("vitamin-d3");
    expect(createProductSchema.safeParse({ ...product, currency: "rial" }).success).toBe(false);
    expect(createProductSchema.parse({ ...product, currency: "usd" }).currency).toBe("USD");
    // Production catalog ids are GUIDs without RFC version bits; they must be accepted.
    expect(createProductSchema.safeParse({ ...product, categoryIds: ["019eb710-abaa-bbe5-2703-75d6e772c57f"] }).success).toBe(true);
    expect(createProductSchema.safeParse({ ...product, categoryIds: ["not-an-id"] }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...product, images: ["javascript:alert(1)"] }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...product, images: Array.from({ length: 11 }, (_, i) => `https://x.test/${i}.jpg`) }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...product, offer: { price: -1 } }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...product, offer: { price: 10, compareAtPrice: 5 } }).success).toBe(false);
    expect(createProductSchema.safeParse({ ...product, offer: { price: 10, stockQuantity: 1.5 } }).success).toBe(false);
  });

  it("requires at least one field on updates", () => {
    expect(updateProductSchema.safeParse({}).success).toBe(false);
    expect(updateProductSchema.safeParse({ slug: "new-slug" }).success).toBe(true);
    expect(updateProductSchema.safeParse({ currency: "USD" }).success).toBe(false); // currency is fixed at creation
    expect(updateOfferSchema.safeParse({}).success).toBe(false);
    expect(updateOfferSchema.safeParse({ stockQuantity: null }).success).toBe(true);
    expect(createOfferSchema.safeParse({ productId: "019eb710-abaa-bbe5-2703-75d6e772c57f", price: 5 }).success).toBe(true);
    expect(createOfferSchema.safeParse({ productId: "019eb710-abaa-bbe5-2703-75d6e772c57f", price: 5, sellerId: "x" }).success).toBe(false);
  });
});

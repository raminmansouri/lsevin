import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env/client", () => ({
  env: { NEXT_PUBLIC_FILES_URL: "https://appmain.lsevin.com/files", NEXT_PUBLIC_URL: "https://appmain.lsevin.com" },
}));

import type { ProductDetail, ProductVariantView } from "@/features/shop/types/domain";

import { productJsonLd } from "./product-json-ld";

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SEO_URL", "https://lsevincare.com"));
afterEach(() => vi.unstubAllEnvs());

const url = "https://lsevincare.com/fa/products/pillow";

function variant(overrides: Partial<ProductVariantView>): ProductVariantView {
  return {
    id: "v1",
    sku: "PILLOW-RED",
    slug: "pillow-red",
    title: "Red",
    optionKey: "red",
    price: 4200000,
    compareAtPrice: null,
    currency: "IRR",
    priceUnavailable: false,
    hasStock: true,
    inventoryAvailable: 3,
    allowBackorder: false,
    selections: { "رنگ": "قرمز" },
    ...overrides,
  };
}

function product(overrides: Partial<ProductDetail> = {}): ProductDetail {
  return {
    id: "p1",
    name: "Medical pillow",
    price: 4200000,
    compareAtPrice: null,
    currency: "IRR",
    priceUnavailable: false,
    hasStock: true,
    isPreorder: false,
    allowBackorder: false,
    brandName: "Hooshmand",
    categoryName: "Medical equipment",
    shortDescription: "Soft",
    description: null,
    rating: 0,
    reviewCount: 0,
    reviews: [],
    variants: [variant({})],
    offers: [{ sellerName: "Shop A" }],
    ...overrides,
  } as unknown as ProductDetail;
}

// Google merchant listings / product variants (2026-11-15).
describe("product structured data", () => {
  it("a single product carries one Offer that mirrors the price, with the sale's original price struck through", () => {
    const data = productJsonLd(product({ compareAtPrice: 5000000 }), url, []) as Record<string, any>;
    expect(data["@type"]).toBe("Product");
    expect(data.hasVariant).toBeUndefined();
    expect(data.offers).toMatchObject({ "@type": "Offer", price: 4200000, priceCurrency: "IRR", availability: "https://schema.org/InStock" });
    // The active price has no priceType; only the "was" price is a StrikethroughPrice.
    expect(data.offers.priceSpecification).toEqual([
      { "@type": "UnitPriceSpecification", price: 4200000, priceCurrency: "IRR" },
      { "@type": "UnitPriceSpecification", priceType: "https://schema.org/StrikethroughPrice", price: 5000000, priceCurrency: "IRR" },
    ]);
  });

  it("no strikethrough when there is no discount and no offer without a real price", () => {
    expect((productJsonLd(product({ compareAtPrice: 4000000 }), url, []) as any).offers.priceSpecification).toBeUndefined();
    expect((productJsonLd(product({ priceUnavailable: true }), url, []) as any).offers).toBeUndefined();
    expect((productJsonLd(product({ price: 0 }), url, []) as any).offers).toBeUndefined();
  });

  it("several priced variants become a ProductGroup with one Product per variant", () => {
    const data = productJsonLd(
      product({
        variants: [
          variant({}),
          variant({ id: "v2", sku: "PILLOW-L", title: "Large", price: 4800000, hasStock: false, allowBackorder: true, selections: { Size: "L" } }),
          variant({ id: "v3", sku: "PILLOW-X", priceUnavailable: true }),
        ],
      }),
      url,
      [],
    ) as Record<string, any>;
    expect(data["@type"]).toBe("ProductGroup");
    expect(data.productGroupID).toBe("p1");
    expect(data.offers).toBeUndefined();
    expect(data.variesBy).toEqual(["https://schema.org/color", "https://schema.org/size"]);
    expect(data.hasVariant).toHaveLength(2);
    expect(data.hasVariant[0]).toMatchObject({ "@type": "Product", sku: "PILLOW-RED", inProductGroupWithID: "p1", color: "قرمز", name: "Medical pillow - Red" });
    expect(data.hasVariant[1]).toMatchObject({ sku: "PILLOW-L", size: "L", offers: { price: 4800000, availability: "https://schema.org/BackOrder" } });
  });

  it("ratings appear only with real listed reviews", () => {
    expect((productJsonLd(product({ rating: 4.6, reviewCount: 0 }), url, []) as any).aggregateRating).toBeUndefined();
    const reviewed = productJsonLd(
      product({
        rating: 4.5,
        reviewCount: 2,
        reviews: [{ id: "r1", rating: 5, title: null, body: "Great", createDate: "2026-11-01T10:00:00Z", customerName: "Sara", isVerifiedPurchase: true }],
      }),
      url,
      [],
    ) as Record<string, any>;
    expect(reviewed.aggregateRating).toMatchObject({ ratingValue: 4.5, reviewCount: 2 });
    expect(reviewed.review[0]).toMatchObject({ author: { "@type": "Person", name: "Sara" }, datePublished: "2026-11-01" });
  });

  it("images are crawlable URLs on the public domain, credited to the seller", () => {
    const data = productJsonLd(product(), url, ["Shop/products/a.webp", "Shop/products/a.webp"]) as Record<string, any>;
    expect(data.image).toEqual([
      expect.objectContaining({ contentUrl: "https://lsevincare.com/files/Shop/products/a.webp", creditText: "Shop A" }),
    ]);
  });
});

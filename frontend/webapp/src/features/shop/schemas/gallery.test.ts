import { describe, expect, it } from "vitest";

import {
  galleryUrlsSchema,
  isGalleryImageReference,
  MAX_PRODUCT_IMAGES,
  productGallerySchema,
} from "./gallery";

describe("product gallery validation", () => {
  it("accepts storage paths and public http URLs while preserving order", () => {
    const urls = [
      "products/a.webp",
      "/files/b.webp",
      "https://cdn.example.com/c.webp",
    ];
    expect(galleryUrlsSchema.parse(urls)).toEqual(urls);
  });

  it("removes duplicates without changing the primary image", () => {
    expect(galleryUrlsSchema.parse(["a.webp", "b.webp", "a.webp"])).toEqual([
      "a.webp",
      "b.webp",
    ]);
  });

  it.each([
    "javascript:alert(1)",
    "data:image/svg+xml,<svg/>",
    "blob:https://example.com/id",
    "../secret.png",
    "//untrusted.example/image.png",
    "https://user:password@example.com/image.png",
  ])("rejects unsafe or temporary image reference %s", (url) => {
    expect(isGalleryImageReference(url)).toBe(false);
    expect(() => galleryUrlsSchema.parse([url])).toThrow();
  });

  it("limits a product gallery to the supported image count", () => {
    expect(() =>
      galleryUrlsSchema.parse(
        Array.from(
          { length: MAX_PRODUCT_IMAGES + 1 },
          (_, index) => `${index}.webp`
        )
      )
    ).toThrow();
  });

  it("accepts legacy UUID-shaped product IDs used by seeded catalog rows", () => {
    expect(
      productGallerySchema.parse({
        productId: "33333333-0000-0000-0000-000000000001",
        urls: [],
      })
    ).toEqual({ productId: "33333333-0000-0000-0000-000000000001", urls: [] });
  });
});

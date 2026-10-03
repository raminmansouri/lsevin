import { beforeEach, describe, expect, it, vi } from "vitest";

import { setProductGalleryAction } from "./admin-catalog.actions";

const mocks = vi.hoisted(() => ({
  gallery: vi.fn(),
  invalidate: vi.fn(),
  path: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: mocks.path }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("../lib/cache", () => ({ revalidateShopCatalog: mocks.invalidate }));
vi.mock("../server/admin-catalog.service", () => ({
  setProductGallery: mocks.gallery,
}));

beforeEach(() => vi.resetAllMocks());

describe("setProductGalleryAction", () => {
  it("saves ordered URLs and invalidates admin and storefront caches", async () => {
    const productId = "33333333-0000-0000-0000-000000000001";
    await expect(
      setProductGalleryAction({
        productId,
        urls: ["primary.webp", "detail.webp"],
      })
    ).resolves.toEqual({ ok: true });

    expect(mocks.gallery).toHaveBeenCalledWith({
      productId,
      urls: ["primary.webp", "detail.webp"],
    });
    expect(mocks.invalidate).toHaveBeenCalledOnce();
    expect(mocks.path).toHaveBeenCalledWith(
      `/[locale]/admin/shop/products/${productId}`,
      "page"
    );
  });

  it("rejects unsafe URLs and too many images before writing", async () => {
    await expect(
      setProductGalleryAction({
        productId: "33333333-0000-0000-0000-000000000001",
        urls: ["javascript:alert(1)"],
      })
    ).rejects.toThrow();
    expect(mocks.gallery).not.toHaveBeenCalled();
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });

  it("does not invalidate caches when persistence fails", async () => {
    mocks.gallery.mockRejectedValue(new Error("database unavailable"));
    await expect(
      setProductGalleryAction({
        productId: "33333333-0000-0000-0000-000000000001",
        urls: ["primary.webp"],
      })
    ).rejects.toThrow("database unavailable");
    expect(mocks.invalidate).not.toHaveBeenCalled();
  });
});

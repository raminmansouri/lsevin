import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  setProductPublishedAction,
  setProductPublishedForm,
  updateProductCoreAction,
} from "./admin.actions";

const mocks = vi.hoisted(() => ({
  publish: vi.fn(),
  update: vi.fn(),
  path: vi.fn(),
  tag: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: mocks.path,
  revalidateTag: mocks.tag,
}));
vi.mock("../server/admin-order.service", () => ({
  setProductPublished: mocks.publish,
}));
vi.mock("../server/admin-catalog.service", () => ({
  updateProductCore: mocks.update,
}));
vi.mock("../server/shop-refund.service", () => ({}));
vi.mock("../lib/permissions", () => ({}));
vi.mock("../lib/pricing", () => ({}));

beforeEach(() => vi.resetAllMocks());

describe("product publication", () => {
  it("unpublishes a seeded UUID from a real FormData payload and expires storefront caches", async () => {
    const productId = "33333333-0000-0000-0000-000000000001";
    const form = new FormData();
    form.set("productId", productId);
    form.set("published", "false");
    await setProductPublishedForm(form);
    expect(mocks.publish).toHaveBeenCalledWith({ productId, published: false });
    for (const tag of ["shop-product", "shop-home", "shop-categories"])
      expect(mocks.tag).toHaveBeenCalledWith(tag);
    expect(mocks.path).toHaveBeenCalledWith(
      "/[locale]/admin/shop/products",
      "page"
    );
    expect(mocks.path).toHaveBeenCalledWith(
      "/[locale]/n/app/mobile/shop",
      "layout"
    );
  });

  it("can publish the same seeded product again", async () => {
    await setProductPublishedAction({
      productId: "33333333-0000-0000-0000-000000000001",
      published: "true",
    });
    expect(mocks.publish).toHaveBeenCalledWith(
      expect.objectContaining({ published: true })
    );
  });

  it("rejects malformed IDs before mutation", async () => {
    await expect(
      setProductPublishedAction({ productId: "invalid", published: false })
    ).rejects.toThrow();
    expect(mocks.publish).not.toHaveBeenCalled();
  });

  it("propagates permission and database failures without reporting success", async () => {
    mocks.publish.mockRejectedValue(new Error("Forbidden"));
    await expect(
      setProductPublishedAction({
        productId: "33333333-0000-0000-0000-000000000001",
        published: false,
      })
    ).rejects.toThrow("Forbidden");
    expect(mocks.tag).not.toHaveBeenCalled();
  });
});

it("invalidates storefront prices after changing a product source currency", async () => {
  await updateProductCoreAction({
    productId: "33333333-0000-0000-0000-000000000001",
    status: "active",
    slug: "test-product",
    basePrice: 25,
    baseCurrency: "EUR",
  });
  expect(mocks.update).toHaveBeenCalledWith(
    expect.objectContaining({ baseCurrency: "EUR", basePrice: 25 })
  );
  expect(mocks.tag).toHaveBeenCalledWith("shop-product");
  expect(mocks.tag).toHaveBeenCalledWith("shop-home");
});

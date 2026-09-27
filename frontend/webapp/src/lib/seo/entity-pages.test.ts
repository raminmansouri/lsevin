import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
const mocks = vi.hoisted(() => ({ product: vi.fn(), provider: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NEXT_HTTP_ERROR_FALLBACK;404"); } }));
vi.mock("next-intl/server", () => ({ setRequestLocale: vi.fn(), getTranslations: async () => (key: string) => key }));
vi.mock("@/lib/seo/alternates", () => ({ alternatesFor: () => ({}) }));
vi.mock("@/features/shop/api/catalog.repository.cached", () => ({ getProductBySlugCached: mocks.product }));
vi.mock("@/features/shop/api/catalog.repository", () => ({ listActiveProductSlugs: async () => [] }));
vi.mock("@/features/shop/api/service-relations.repository", () => ({ getProductsForService: async () => null }));
vi.mock("@/features/service-providers/server/provider-page.repository.cached", () => ({ getProviderPageDataFromDbCached: mocks.provider }));
vi.mock("@/features/service-providers/server/provider-page.repository", () => ({ listActiveProviderPageIds: async () => [] }));
vi.mock("@/i18n/navigation", () => ({ Link: () => null }));
vi.mock("@/features/shop/components/ShopHeader", () => ({ ShopHeader: () => null }));
vi.mock("@/features/shop/components/ProductDetailClient", () => ({ ProductDetailClient: () => null }));
vi.mock("@/features/shop/components/home-sections", () => ({ ProductGrid: () => null }));
vi.mock("@/features/shop/components/ShopPrice", () => ({ ShopPrice: () => null }));
vi.mock("@/features/shop/components/WishlistHeart", () => ({ WishlistHeart: () => null }));
vi.mock("@/features/shop/components/CompareButton", () => ({ CompareButton: () => null }));
vi.mock("@/features/shop/components/ServiceRelatedRail", () => ({ ServiceRelatedRail: () => null }));
vi.mock("@/features/shop/components/ProductPersonalSections", () => ({ ProductPersonalSections: () => null }));
vi.mock("@/features/shop/lib/image", () => ({ shopImageSrc: () => null }));
vi.mock("@/features/sponsered-slider/components/sponsored-placement-slot", () => ({ SponsoredPlacementSlot: () => null }));
vi.mock("@/app/[locale]/n/app/mobile/provider/[id]/provider-detail-view", () => ({ ProviderDetailView: () => null }));

import ProductPage, { generateMetadata as productMetadata } from "@/app/[locale]/n/app/mobile/shop/product/[slug]/page";
import ProviderPage, { generateMetadata as providerMetadata } from "@/app/[locale]/n/app/mobile/provider/[id]/page";
beforeEach(() => { vi.resetAllMocks(); vi.stubGlobal("React", React); });
const productParams = { params: Promise.resolve({ locale: "en", slug: "fixture" }) };
const providerParams = { params: Promise.resolve({ locale: "en", id: "fixture" }) };
describe("entity page status contract", () => {
  it("absent product is not-found in page and metadata", async () => {
    mocks.product.mockResolvedValue(null);
    await expect(ProductPage(productParams)).rejects.toThrow(";404");
    await expect(productMetadata(productParams)).rejects.toThrow(";404");
  });
  it("product outage propagates rather than becoming a cacheable 404", async () => {
    const outage = new Error("database unavailable"); mocks.product.mockRejectedValue(outage);
    await expect(ProductPage(productParams)).rejects.toBe(outage);
    await expect(productMetadata(productParams)).rejects.toBe(outage);
  });
  it("active product renders and supplies metadata", async () => {
    mocks.product.mockResolvedValue({name: "Product fixture", relatedServices: [], gallery: [], relatedProducts: []});
    expect(await ProductPage(productParams)).toBeTruthy();
    expect(await productMetadata(productParams)).toMatchObject({title: "Product fixture"});
  });
  it.each([400,404])("provider %s maps to not-found", async status => {
    mocks.provider.mockResolvedValue({error: {status}, data: null});
    await expect(ProviderPage(providerParams)).rejects.toThrow(";404");
    await expect(providerMetadata(providerParams)).rejects.toThrow(";404");
  });
  it("provider failure is retryable and does not expose internal detail", async () => {
    mocks.provider.mockResolvedValue({error: {status: 500, detail: "private database detail"}, data: null});
    await expect(ProviderPage(providerParams)).rejects.toThrow(/^Could not load provider page\.$/);
    await expect(providerMetadata(providerParams)).rejects.toThrow(/^Could not load provider page\.$/);
  });
  it("active provider renders and supplies metadata", async () => {
    mocks.provider.mockResolvedValue({data: {provider: {name: "Provider fixture"}}});
    expect(await ProviderPage(providerParams)).toBeTruthy();
    expect(await providerMetadata(providerParams)).toMatchObject({title: "Provider fixture"});
  });
});

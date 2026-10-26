import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";


import CategoriesPage, {
  dynamic as categoriesRendering,
  revalidate as categoriesTtl,
} from "@/app/[locale]/n/app/mobile/categories/page";
import ProviderPage, {
  generateMetadata as providerMetadata,
} from "@/app/[locale]/n/app/mobile/provider/[id]/page";
import ServicePage, {
  generateMetadata as serviceMetadata,
} from "@/app/[locale]/n/app/mobile/service/[id]/page";
import ProductPage, {
  generateMetadata as productMetadata,
} from "@/app/[locale]/n/app/mobile/shop/product/[slug]/page";
import SpecialistPage, {
  generateMetadata as specialistMetadata,
} from "@/app/[locale]/n/app/mobile/specialist/[id]/page";

const mocks = vi.hoisted(() => ({
  product: vi.fn(),
  provider: vi.fn(),
  service: vi.fn(),
  specialist: vi.fn(),
  categories: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NEXT_HTTP_ERROR_FALLBACK;404");
  },
}));
vi.mock("next-intl/server", () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async () => (key: string) => key,
}));
vi.mock("@/features/shop/api/catalog.repository.cached", () => ({
  getProductBySlugCached: mocks.product,
}));
vi.mock("@/features/shop/api/catalog.repository", () => ({
  listActiveProductSlugs: async () => [],
}));
vi.mock("@/features/shop/api/service-relations.repository", () => ({
  getProductsForService: async () => null,
}));
vi.mock(
  "@/features/service-providers/server/provider-page.repository.cached",
  () => ({ getProviderPageDataFromDbCached: mocks.provider })
);
vi.mock("@/features/service-providers/server/provider-page.repository", () => ({
  listActiveProviderPageIds: async () => [],
}));
vi.mock(
  "@/features/service-providers/server/service-page.repository.cached",
  () => ({ getServicePageByIdCached: mocks.service })
);
vi.mock("@/features/service-providers/server/service-page.repository", () => ({
  listActiveServicePageIds: async () => [],
}));
vi.mock(
  "@/features/service-providers/server/specialist-page.repository.cached",
  () => ({ getSpecialistPageFromDbCached: mocks.specialist })
);
vi.mock(
  "@/features/service-providers/server/specialist-page.repository",
  () => ({ listActiveSpecialistPageIds: async () => [] })
);
vi.mock(
  "@/features/service-providers/actions/categories/get-category-browser-groups",
  () => ({ getCategoryBrowserGroups: mocks.categories })
);
vi.mock(
  "@/features/service-providers/components/categories/category-browser-client",
  () => ({ CategoryBrowserClient: () => null })
);
vi.mock("@/app/[locale]/n/app/mobile/service/[id]/service-page", () => ({
  default: () => null,
}));
vi.mock("@/app/[locale]/n/app/mobile/specialist/[id]/specialist-page", () => ({
  default: () => null,
}));
vi.mock("@/i18n/navigation", () => ({ Link: () => null }));
vi.mock("@/features/shop/components/ShopHeader", () => ({
  ShopHeader: () => null,
}));
vi.mock("@/features/shop/components/ProductDetailClient", () => ({
  ProductDetailClient: () => null,
}));
vi.mock("@/features/shop/components/home-sections", () => ({
  ProductGrid: () => null,
}));
vi.mock("@/features/shop/components/ShopPrice", () => ({
  ShopPrice: () => null,
}));
vi.mock("@/features/shop/components/WishlistHeart", () => ({
  WishlistHeart: () => null,
}));
vi.mock("@/features/shop/components/CompareButton", () => ({
  CompareButton: () => null,
}));
vi.mock("@/features/shop/components/ServiceRelatedRail", () => ({
  ServiceRelatedRail: () => null,
}));
vi.mock("@/features/shop/components/ProductPersonalSections", () => ({
  ProductPersonalSections: () => null,
}));
vi.mock("@/features/shop/lib/image", () => ({ shopImageSrc: () => null }));
vi.mock("@/features/consultation/components/consultation-cta-button", () => ({
  ConsultationCtaButton: () => null,
}));
vi.mock(
  "@/features/sponsered-slider/components/sponsored-placement-slot",
  () => ({ SponsoredPlacementSlot: () => null })
);
vi.mock(
  "@/app/[locale]/n/app/mobile/provider/[id]/provider-detail-view",
  () => ({ ProviderDetailView: () => null })
);

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("React", React);
});
const productParams = {
  params: Promise.resolve({ locale: "en", slug: "fixture" }),
};
const providerParams = {
  params: Promise.resolve({ locale: "en", id: "fixture" }),
};
describe("entity page status contract", () => {
  it.each([
    ["service", mocks.service, ServicePage, serviceMetadata],
    ["specialist", mocks.specialist, SpecialistPage, specialistMetadata],
  ] as const)(
    "%s distinguishes absence from transient failures in metadata and page",
    async (_, read, page, metadata) => {
      read.mockResolvedValue(null);
      await expect(page(providerParams)).rejects.toThrow(";404");
      await expect(metadata(providerParams)).rejects.toThrow(";404");
      const outage = new Error("database unavailable");
      read.mockRejectedValue(outage);
      await expect(page(providerParams)).rejects.toBe(outage);
      await expect(metadata(providerParams)).rejects.toBe(outage);
    }
  );
  it("categories supports ISR and never publishes an outage as an empty successful page", async () => {
    expect(categoriesRendering).toBe("force-static");
    expect(categoriesTtl).toBe(300);
    const outage = new Error("database unavailable");
    mocks.categories.mockRejectedValue(outage);
    await expect(
      CategoriesPage({ params: Promise.resolve({ locale: "tr" }) })
    ).rejects.toBe(outage);
    expect(mocks.categories).toHaveBeenCalledWith("tr");
    mocks.categories.mockResolvedValue({
      groups: [],
      totalCategories: 0,
      totalProviders: 0,
    });
    expect(
      await CategoriesPage({ params: Promise.resolve({ locale: "tr" }) })
    ).toBeTruthy();
  });
  it("absent product is not-found in page and metadata", async () => {
    mocks.product.mockResolvedValue(null);
    await expect(ProductPage(productParams)).rejects.toThrow(";404");
    await expect(productMetadata(productParams)).rejects.toThrow(";404");
  });
  it("product outage propagates rather than becoming a cacheable 404", async () => {
    const outage = new Error("database unavailable");
    mocks.product.mockRejectedValue(outage);
    await expect(ProductPage(productParams)).rejects.toBe(outage);
    await expect(productMetadata(productParams)).rejects.toBe(outage);
  });
  it("active product renders and supplies metadata", async () => {
    mocks.product.mockResolvedValue({
      name: "Product fixture",
      relatedServices: [],
      gallery: [],
      relatedProducts: [],
    });
    expect(await ProductPage(productParams)).toBeTruthy();
    expect(await productMetadata(productParams)).toMatchObject({
      title: { absolute: "Product fixture" },
    });
  });
  it.each([400, 404])("provider %s maps to not-found", async (status) => {
    mocks.provider.mockResolvedValue({ error: { status }, data: null });
    await expect(ProviderPage(providerParams)).rejects.toThrow(";404");
    await expect(providerMetadata(providerParams)).rejects.toThrow(";404");
  });
  it("provider failure is retryable and does not expose internal detail", async () => {
    mocks.provider.mockResolvedValue({
      error: { status: 500, detail: "private database detail" },
      data: null,
    });
    await expect(ProviderPage(providerParams)).rejects.toThrow(
      /^Could not load provider page\.$/
    );
    await expect(providerMetadata(providerParams)).rejects.toThrow(
      /^Could not load provider page\.$/
    );
  });
  it("active provider renders and supplies metadata", async () => {
    mocks.provider.mockResolvedValue({
      data: { provider: { name: "Provider fixture" } },
    });
    expect(await ProviderPage(providerParams)).toBeTruthy();
    expect(await providerMetadata(providerParams)).toMatchObject({
      title: { absolute: "Provider fixture" },
    });
  });
});

vi.mock("@/features/tours/server/platform/settings", () => ({ getTourSettings: async () => ({ tourismCategoryId: null }) }));

vi.mock("@/features/shop/components/ProductSpecs", () => ({ ProductSpecs: () => null }));

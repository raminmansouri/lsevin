import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { collectionPage } from "./entity-schema";

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SEO_URL", "https://lsevincare.com"));
afterEach(() => vi.unstubAllEnvs());

// 2026-11-15: explore, specialties, trusted providers, the home page and tours
// listings had no description of what they list.
describe("listing pages", () => {
  it("are a CollectionPage whose main entity lists the shown items in order, once each", () => {
    const page = collectionPage({
      url: "https://lsevincare.com/ku/explore",
      name: "Explore",
      locale: "ku",
      items: [
        { url: "https://lsevincare.com/ku/providers/a", name: "A", image: "Categories/a.webp" },
        { url: "https://lsevincare.com/ku/providers/a", name: "A again" },
        { url: "https://lsevincare.com/ku/services/b", name: "B" },
        { url: "", name: "no url" },
      ],
    }) as Record<string, any>;
    expect(page["@type"]).toBe("CollectionPage");
    expect(page.inLanguage).toBe("ckb");
    expect(page.isPartOf).toEqual({ "@id": "https://lsevincare.com/#website" });
    expect(page.mainEntity.numberOfItems).toBe(2);
    expect(page.mainEntity.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, url: "https://lsevincare.com/ku/providers/a", name: "A", image: "https://lsevincare.com/files/Categories/a.webp" },
      { "@type": "ListItem", position: 2, url: "https://lsevincare.com/ku/services/b", name: "B" },
    ]);
  });

  it("an empty listing has no ItemList; the home page is a WebPage", () => {
    const page = collectionPage({ url: "https://lsevincare.com/fa", name: "Home", locale: "fa", items: [], type: "WebPage" }) as Record<string, any>;
    expect(page["@type"]).toBe("WebPage");
    expect(page.mainEntity).toBeUndefined();
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

describe("responsiveImg", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("NEXT_PUBLIC_FILES_URL", "https://lsevin.ir/files");
  });

  async function load() {
    return import("./responsive-img");
  }

  it("serves files from our files host through the optimizer, with a srcset", async () => {
    const { responsiveImg } = await load();
    const image = responsiveImg("https://lsevin.ir/files/Categories/services/a.webp", "400px");
    expect(image.src).toMatch(/^\/_next\/image\?url=https%3A%2F%2Flsevin\.ir%2Ffiles%2FCategories%2Fservices%2Fa\.webp&w=\d+&q=75$/);
    expect(image.srcSet).toMatch(/ \d+w(, |$)/);
    expect(image.sizes).toBe("400px");
  });

  it("optimizes local images without a query string", async () => {
    const { responsiveImg } = await load();
    expect(responsiveImg("/brand/hero.jpg", "100vw").src).toMatch(/^\/_next\/image\?url=%2Fbrand%2Fhero\.jpg/);
  });

  it.each([
    ["another host", "https://images.example.com/x.jpg"],
    ["our host outside /files", "https://lsevin.ir/uploads/x.jpg"],
    ["a query string", "https://lsevin.ir/files/x.jpg?v=2"],
    ["the shop image proxy", "/api/shop/img?u=https%3A%2F%2Fexample.com%2Fx.jpg"],
    ["an SVG", "https://lsevin.ir/files/logo.svg"],
    ["a data URL", "data:image/gif;base64,R0lGODlhAQABAAAAACw="],
    ["an already optimized URL", "/_next/image?url=x&w=64&q=75"],
    ["a protocol-relative URL", "//lsevin.ir/files/x.jpg"],
  ])("leaves %s unchanged", async (_, src) => {
    const { responsiveImg } = await load();
    expect(responsiveImg(src, "400px")).toEqual({ src });
  });

  it("returns no src for an empty value", async () => {
    const { responsiveImg } = await load();
    expect(responsiveImg("  ", "400px")).toEqual({ src: undefined });
    expect(responsiveImg(null, "400px")).toEqual({ src: undefined });
  });
});

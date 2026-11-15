import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { imageObjects, telephone } from "./entity-schema";
import { publicMediaUrl } from "./media-url";

beforeEach(() => vi.stubEnv("NEXT_PUBLIC_SEO_URL", "https://lsevincare.com"));
afterEach(() => vi.unstubAllEnvs());

// Found 2026-11-15: provider, specialist and product structured data pointed at
// https://lsevincare.com/Categories/... (404). Stored keys live under /files.
describe("public media URLs", () => {
  it("puts a stored key under /files on the site", () => {
    expect(publicMediaUrl("Categories/services/01a1.webp")).toBe("https://lsevincare.com/files/Categories/services/01a1.webp");
    expect(publicMediaUrl("files/Categories/x.webp")).toBe("https://lsevincare.com/files/Categories/x.webp");
    expect(publicMediaUrl("Categories\\x y.webp")).toBe("https://lsevincare.com/files/Categories/x%20y.webp");
  });

  it("keeps absolute URLs and site paths, drops empty and inline data", () => {
    expect(publicMediaUrl("https://appmain.lsevin.com/files/a.webp")).toBe("https://appmain.lsevin.com/files/a.webp");
    expect(publicMediaUrl("/pwa/icon-512.png")).toBe("https://lsevincare.com/pwa/icon-512.png");
    expect(publicMediaUrl("")).toBeUndefined();
    expect(publicMediaUrl("data:image/png;base64,AAA")).toBeUndefined();
  });

  it("image licence metadata names the business that supplied the photo", () => {
    expect(imageObjects(["Categories/a.webp", "Categories/a.webp"], "Clinic A")).toEqual([
      {
        "@type": "ImageObject",
        contentUrl: "https://lsevincare.com/files/Categories/a.webp",
        url: "https://lsevincare.com/files/Categories/a.webp",
        creditText: "Clinic A",
        creator: { "@type": "Organization", name: "Clinic A" },
        copyrightNotice: "Clinic A",
      },
    ]);
    expect(imageObjects(["Categories/a.webp"], null)).toEqual(["https://lsevincare.com/files/Categories/a.webp"]);
  });

  it("phone numbers keep the country code", () => {
    expect(telephone("+98 21 8888 8888")).toBe("+982188888888");
    expect(telephone("0098 21 8888 8888")).toBe("+982188888888");
    expect(telephone("123")).toBeUndefined();
  });
});

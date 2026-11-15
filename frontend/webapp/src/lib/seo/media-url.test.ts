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
    expect(publicMediaUrl("https://cdn.example.com/files/a.webp")).toBe("https://cdn.example.com/files/a.webp");
    // Our own files host is not the public domain; the same file is served there.
    expect(publicMediaUrl("https://appmain.lsevin.com/files/a.webp")).toBe("https://lsevincare.com/files/a.webp");
    expect(publicMediaUrl("https://appmain.lsevin.com/api/x")).toBe("https://appmain.lsevin.com/api/x");
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

// Google video best practices: name, thumbnailUrl and uploadDate are required.
describe("video structured data", () => {
  it("marks up a played video with its file, date, length and a thumbnail", async () => {
    const { videoObjects, isoDuration } = await import("./entity-schema");
    expect(isoDuration(95)).toBe("PT1M35S");
    expect(isoDuration(3600)).toBe("PT1H");
    expect(isoDuration(0)).toBeUndefined();
    const [video] = videoObjects(
      [{ url: "Categories/services/v.mp4", name: "Tour of the clinic", uploadDate: "2026-10-01T08:00:00Z", durationSeconds: 95 }],
      { name: "Clinic A", thumbnail: "Categories/a.webp", owner: "Clinic A" }
    );
    expect(video).toEqual({
      "@type": "VideoObject",
      name: "Tour of the clinic",
      description: "Clinic A",
      thumbnailUrl: ["https://lsevincare.com/files/Categories/a.webp"],
      uploadDate: "2026-10-01T08:00:00.000Z",
      contentUrl: "https://lsevincare.com/files/Categories/services/v.mp4",
      duration: "PT1M35S",
      creator: { "@type": "Organization", name: "Clinic A" },
    });
  });

  it("leaves out videos it cannot describe completely", async () => {
    const { videoObjects } = await import("./entity-schema");
    expect(videoObjects([{ url: "v.mp4", uploadDate: "2026-10-01" }], { name: "A", thumbnail: null })).toEqual([]);
    expect(videoObjects([{ url: "v.mp4", uploadDate: null }], { name: "A", thumbnail: "a.webp" })).toEqual([]);
    expect(videoObjects([{ url: "", uploadDate: "2026-10-01" }], { name: "A", thumbnail: "a.webp" })).toEqual([]);
  });
});

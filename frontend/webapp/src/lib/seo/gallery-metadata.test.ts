import { describe, expect, it } from "vitest";

import { galleryMetadata } from "./gallery-metadata";

const serviceUrl = "https://lsevincare.com/fa/services/hand-prosthesis";
const service = {
  title: { absolute: "x" },
  description: "d",
  alternates: { canonical: serviceUrl, languages: { fa: serviceUrl, "x-default": serviceUrl } },
  openGraph: { title: "x", url: serviceUrl, type: "website" as const },
  twitter: { card: "summary" as const, title: "x" },
};

describe("service gallery metadata", () => {
  it("is always noindex, follow, even where the service page is indexable", () => {
    expect(galleryMetadata(service, "گالری خدمت: x").robots).toEqual({ index: false, follow: true });
  });

  it("points the canonical and og:url at the service page and drops hreflang", () => {
    const meta = galleryMetadata(service, "t");
    expect(meta.alternates).toEqual({ canonical: serviceUrl });
    expect(meta.openGraph?.url).toBe(serviceUrl);
    expect(String(meta.alternates?.canonical)).not.toMatch(/\/gallery$/);
  });

  it("uses the per-service title everywhere", () => {
    const meta = galleryMetadata(service, "گالری خدمت: x");
    expect(meta.title).toEqual({ absolute: "گالری خدمت: x" });
    expect(meta.openGraph?.title).toBe("گالری خدمت: x");
    expect(meta.twitter?.title).toBe("گالری خدمت: x");
  });
});

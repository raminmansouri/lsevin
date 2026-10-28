import { afterEach, expect, it, vi } from "vitest";

import { PublicSiteSchema } from "./site-schema";

afterEach(() => vi.unstubAllEnvs());
it("publishes only factual platform identity on the canonical domain", () => {
  vi.stubEnv("NEXT_PUBLIC_SEO_URL", "https://lsevincare.com");
  const node = PublicSiteSchema({ locale: "fa" });
  expect(node.props.type).toBe("application/ld+json");
  const schema = JSON.parse(node.props.dangerouslySetInnerHTML.__html);
  expect(
    schema["@graph"].map((x: Record<string, unknown>) => x["@type"])
  ).toEqual(["Organization", "WebSite"]);
  expect(schema["@graph"][1]).toMatchObject({
    url: "https://lsevincare.com",
    inLanguage: "fa",
  });
  expect(node.props.dangerouslySetInnerHTML.__html).not.toContain(
    "aggregateRating"
  );
});
it("escapes script terminators even if a caller passes unsafe locale data", () => {
  vi.stubEnv("NEXT_PUBLIC_SEO_URL", "https://lsevincare.com");
  const html = PublicSiteSchema({
    locale: "</script><script>alert(1)</script>",
  }).props.dangerouslySetInnerHTML.__html;
  expect(html).not.toContain("<");
  expect(() => JSON.parse(html)).not.toThrow();
});

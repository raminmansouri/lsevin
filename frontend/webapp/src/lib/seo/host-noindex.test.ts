import { describe, expect, it } from "vitest";

import nextConfig from "../../../next.config";

// Only lsevincare.com is indexed (2026-11-18). The rule is a response header in
// next.config, so static/ISR pages are not turned dynamic by reading the host.
describe("secondary hosts are noindex, nofollow", async () => {
  const rules = (await nextConfig.headers?.()) ?? [];
  const rule = rules.find((r) => r.headers.some((h) => h.key === "X-Robots-Tag" && h.value === "noindex, nofollow"));
  // Next.js anchors `has`/`missing` values: new RegExp(`^${value}$`).
  const indexable = (host: string) => (rule?.missing ?? []).some((m) => m.type === "host" && new RegExp(`^${m.value}$`).test(host));

  it("applies to every path and is the last rule (overrides the facet noindex, follow)", () => {
    expect(rule?.source).toBe("/:path*");
    expect(rules.at(-1)).toBe(rule);
  });
  it.each(["lsevincare.com", "www.lsevincare.com"])("%s stays indexable", (host) => {
    expect(indexable(host)).toBe(true);
  });
  it.each(["lsevin.ir", "www.lsevin.ir", "lsevincare.ir", "appmain.lsevin.com", "ir.lsevincare.com", "lsevincare.com.evil.example", "lsevincarexcom", "localhost"])(
    "%s is noindex",
    (host) => {
      expect(indexable(host)).toBe(false);
    }
  );
});

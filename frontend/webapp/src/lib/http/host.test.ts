import { describe, expect, it } from "vitest";

import { normalizeHost } from "./host";

describe("normalizeHost", () => {
  it("turns what admins and proxies send into one key per domain", () => {
    expect(normalizeHost("lsevincare.com")).toBe("lsevincare.com");
    expect(normalizeHost("https://WWW.LsevinCare.com:443/fa?x=1")).toBe("lsevincare.com");
    expect(normalizeHost("appmain.lsevin.com, proxy.internal")).toBe("appmain.lsevin.com");
    expect(normalizeHost("lsevin.ir.")).toBe("lsevin.ir");
    expect(normalizeHost("site-a.localhost:3140")).toBe("site-a.localhost");
  });

  it("is null for anything that is not a domain name", () => {
    for (const value of ["", null, undefined, "localhost", "127.0.0.1", "0.0.0.0:3000", "a b.com", "-bad.com", "<script>.com"]) {
      expect(normalizeHost(value)).toBeNull();
    }
  });
});

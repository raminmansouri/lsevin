import { describe, expect, it } from "vitest";

import {
  domainsMissingToken,
  findDomainMerchant,
  maskDomainMerchants,
  mergeDomainMerchants,
  normalizeDomainMerchants,
} from "./domain-merchants";
import { isIranianCardGateway, readGatewayReturn } from "./gateways";
import { filterGatewaysForRegion, selectEnabledGatewayForRegion } from "./server/gateway-eligibility";

describe("per-domain merchant tokens", () => {
  const stored = [
    { host: "lsevincare.com", merchant: "token-com" },
    { host: "lsevin.ir", merchant: "token-ir" },
  ];

  it("normalizes hosts as admins type them and keeps one entry per domain", () => {
    expect(
      normalizeDomainMerchants([
        { host: "https://WWW.LsevinCare.com/fa", merchant: " a " },
        { host: "lsevincare.com", merchant: "b" },
        { host: "localhost", merchant: "x" },
        { host: "not a host", merchant: "y" },
        null,
      ])
    ).toEqual([{ host: "lsevincare.com", merchant: "b" }]);
  });

  it("finds the token for the request's domain, www or not, and nothing for other domains", () => {
    expect(findDomainMerchant(stored, "www.lsevin.ir")).toBe("token-ir");
    expect(findDomainMerchant(stored, "LSEVINCARE.COM:443")).toBe("token-com");
    expect(findDomainMerchant(stored, "appmain.lsevin.com")).toBeNull();
    expect(findDomainMerchant(stored, null)).toBeNull();
    // A look-alike domain must not match by suffix.
    expect(findDomainMerchant(stored, "evil-lsevin.ir")).toBeNull();
  });

  it("an admin save keeps blank tokens, replaces typed ones, drops removed domains", () => {
    const merged = mergeDomainMerchants(stored, [
      { host: "lsevincare.com", merchant: "" },
      { host: "appmain.lsevin.com", merchant: "token-app" },
    ]);
    expect(merged).toEqual([
      { host: "appmain.lsevin.com", merchant: "token-app" },
      { host: "lsevincare.com", merchant: "token-com" },
    ]);
  });

  it("flags a new domain submitted without a token", () => {
    expect(domainsMissingToken(stored, [{ host: "lsevin.ir", merchant: "" }, { host: "new.example.com", merchant: "" }])).toEqual([
      "new.example.com",
    ]);
  });

  it("masks tokens for the admin form", () => {
    expect(maskDomainMerchants([{ host: "lsevin.ir", merchant: "abcd1234efgh5678" }, { host: "a.com", merchant: "short" }])).toEqual([
      { host: "a.com", merchant: "••••" },
      { host: "lsevin.ir", merchant: "abcd••••5678" },
    ]);
  });
});

describe("gateway returns", () => {
  it("reads Zibal's trackId/success and Zarinpal's Authority/Status", () => {
    expect(readGatewayReturn("zibal", new URLSearchParams("success=1&status=2&trackId=3001&orderId=x"))).toEqual({ authority: "3001", status: "OK" });
    expect(readGatewayReturn("zibal", new URLSearchParams("success=0&status=3&trackId=3001"))).toEqual({ authority: "3001", status: "NOK" });
    // Zibal's own "status" (2 = paid, unverified) must never be read as Zarinpal's OK.
    expect(readGatewayReturn("zibal", new URLSearchParams("status=OK&trackId=3001"))).toEqual({ authority: "3001", status: "NOK" });
    expect(readGatewayReturn("zarinpal", new URLSearchParams("Authority=A1&Status=OK"))).toEqual({ authority: "A1", status: "OK" });
  });
});

describe("region rails with Zibal", () => {
  it("knows which gateways are Iranian card gateways", () => {
    expect(["zibal", "zarinpal", "ZIBAL"].every(isIranianCardGateway)).toBe(true);
    expect(isIranianCardGateway("btcpay")).toBe(false);
  });

  it("offers an Iranian customer exactly one card gateway: the first in the admin's order", () => {
    expect(filterGatewaysForRegion([{ code: "zibal" }, { code: "zarinpal" }, { code: "btcpay" }], "iran")).toEqual([{ code: "zibal" }]);
    expect(filterGatewaysForRegion([{ code: "zarinpal" }, { code: "zibal" }], "iran")).toEqual([{ code: "zarinpal" }]);
    expect(filterGatewaysForRegion([{ code: "zibal" }, { code: "btcpay" }], "international")).toEqual([{ code: "btcpay" }]);
    expect(selectEnabledGatewayForRegion([{ code: "zibal" }, { code: "btcpay" }], "iran")).toBe("zibal");
  });

  it("without Zibal the rails are exactly as before", () => {
    expect(filterGatewaysForRegion([{ code: "zarinpal" }, { code: "btcpay" }], "iran")).toEqual([{ code: "zarinpal" }]);
    expect(filterGatewaysForRegion([{ code: "zarinpal" }, { code: "btcpay" }], "international")).toEqual([{ code: "btcpay" }]);
    expect(filterGatewaysForRegion([{ code: "zarinpal" }], "international")).toEqual([{ code: "zarinpal" }]);
  });
});

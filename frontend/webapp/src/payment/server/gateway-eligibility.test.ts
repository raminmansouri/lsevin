import { describe, expect, it } from "vitest";

import { filterGatewaysForRegion, selectEnabledGatewayForRegion } from "./gateway-eligibility";

describe("payment gateway availability", () => {
  it("prefers the gateway matching the account region when both are enabled", () => {
    const gateways = [{ code: "zarinpal" as const }, { code: "btcpay" as const }];
    expect(filterGatewaysForRegion(gateways, "iran")).toEqual([{ code: "zarinpal" }]);
    expect(filterGatewaysForRegion(gateways, "international")).toEqual([{ code: "btcpay" }]);
  });

  it("uses the sole admin-enabled gateway instead of an unavailable regional rail", () => {
    const gateways = [{ code: "zarinpal" as const }];
    expect(filterGatewaysForRegion(gateways, "international")).toEqual(gateways);
    expect(selectEnabledGatewayForRegion(gateways, "international")).toBe("zarinpal");
  });

  it("fails closed when no gateway is enabled", () => {
    expect(() => selectEnabledGatewayForRegion([], "iran")).toThrow("No enabled payment gateway");
  });
});

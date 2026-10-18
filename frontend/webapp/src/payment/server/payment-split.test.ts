import { describe, expect, it } from "vitest";

import { splitGatewayAmount } from "./payment.repository";

describe("splitGatewayAmount", () => {
  const max = 1_000_000_000;
  const min = 10_000;

  it("charges everything when the amount fits under the cap", () => {
    expect(splitGatewayAmount({ totalGatewayAmount: 500_000, maximumAmount: max, minimumAmount: min })).toEqual({
      chargeAmount: 500_000,
      isPartial: false,
    });
    expect(splitGatewayAmount({ totalGatewayAmount: max, maximumAmount: max, minimumAmount: min }).isPartial).toBe(false);
  });

  it("never splits when the gateway has no cap", () => {
    expect(splitGatewayAmount({ totalGatewayAmount: 9e12, maximumAmount: null }).isPartial).toBe(false);
  });

  it("caps the first installment (the 1,100,000,000 IRR booking case)", () => {
    expect(splitGatewayAmount({ totalGatewayAmount: 1_100_000_000, maximumAmount: max, minimumAmount: min })).toEqual({
      chargeAmount: max,
      isPartial: true,
    });
  });

  it("keeps the remainder above the gateway minimum", () => {
    const r = splitGatewayAmount({ totalGatewayAmount: max + 5_000, maximumAmount: max, minimumAmount: min });
    expect(r.isPartial).toBe(true);
    expect(r.chargeAmount).toBe(max + 5_000 - min);
    expect(max + 5_000 - r.chargeAmount).toBeGreaterThanOrEqual(min);
  });

  it("terminates: repeated installments always reach zero", () => {
    let left = 3_456_789_000;
    let n = 0;
    while (left > 0 && n < 20) {
      const { chargeAmount } = splitGatewayAmount({ totalGatewayAmount: left, maximumAmount: max, minimumAmount: min });
      expect(chargeAmount).toBeLessThanOrEqual(max);
      expect(chargeAmount).toBeGreaterThanOrEqual(min);
      left -= chargeAmount;
      n++;
    }
    expect(left).toBe(0);
    expect(n).toBe(4);
  });
});

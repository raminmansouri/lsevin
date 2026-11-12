import { describe, expect, it } from "vitest";

import { encodePatternVariables } from "@/features/consultation/server/melipayamak";

import { pickupSmsRecipient, pickupSmsVariables } from "./pickup-sms";

describe("pickup SMS", () => {
  it("goes to the first Iranian mobile in the given order", () => {
    expect(
      pickupSmsRecipient([
        { phone: "+989121234567", country: "IR" },
        { phone: "09351112222", country: "IR" },
      ])
    ).toBe("09121234567");
  });

  it("skips empty numbers and accepts any common form, Persian digits too", () => {
    expect(pickupSmsRecipient([{ phone: null }, { phone: "+98 935 111 2222", country: "IR" }])).toBe("09351112222");
    expect(pickupSmsRecipient([{ phone: "" }, { phone: "۰۹۳۵۱۱۱۲۲۲۲", country: "IR" }])).toBe("09351112222");
    expect(pickupSmsRecipient([{ phone: undefined }, { phone: "9351112222", country: null }])).toBe("09351112222");
  });

  it("skips numbers MeliPayamak cannot deliver to (landline, foreign mobile)", () => {
    expect(pickupSmsRecipient([{ phone: "02122334455", country: "IR" }])).toBeNull();
    // A Russian 9XX number must not become an Iranian subscriber's number.
    expect(pickupSmsRecipient([{ phone: "9161234567", country: "RU" }])).toBeNull();
    expect(pickupSmsRecipient([{ phone: "+4915112345678", country: "DE" }])).toBeNull();
    expect(pickupSmsRecipient([])).toBeNull();
  });

  it("sends the order number and the code, in the template's order", () => {
    expect(encodePatternVariables(pickupSmsVariables("LS-20261112-ABCDE", "042917"))).toBe("LS-20261112-ABCDE;042917");
    // A ';' could shift the placeholders; it is neutralized.
    expect(encodePatternVariables(pickupSmsVariables("LS;1", "000001"))).toBe("LS 1;000001");
  });
});

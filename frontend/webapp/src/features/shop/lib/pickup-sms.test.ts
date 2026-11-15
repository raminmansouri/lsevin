import { describe, expect, it } from "vitest";

import { encodePatternVariables } from "@/features/consultation/server/melipayamak";

import {
  pickupSmsRecipient,
  pickupSmsVariables,
  SHOP_PICKUP_READY_TEMPLATE,
  SHOP_SHIPPED_PATTERN_ENV,
  SHOP_SHIPPED_TEMPLATE,
  shippedSmsVariables,
} from "./pickup-sms";

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

  it("sends the order number, the code and the seller's place, in the template's order", () => {
    expect(encodePatternVariables(pickupSmsVariables("LS-20261112-ABCDE", "042917", "کلینیک آریا"))).toBe(
      "LS-20261112-ABCDE;042917;کلینیک آریا",
    );
    // A ';' or a newline could shift the placeholders; they are neutralized.
    expect(encodePatternVariables(pickupSmsVariables("LS;1", "000001", "Clinic;\nA"))).toBe("LS 1;000001;Clinic A");
    // No place name: a neutral word instead of an empty variable.
    expect(pickupSmsVariables("LS-1", "000001", "  ")[2]).toBe("فروشنده");
  });

  it("the pickup template names the seller's place, not the Lsevin office", () => {
    expect(SHOP_PICKUP_READY_TEMPLATE).toContain("{2}");
    expect(SHOP_PICKUP_READY_TEMPLATE).not.toContain("دفتر لسوین");
    expect(SHOP_SHIPPED_TEMPLATE).toContain("{1}");
  });
});

describe("shipped SMS", () => {
  it("uses its own pattern env var", () => {
    expect(SHOP_SHIPPED_PATTERN_ENV).toBe("MELIPAYAMAK_PATTERN_SHOP_SHIPPED");
  });

  it("sends {0} order number, {1} tracking code", () => {
    expect(shippedSmsVariables("LS-1001", " TRK123 ")).toEqual(["LS-1001", "TRK123"]);
  });

  it("uses '-' when there is no tracking code", () => {
    expect(shippedSmsVariables("LS-1001", null)).toEqual(["LS-1001", "-"]);
    expect(shippedSmsVariables("LS-1001", undefined)).toEqual(["LS-1001", "-"]);
    expect(shippedSmsVariables("LS-1001", "  ")).toEqual(["LS-1001", "-"]);
    expect(shippedSmsVariables("LS-1001", "-")).toEqual(["LS-1001", "-"]);
  });

  it("encodes into the pattern's ';'-separated text", () => {
    expect(encodePatternVariables(shippedSmsVariables("LS-1001", "TRK123"))).toBe("LS-1001;TRK123");
  });
});

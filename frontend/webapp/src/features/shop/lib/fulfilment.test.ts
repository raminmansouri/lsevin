import { describe, expect, it } from "vitest";

import {
  checkoutRequirements,
  DEFAULT_HANDLING_DAYS,
  hasUsablePhone,
  isPartnerSeller,
  lineHandlingDays,
  orderHandlingDays,
  promiseDays,
} from "./fulfilment";

const delivery = (etaMinDays: number | null, etaMaxDays: number | null) => ({ isPickup: false, etaMinDays, etaMaxDays });
const officePickup = { isPickup: true, etaMinDays: 0, etaMaxDays: 0 };

describe("the one estimate for the whole order (Lsevin sends everything)", () => {
  it("is the slowest seller's handling days + Lsevin's delivery: clinic 7 days + post 3 days = 10", () => {
    const handling = orderHandlingDays([{ handlingDays: 2 }, { handlingDays: 7 }]);
    expect(handling).toBe(7);
    expect(promiseDays(handling, delivery(1, 3))).toBe(10);
  });

  it("office pickup adds no transit: ready when the slowest seller's items are at Lsevin", () => {
    expect(promiseDays(orderHandlingDays([{ handlingDays: 7 }, { handlingDays: 2 }]), officePickup)).toBe(7);
  });

  it("uses the minimum transit when the method has no maximum", () => {
    expect(promiseDays(2, delivery(4, null))).toBe(6);
  });

  it("is unknown (no promise) when the delivery method has no transit time, or nothing is chosen", () => {
    expect(promiseDays(2, delivery(null, null))).toBeNull();
    expect(promiseDays(2, null)).toBeNull();
  });

  it("missing or invalid handling days count as the default", () => {
    expect(orderHandlingDays([{ handlingDays: null }, { handlingDays: undefined }])).toBe(DEFAULT_HANDLING_DAYS);
    expect(orderHandlingDays([{ handlingDays: -3 }])).toBe(DEFAULT_HANDLING_DAYS);
    expect(lineHandlingDays(null)).toBe(DEFAULT_HANDLING_DAYS);
    expect(lineHandlingDays(0)).toBe(0);
    expect(orderHandlingDays([])).toBe(0);
  });
});

describe("what the checkout asks for", () => {
  it("delivery needs the address; office pickup needs a mobile instead", () => {
    expect(checkoutRequirements({ isPickup: false })).toEqual({ needsAddress: true, needsPhone: false });
    expect(checkoutRequirements({ isPickup: true })).toEqual({ needsAddress: false, needsPhone: true });
    expect(checkoutRequirements(null)).toEqual({ needsAddress: true, needsPhone: false });
  });

  it("a usable mobile has 8 to 15 digits; Persian digits and spacing are fine", () => {
    expect(hasUsablePhone("0912 123 4567")).toBe(true);
    expect(hasUsablePhone("۰۹۱۲۱۲۳۴۵۶۷")).toBe(true);
    expect(hasUsablePhone("+98 912 123 4567")).toBe(true);
    expect(hasUsablePhone("")).toBe(false);
    expect(hasUsablePhone(null)).toBe(false);
    expect(hasUsablePhone("12345")).toBe(false);
    expect(hasUsablePhone("1234567890123456")).toBe(false);
  });
});

describe("partner sellers", () => {
  it("any seller other than Lsevin itself is a partner (sold by them, sent by Lsevin)", () => {
    expect(isPartnerSeller({ sellerId: "clinic", isDefault: false })).toBe(true);
    expect(isPartnerSeller({ sellerId: "lsevin", isDefault: true })).toBe(false);
    expect(isPartnerSeller({ sellerId: null, isDefault: false })).toBe(false);
  });
});

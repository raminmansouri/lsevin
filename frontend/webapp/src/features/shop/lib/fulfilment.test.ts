import { describe, expect, it } from "vitest";

import {
  canMoveSellerPart,
  checkoutRequirements,
  customerCanCancel,
  DEFAULT_HANDLING_DAYS,
  DEFAULT_SELLER_DELIVERY_DAYS,
  groupBySeller,
  hasUsablePhone,
  isPartnerSeller,
  lineHandlingDays,
  normalizeTrackingCode,
  orderHandlingDays,
  overallPromiseDays,
  pickupAllowed,
  sellerDeliveryDays,
  sellerShippingFee,
  shipmentPromiseDays,
} from "./fulfilment";

const delivery = (etaMinDays: number | null, etaMaxDays: number | null) => ({ isPickup: false, etaMinDays, etaMaxDays });
const pickup = { isPickup: true, etaMinDays: 0, etaMaxDays: 0 };

describe("estimates: each seller ships its own part; the order's estimate is the latest shipment", () => {
  it("a shipment is the seller's handling days + its longest delivery days", () => {
    expect(shipmentPromiseDays(2, delivery(1, 3))).toBe(5);
    expect(shipmentPromiseDays(2, delivery(4, null))).toBe(6);
  });

  it("pickup adds no transit: ready after the seller's handling days", () => {
    expect(shipmentPromiseDays(orderHandlingDays([{ handlingDays: 7 }, { handlingDays: 2 }]), pickup)).toBe(7);
  });

  it("is unknown when the transit time is unknown, or nothing is chosen", () => {
    expect(shipmentPromiseDays(2, delivery(null, null))).toBeNull();
    expect(shipmentPromiseDays(2, null)).toBeNull();
  });

  it("two sellers: Lsevin 1+3 days and a clinic 7+2 days -> the order arrives within 9 days", () => {
    expect(overallPromiseDays([{ promiseDays: 4 }, { promiseDays: 9 }])).toBe(9);
    expect(overallPromiseDays([{ promiseDays: 4 }, { promiseDays: null }])).toBeNull();
    expect(overallPromiseDays([])).toBeNull();
  });

  it("missing or invalid handling days count as the default", () => {
    expect(orderHandlingDays([{ handlingDays: null }, { handlingDays: undefined }])).toBe(DEFAULT_HANDLING_DAYS);
    expect(orderHandlingDays([{ handlingDays: -3 }])).toBe(DEFAULT_HANDLING_DAYS);
    expect(lineHandlingDays(null)).toBe(DEFAULT_HANDLING_DAYS);
    expect(lineHandlingDays(0)).toBe(0);
    expect(orderHandlingDays([])).toBe(0);
  });
});

describe("seller shipping settings", () => {
  it("the fee charged is the seller's fee, never above the admin cap", () => {
    expect(sellerShippingFee(900000, 600000)).toBe(600000);
    expect(sellerShippingFee(400000, 600000)).toBe(400000);
    expect(sellerShippingFee(400000, null)).toBe(400000);
    expect(sellerShippingFee(null, 600000)).toBe(0);
    expect(sellerShippingFee(-5, null)).toBe(0);
    expect(sellerShippingFee(500000, 0)).toBe(0);
  });

  it("a seller without delivery days gets the default; one side set fills the other", () => {
    expect(sellerDeliveryDays(null, null)).toEqual({ min: DEFAULT_SELLER_DELIVERY_DAYS.min, max: DEFAULT_SELLER_DELIVERY_DAYS.max });
    expect(sellerDeliveryDays(2, 5)).toEqual({ min: 2, max: 5 });
    expect(sellerDeliveryDays(null, 4)).toEqual({ min: 4, max: 4 });
    expect(sellerDeliveryDays(3, null)).toEqual({ min: 3, max: 3 });
  });
});

describe("in-person pickup only from one seller", () => {
  it("groups lines by seller; a line without a seller is the default seller's", () => {
    const groups = groupBySeller([{ sellerId: "clinic" }, { sellerId: null }, { sellerId: "lsevin" }], "lsevin");
    expect([...groups.keys()]).toEqual(["clinic", "lsevin"]);
    expect(groups.get("lsevin")).toHaveLength(2);
  });

  it("allows pickup for a single-seller cart only", () => {
    expect(pickupAllowed([{ sellerId: "clinic" }, { sellerId: "clinic" }], "lsevin")).toBe(true);
    expect(pickupAllowed([{ sellerId: null }, { sellerId: "lsevin" }], "lsevin")).toBe(true);
    expect(pickupAllowed([{ sellerId: "clinic" }, { sellerId: "lsevin" }], "lsevin")).toBe(false);
    expect(pickupAllowed([{ sellerId: "clinic-a" }, { sellerId: "clinic-b" }], "lsevin")).toBe(false);
    expect(pickupAllowed([], "lsevin")).toBe(false);
  });
});

describe("the seller's part of an order", () => {
  it("shipping: new -> preparing -> shipped -> delivery_requested; never ready for pickup", () => {
    expect(canMoveSellerPart("shipping", "new", "preparing")).toBe(true);
    expect(canMoveSellerPart("shipping", "preparing", "shipped")).toBe(true);
    expect(canMoveSellerPart("shipping", "new", "shipped")).toBe(true);
    expect(canMoveSellerPart("shipping", "shipped", "delivery_requested")).toBe(true);
    expect(canMoveSellerPart("shipping", "preparing", "delivery_requested")).toBe(false);
    expect(canMoveSellerPart("shipping", "new", "ready_for_pickup")).toBe(false);
    expect(canMoveSellerPart("shipping", "shipped", "preparing")).toBe(false);
    expect(canMoveSellerPart("shipping", "completed", "shipped")).toBe(false);
  });

  it("pickup: new -> ready_for_pickup -> delivery_requested; never shipped", () => {
    expect(canMoveSellerPart("pickup", "new", "ready_for_pickup")).toBe(true);
    expect(canMoveSellerPart("pickup", "ready_for_pickup", "delivery_requested")).toBe(true);
    expect(canMoveSellerPart("pickup", "new", "delivery_requested")).toBe(false);
    expect(canMoveSellerPart("pickup", "new", "shipped")).toBe(false);
  });

  it("the customer may cancel until a seller ships or makes its part ready for pickup", () => {
    expect(customerCanCancel([{ status: "new" }, { status: "preparing" }])).toBe(true);
    expect(customerCanCancel([{ status: "new" }, { status: "shipped" }])).toBe(false);
    expect(customerCanCancel([{ status: "ready_for_pickup" }])).toBe(false);
    expect(customerCanCancel([])).toBe(true);
  });

  it("a tracking code has 3 to 64 characters", () => {
    expect(normalizeTrackingCode("  PST-123 ")).toBe("PST-123");
    expect(normalizeTrackingCode("ab")).toBeNull();
    expect(normalizeTrackingCode(null)).toBeNull();
    expect(normalizeTrackingCode("x".repeat(65))).toBeNull();
  });
});

describe("what the checkout asks for", () => {
  it("shipping needs the address; pickup needs a mobile instead", () => {
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
  it("any seller other than Lsevin itself is a partner (sold and sent by them)", () => {
    expect(isPartnerSeller({ sellerId: "clinic", isDefault: false })).toBe(true);
    expect(isPartnerSeller({ sellerId: "lsevin", isDefault: true })).toBe(false);
    expect(isPartnerSeller({ sellerId: null, isDefault: false })).toBe(false);
  });
});

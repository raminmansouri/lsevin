import { describe, expect, it } from "vitest";

import { getCheckoutIssues } from "./checkout-validation";

const valid = {
  email: " buyer@example.com ",
  address: {
    fullName: "Test Buyer",
    country: "IR",
    city: "Tehran",
    addressLine1: "Address 123",
  },
  note: "",
  deliveryId: "delivery",
  paymentCode: "gateway",
  deliveryOptions: [{ id: "delivery" }],
  paymentMethods: [{ code: "gateway" }],
  blockingIssues: [],
  hasUnavailablePrice: false,
  quoteFailed: false,
};
describe("checkout readiness matches server validation and always explains blockers", () => {
  it("accepts trimmed valid email and address", () =>
    expect(getCheckoutIssues(valid)).toEqual([]));
  it("identifies every missing field", () =>
    expect(
      getCheckoutIssues({ ...valid, email: "", address: {} }).map(
        (i) => i.target
      )
    ).toEqual(["email", "fullName", "country", "city", "addressLine1"]));
  it("rejects short country, invalid email and overlong city before submission", () =>
    expect(
      getCheckoutIssues({
        ...valid,
        email: "bad",
        address: { ...valid.address, country: "I", city: "x".repeat(16) },
      })
    ).toEqual(
      expect.arrayContaining([
        { target: "email", kind: "email" },
        { target: "country", kind: "minLength", min: 2 },
        { target: "city", kind: "maxLength", max: 15 },
      ])
    ));
  it("explains missing methods and stale selected IDs", () => {
    expect(
      getCheckoutIssues({
        ...valid,
        deliveryOptions: [],
        paymentMethods: [],
      }).map((i) => i.kind)
    ).toEqual(["noDelivery", "noPayment"]);
    expect(
      getCheckoutIssues({
        ...valid,
        deliveryId: "removed",
        paymentCode: "removed",
      }).map((i) => i.kind)
    ).toEqual(["delivery", "payment"]);
  });
  it("maps server cart blockers to user-facing categories", () =>
    expect(
      getCheckoutIssues({
        ...valid,
        blockingIssues: [
          "cart_empty",
          "out_of_stock:line",
          "price_unavailable:line",
          "coupon_invalid:expired",
          "unknown",
        ],
      }).map((i) => i.kind)
    ).toEqual(["cartEmpty", "stock", "price", "coupon", "unavailable"]));
  it("does not repeat the unavailable-delivery message", () =>
    expect(
      getCheckoutIssues({
        ...valid,
        deliveryOptions: [],
        blockingIssues: ["no_delivery_to_destination"],
      })
    ).toHaveLength(1));
  it("blocks stale quotes and excessive optional fields", () =>
    expect(
      getCheckoutIssues({
        ...valid,
        address: { ...valid.address, phoneNumber: "x".repeat(25) },
        note: "x".repeat(1001),
        quoteFailed: true,
      }).map((i) => i.target)
    ).toEqual(["phoneNumber", "orderNote", "quote"]));
});

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

describe("checkout readiness follows the chosen fulfilment", () => {
  const officePickup = {
    ...valid,
    address: { fullName: "Test Buyer", phoneNumber: "09121234567" },
    deliveryId: "office",
    deliveryOptions: [{ id: "post" }, { id: "office" }],
    needsAddress: false,
    needsPhone: true,
  };

  it("pickup at the Lsevin office needs only the name and a mobile, no address", () =>
    expect(getCheckoutIssues(officePickup)).toEqual([]));

  it("pickup at the Lsevin office without a mobile is blocked on the phone field", () =>
    expect(
      getCheckoutIssues({ ...officePickup, address: { fullName: "Test Buyer", phoneNumber: "" } })
    ).toEqual([{ target: "phoneNumber", kind: "required" }]));

  it("pickup at the Lsevin office still needs the name", () =>
    expect(
      getCheckoutIssues({ ...officePickup, address: { fullName: "", phoneNumber: "09121234567" } }).map((i) => i.target)
    ).toEqual(["fullName"]));

  it("a method must always be chosen, office pickup included", () =>
    expect(getCheckoutIssues({ ...officePickup, deliveryId: "" }).map((i) => i.kind)).toEqual(["delivery"]));

  it("delivery to the address needs the address, mobile optional (as before)", () => {
    expect(getCheckoutIssues({ ...valid, needsAddress: true, needsPhone: false })).toEqual([]);
    expect(
      getCheckoutIssues({ ...valid, address: { fullName: "Test Buyer" }, needsAddress: true, needsPhone: false }).map((i) => i.target)
    ).toEqual(["country", "city", "addressLine1"]);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { placeOrderAction, quoteCheckoutAction } from "./checkout.actions";

const mocks = vi.hoisted(() => ({
  quote: vi.fn(),
  order: vi.fn(),
  methods: vi.fn(),
  payment: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: async () => () => "Localized error",
}));
vi.mock("../lib/context", () => ({
  getShopContext: async () => ({ locale: "fa", customerId: "customer" }),
}));
vi.mock("../lib/analytics", () => ({ emitCommerceEvent: vi.fn() }));
vi.mock("../api/cart.repository", () => ({
  getCartView: async () => ({ currency: "IRR" }),
}));
vi.mock("../api/checkout.repository", () => ({
  quoteCheckout: mocks.quote,
  placeOrder: mocks.order,
  getPaymentMethods: mocks.methods,
}));
vi.mock("../api/address.repository", () => ({
  saveCustomerAddress: vi.fn(),
  listCustomerAddresses: vi.fn(),
  deleteCustomerAddress: vi.fn(),
}));
vi.mock("../server/shop-payment.service", () => ({
  startOrderPayment: mocks.payment,
}));

const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const input = {
  cartId: id,
  idempotencyKey: "checkout-test-key",
  email: "test@example.invalid",
  shippingAddress: {
    fullName: "Test Buyer",
    country: "IR",
    city: "Tehran",
    addressLine1: "Test address",
  },
  deliveryMethodId: id,
  paymentMethodCode: "gateway_card",
  paymentCurrency: "IRR",
};

beforeEach(() => {
  vi.clearAllMocks();
  mocks.methods.mockResolvedValue([
    { id, code: "gateway_card", currency: "IRT" },
  ]);
  mocks.order.mockResolvedValue({
    orderId: id,
    currency: "IRR",
    grandTotal: 1000000,
  });
  mocks.payment.mockResolvedValue({
    mode: "redirect",
    redirectUrl: "https://example.invalid/pay",
  });
});

describe("checkout request and payment failure boundaries", () => {
  it("rejects missing quote input before reaching the database", async () => {
    expect(await quoteCheckoutAction({})).toMatchObject({
      ok: false,
      category: "ValidationError",
    });
    expect(mocks.quote).not.toHaveBeenCalled();
  });
  it("does not expose a database failure as validation or leak its message", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.quote.mockRejectedValueOnce(
      Object.assign(new Error("private database detail"), { code: "08006" })
    );
    expect(await quoteCheckoutAction({ cartId: id })).toEqual({
      ok: false,
      category: "InfrastructureError",
      message: "Localized error",
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "private database detail"
    );
    log.mockRestore();
  });
  it("uses the selected server method and billing currency rather than submitted IDs", async () => {
    await placeOrderAction({
      ...input,
      paymentMethodId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    });
    expect(mocks.order).toHaveBeenCalledWith(
      expect.objectContaining({ paymentMethodId: id, paymentCurrency: "IRT" })
    );
  });
  it("rejects an unavailable payment method before creating an order", async () => {
    mocks.methods.mockResolvedValueOnce([]);
    await expect(placeOrderAction(input)).rejects.toThrow("not available");
    expect(mocks.order).not.toHaveBeenCalled();
  });
  it("preserves the order on gateway failure and returns a safe retry message", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    mocks.payment.mockRejectedValueOnce(new Error("secret gateway detail"));
    expect(await placeOrderAction(input)).toMatchObject({
      ok: true,
      order: { orderId: id },
      payment: { mode: "error", message: "Localized error" },
    });
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "secret gateway detail"
    );
    log.mockRestore();
  });
});
